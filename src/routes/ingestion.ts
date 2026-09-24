import { FastifyInstance } from 'fastify';
import { db } from '../db/client';
import { vendorResponses, sourceDocuments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '../utils/formatting';
import { SUPPORTED_MIME_TYPES } from '../domain/constants';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { processVendorResponse, extractVendorResponse } from '../processors/pipeline';

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const PARSED_DIR = join(process.cwd(), 'parsed');

export async function ingestionRoutes(app: FastifyInstance) {
  await mkdir(UPLOAD_DIR, { recursive: true });
  await mkdir(PARSED_DIR, { recursive: true });

  app.post('/api/ingestion/upload', async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.code(400).send({ error: 'No file uploaded' });

    const mimeType = data.mimetype;
    if (!SUPPORTED_MIME_TYPES[mimeType as keyof typeof SUPPORTED_MIME_TYPES]) {
      return reply.code(400).send({ error: `Unsupported file type: ${mimeType}` });
    }

    const rfxId = (request.query as any).rfxId || 'rfx-001';
    let vendorResponseId = (request.query as any).vendorResponseId;
    const customVendorName = (request.query as any).vendorName;

    if (!vendorResponseId) {
      vendorResponseId = generateId('vr');
      // Format human-friendly default name from filename
      const cleanName = data.filename
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      const initialName = customVendorName?.trim() || cleanName || 'Uploaded Vendor Quotation';

      await db.insert(vendorResponses).values({
        id: vendorResponseId,
        rfxId,
        vendorName: initialName,
        status: 'uploaded',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      const vr = await db.select().from(vendorResponses).where(eq(vendorResponses.id, vendorResponseId));
      if (!vr[0]) {
        const cleanName = data.filename
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
        await db.insert(vendorResponses).values({
          id: vendorResponseId,
          rfxId,
          vendorName: customVendorName?.trim() || cleanName || 'Uploaded Vendor Quotation',
          status: 'uploaded',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        await db.update(vendorResponses)
          .set({ status: 'uploaded', updatedAt: new Date().toISOString() })
          .where(eq(vendorResponses.id, vendorResponseId));
      }
    }

    const fileName = `${generateId('file')}-${data.filename}`;
    const filePath = join(UPLOAD_DIR, fileName);

    const buffer = await data.toBuffer();
    await writeFile(filePath, buffer);

    const docId = generateId('doc');
    await db.insert(sourceDocuments).values({
      id: docId,
      vendorResponseId,
      fileName: data.filename,
      mimeType,
      storagePath: filePath,
      uploadedAt: new Date().toISOString(),
    });

    return { documentId: docId, vendorResponseId, fileName: data.filename };
  });

  app.post('/api/ingestion/parse/:vendorResponseId', async (request) => {
    const { vendorResponseId } = request.params as { vendorResponseId: string };
    await processVendorResponse(vendorResponseId);
    return { status: 'completed' };
  });

  app.post('/api/ingestion/extract/:vendorResponseId', async (request) => {
    const { vendorResponseId } = request.params as { vendorResponseId: string };
    await extractVendorResponse(vendorResponseId);
    return { status: 'completed' };
  });

  app.get('/api/ingestion/status/:vendorResponseId', async (request) => {
    const { vendorResponseId } = request.params as { vendorResponseId: string };
    const vr = await db.select().from(vendorResponses).where(eq(vendorResponses.id, vendorResponseId));
    if (!vr[0]) throw new Error('Vendor response not found');
    
    const docs = await db.select().from(sourceDocuments)
      .where(eq(sourceDocuments.vendorResponseId, vendorResponseId));
    
    return { 
      status: vr[0].status,
      vendorResponseId: vr[0].id,
      vendorName: vr[0].vendorName,
      documents: docs.map(d => ({
        id: d.id,
        fileName: d.fileName,
        mimeType: d.mimeType,
        parsedPath: d.parsedPath,
        pageCount: d.pageCount,
        uploadedAt: d.uploadedAt,
      })),
    };
  });

  app.get('/api/ingestion/parsed/:documentId', async (request, reply) => {
    const { documentId } = request.params as { documentId: string };
    const doc = await db.select().from(sourceDocuments).where(eq(sourceDocuments.id, documentId));
    if (!doc[0]) return reply.code(404).send({ error: 'Document not found' });
    
    if (!doc[0].parsedPath) {
      return reply.code(404).send({ error: 'Document not yet parsed' });
    }
    
    try {
      const parsedPath = join(process.cwd(), doc[0].parsedPath);
      const content = await readFile(parsedPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return reply.code(500).send({ error: 'Failed to read parsed document' });
    }
  });

  app.get('/api/ingestion/documents/:vendorResponseId', async (request) => {
    const { vendorResponseId } = request.params as { vendorResponseId: string };
    const docs = await db.select().from(sourceDocuments)
      .where(eq(sourceDocuments.vendorResponseId, vendorResponseId));
    return docs;
  });

  // Single-call processor for manual uploads
  app.post('/api/ingestion/process/:vendorResponseId', async (request, reply) => {
    const { vendorResponseId } = request.params as { vendorResponseId: string };
    const vr = await db.select().from(vendorResponses).where(eq(vendorResponses.id, vendorResponseId));
    if (!vr[0]) return reply.code(404).send({ error: 'Vendor response not found' });

    await db.update(vendorResponses)
      .set({ status: 'parsing', updatedAt: new Date().toISOString() })
      .where(eq(vendorResponses.id, vendorResponseId));

    await processVendorResponse(vendorResponseId);

    await db.update(vendorResponses)
      .set({ status: 'extracting', updatedAt: new Date().toISOString() })
      .where(eq(vendorResponses.id, vendorResponseId));

    await extractVendorResponse(vendorResponseId);

    const updated = (await db.select().from(vendorResponses).where(eq(vendorResponses.id, vendorResponseId)))[0];
    return { status: updated?.status || 'completed', vendorResponseId };
  });

  // Reprocess single vendor response
  app.post('/api/ingestion/reprocess/:vendorResponseId', async (request, reply) => {
    const { vendorResponseId } = request.params as { vendorResponseId: string };
    const { extractedLines, questionnaireAnswers, vendorEligibility } = await import('../db/schema');

    // Clean previous extractions
    await db.delete(extractedLines).where(eq(extractedLines.vendorResponseId, vendorResponseId));
    await db.delete(questionnaireAnswers).where(eq(questionnaireAnswers.vendorResponseId, vendorResponseId));
    await db.delete(vendorEligibility).where(eq(vendorEligibility.vendorResponseId, vendorResponseId));

    await db.update(vendorResponses)
      .set({ status: 'parsing', updatedAt: new Date().toISOString() })
      .where(eq(vendorResponses.id, vendorResponseId));

    await processVendorResponse(vendorResponseId);

    await db.update(vendorResponses)
      .set({ status: 'extracting', updatedAt: new Date().toISOString() })
      .where(eq(vendorResponses.id, vendorResponseId));

    await extractVendorResponse(vendorResponseId);

    const updated = (await db.select().from(vendorResponses).where(eq(vendorResponses.id, vendorResponseId)))[0];
    return { status: updated?.status || 'completed', vendorResponseId };
  });

  let isDemoIngestionRunning = false;

  app.get('/api/ingestion/demo-status/:rfxId', async () => {
    return { isRunning: isDemoIngestionRunning };
  });

  // "Load Demo Responses" endpoint for live take-home demo
  app.post('/api/ingestion/load-demo-responses/:rfxId', async (request, reply) => {
    const { rfxId } = request.params as { rfxId: string };
    const force = (request.query as any)?.force === 'true';
    const { copyFile } = await import('fs/promises');
    const { existsSync } = await import('fs');
    const { extractedLines, questionnaireAnswers, vendorEligibility } = await import('../db/schema');

    if (isDemoIngestionRunning) {
      return {
        message: 'Demo ingestion is currently in progress. Responses are being processed in the background.',
        status: 'processing',
        inProgress: true,
      };
    }

    const demoVendors = [
      { id: 'vendor-001', file: 'vendor-a.xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { id: 'vendor-002', file: 'vendor-b.pdf', mimeType: 'application/pdf' },
      { id: 'vendor-003', file: 'vendor-c.docx', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      { id: 'vendor-004', file: 'vendor-d.png', mimeType: 'image/png' },
      { id: 'vendor-005', file: 'vendor-e.eml', mimeType: 'message/rfc822' },
    ];

    const demoDir = join(process.cwd(), 'demo', 'fixtures', 'vendors');

    // Duplicate detection: check if all 5 are already processed
    const currentResponses = await db.select().from(vendorResponses).where(eq(vendorResponses.rfxId, rfxId));
    const processedCount = currentResponses.filter(r => r.status === 'ready' || r.status === 'review_required' || r.status === 'extracted').length;

    if (processedCount === demoVendors.length && !force) {
      return {
        message: 'Already processed. All 5 demo vendor responses are already loaded and extracted.',
        alreadyProcessed: true,
        count: processedCount,
      };
    }

    isDemoIngestionRunning = true;

    const demoNames: Record<string, string> = {
      'vendor-001': 'Apex Packaging Solutions Pvt Ltd',
      'vendor-002': 'PackRight Corrugators Ltd',
      'vendor-003': 'EcoKraft Paper & Packaging LLP',
      'vendor-004': 'Vardhman Cartons & Containers',
      'vendor-005': 'Global Star Packaging International LLC',
    };

    // Ensure vendor records exist and mark as parsing so polling UI detects active progress
    for (const demo of demoVendors) {
      const existingVr = currentResponses.find(r => r.id === demo.id);
      if (!existingVr) {
        await db.insert(vendorResponses).values({
          id: demo.id,
          rfxId,
          vendorName: demoNames[demo.id] || `Vendor ${demo.id}`,
          status: 'parsing',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else if (existingVr.status === 'not_received' || force) {
        await db.update(vendorResponses)
          .set({ status: 'parsing', updatedAt: new Date().toISOString() })
          .where(eq(vendorResponses.id, demo.id));
      }
    }

    // Launch background worker to process through real pipeline sequentially without HTTP timeout
    (async () => {
      try {
        console.log(`[Demo Ingestion Worker] Starting demo ingestion for ${demoVendors.length} vendors...`);

        for (const demo of demoVendors) {
          const srcFile = join(demoDir, demo.file);
          if (!existsSync(srcFile)) {
            console.error(`[Demo Ingestion Worker] Fixture file not found: ${srcFile}`);
            continue;
          }

          // Check if already processed (unless forced)
          const latestVr = (await db.select().from(vendorResponses).where(eq(vendorResponses.id, demo.id)))[0];
          if (latestVr && (latestVr.status === 'ready' || latestVr.status === 'review_required') && !force) {
            console.log(`[Demo Ingestion Worker] Skipping ${demo.id} (already ${latestVr.status})`);
            continue;
          }

          try {
            // Clean prior records for idempotent reload
            await db.delete(extractedLines).where(eq(extractedLines.vendorResponseId, demo.id));
            await db.delete(questionnaireAnswers).where(eq(questionnaireAnswers.vendorResponseId, demo.id));
            await db.delete(vendorEligibility).where(eq(vendorEligibility.vendorResponseId, demo.id));
            await db.delete(sourceDocuments).where(eq(sourceDocuments.vendorResponseId, demo.id));

            // Copy file to uploads directory
            const destFileName = `demo-${demo.id}-${demo.file}`;
            const destFilePath = join(UPLOAD_DIR, destFileName);
            await copyFile(srcFile, destFilePath);

            // Register source document
            const docId = `doc-${demo.id}`;
            await db.insert(sourceDocuments).values({
              id: docId,
              vendorResponseId: demo.id,
              fileName: demo.file,
              mimeType: demo.mimeType,
              storagePath: destFilePath,
              uploadedAt: new Date().toISOString(),
            });

            // Step 1: Real parsing
            console.log(`[Demo Ingestion Worker] Parsing ${demo.file} for ${demo.id}...`);
            await db.update(vendorResponses)
              .set({ status: 'parsing', updatedAt: new Date().toISOString() })
              .where(eq(vendorResponses.id, demo.id));
            await processVendorResponse(demo.id);

            // Step 2: Real Gemini extraction & normalization
            console.log(`[Demo Ingestion Worker] Calling Gemini extraction for ${demo.id} (${demo.file})...`);
            await db.update(vendorResponses)
              .set({ status: 'extracting', updatedAt: new Date().toISOString() })
              .where(eq(vendorResponses.id, demo.id));
            await extractVendorResponse(demo.id);

            const finalVr = (await db.select().from(vendorResponses).where(eq(vendorResponses.id, demo.id)))[0];
            const lineCount = (await db.select().from(extractedLines).where(eq(extractedLines.vendorResponseId, demo.id))).length;
            console.log(`[Demo Ingestion Worker] Successfully finished ${demo.id}: status=${finalVr?.status}, extracted lines=${lineCount}`);
          } catch (vendorError) {
            console.error(`[Demo Ingestion Worker] Failed processing ${demo.id}:`, vendorError);
            await db.update(vendorResponses)
              .set({ status: 'review_required', updatedAt: new Date().toISOString() })
              .where(eq(vendorResponses.id, demo.id));
          }
        }
        console.log('[Demo Ingestion Worker] Completed demo ingestion cycle.');
      } catch (workerError) {
        console.error('[Demo Ingestion Worker Global Error]', workerError);
      } finally {
        isDemoIngestionRunning = false;
      }
    })();

    return {
      status: 'processing',
      message: 'Demo ingestion started in background for 5 vendors. The vendor responses list will update automatically.',
      inProgress: true,
      count: demoVendors.length,
    };
  });
}