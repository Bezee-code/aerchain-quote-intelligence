import { FastifyInstance } from 'fastify';
import { db } from '../db/client';
import { rfx, rfxLineItems } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function rfxRoutes(app: FastifyInstance) {
  app.get('/api/rfx', async () => {
    const result = await db.select().from(rfx);
    return result;
  });

  app.get('/api/rfx/:id', async (request) => {
    const { id } = request.params as { id: string };
    const rfxResult = await db.select().from(rfx).where(eq(rfx.id, id));
    if (!rfxResult[0]) throw new Error('RFx not found');

    const lines = await db.select().from(rfxLineItems).where(eq(rfxLineItems.rfxId, id));
    return { ...rfxResult[0], lineItems: lines };
  });

  app.get('/api/rfx/:id/comparison', async (request) => {
    const { id } = request.params as { id: string };
    const { buildComparison } = await import('../services/comparison');
    const onlyFeasible = (request.query as any).feasible === 'true';
    return await buildComparison(id, onlyFeasible);
  });

  app.get('/api/rfx/:id/responses', async (request) => {
    const { id } = request.params as { id: string };
    const { vendorResponses, sourceDocuments, extractedLines, rfxLineItems, vendorEligibility } = await import('../db/schema');
    const { eq } = await import('drizzle-orm');

    const totalLines = (await db.select().from(rfxLineItems).where(eq(rfxLineItems.rfxId, id))).length;
    const allVendors = await db.select().from(vendorResponses).where(eq(vendorResponses.rfxId, id));
    // Filter out un-uploaded placeholder vendors so clean slate or dynamic uploads only show active vendors
    const vendors = allVendors.filter(v => v.status !== 'not_received');

    const responseList = [];
    for (const v of vendors) {
      const docs = await db.select().from(sourceDocuments).where(eq(sourceDocuments.vendorResponseId, v.id));
      const doc = docs[docs.length - 1] || null;

      const lines = await db.select().from(extractedLines).where(eq(extractedLines.vendorResponseId, v.id));
      const eligibility = (await db.select().from(vendorEligibility).where(eq(vendorEligibility.vendorResponseId, v.id)))[0];

      let format = '—';
      if (doc) {
        const ext = doc.fileName.split('.').pop()?.toUpperCase();
        format = ext || doc.mimeType;
      }

      let exceptionsCount = 0;
      for (const line of lines) {
        const flags = (line.flags as string[]) || [];
        if (flags.length > 0 || line.confidenceOverall < 0.7) {
          exceptionsCount += flags.length > 0 ? flags.length : 1;
        }
      }

      responseList.push({
        id: v.id,
        vendorName: v.vendorName,
        status: v.status,
        responseFormat: format,
        document: doc ? {
          id: doc.id,
          fileName: doc.fileName,
          mimeType: doc.mimeType,
          uploadedAt: doc.uploadedAt,
        } : null,
        coverage: {
          quotedCount: lines.length,
          totalCount: totalLines,
        },
        exceptionsCount,
        isEligible: eligibility ? eligibility.isEligible : null,
        disqualificationReasons: eligibility ? (eligibility.disqualificationReasons as string[]) : [],
        updatedAt: v.updatedAt,
      });
    }

    return responseList;
  });

  app.delete('/api/rfx/:id/responses/:vendorResponseId', async (request) => {
    const { vendorResponseId } = request.params as { id: string; vendorResponseId: string };
    const { vendorResponses, sourceDocuments, extractedLines, questionnaireAnswers, vendorEligibility } = await import('../db/schema');
    const { eq } = await import('drizzle-orm');

    await db.delete(extractedLines).where(eq(extractedLines.vendorResponseId, vendorResponseId));
    await db.delete(questionnaireAnswers).where(eq(questionnaireAnswers.vendorResponseId, vendorResponseId));
    await db.delete(vendorEligibility).where(eq(vendorEligibility.vendorResponseId, vendorResponseId));
    await db.delete(sourceDocuments).where(eq(sourceDocuments.vendorResponseId, vendorResponseId));
    await db.delete(vendorResponses).where(eq(vendorResponses.id, vendorResponseId));

    return { success: true, vendorResponseId };
  });

  app.post('/api/rfx/:id/reset', async (request) => {
    const { id } = request.params as { id: string };
    const { vendorResponses, sourceDocuments, extractedLines, questionnaireAnswers, vendorEligibility } = await import('../db/schema');
    const { eq } = await import('drizzle-orm');

    const vendors = await db.select().from(vendorResponses).where(eq(vendorResponses.rfxId, id));
    for (const v of vendors) {
      await db.delete(extractedLines).where(eq(extractedLines.vendorResponseId, v.id));
      await db.delete(questionnaireAnswers).where(eq(questionnaireAnswers.vendorResponseId, v.id));
      await db.delete(vendorEligibility).where(eq(vendorEligibility.vendorResponseId, v.id));
      await db.delete(sourceDocuments).where(eq(sourceDocuments.vendorResponseId, v.id));
      await db.delete(vendorResponses).where(eq(vendorResponses.id, v.id));
    }

    return { success: true, message: 'RFx quotation data reset to clean slate. 0 vendors remaining.' };
  });
}