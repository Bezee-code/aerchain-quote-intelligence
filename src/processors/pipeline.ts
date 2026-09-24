import { parsePdf } from './parse/pdf';
import { parseExcel } from './parse/excel';
import { parseDocx } from './parse/docx';
import { parseImage } from './parse/image';
import { parseEmail } from './parse/email';
import { validateExtraction, addFlagsFromValidation, generateExtractionFlags } from './steps/validate';
import { normalizeLineItem } from './steps/normalize';
import { persistExtraction } from './steps/persist';
import { extractLineItems, mapEvidenceToSpans, type ExtractionInput, type ExtractionError } from '@/ai/extraction/extractor';
import { matchLinesToRFx } from '@/services/matching';
import { db } from '@/db/client';
import { rfxLineItems, vendorResponses, sourceDocuments } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import type { VendorResponse, RFxLineItem, SourceDoc, ParsedDocument } from '@/domain/types';
import { generateId } from '@/utils/formatting';
import { SUPPORTED_MIME_TYPES } from '@/domain/constants';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';

const PARSED_DIR = join(process.cwd(), 'parsed');

export async function processVendorResponse(vendorResponseId: string): Promise<void> {
  await db.update(vendorResponses)
    .set({ status: 'processing', updatedAt: new Date().toISOString() })
    .where(eq(vendorResponses.id, vendorResponseId));

  const vendorResponse = await getVendorResponse(vendorResponseId);
  if (!vendorResponse) throw new Error('Vendor response not found');

  const docs = await db.select().from(sourceDocuments)
    .where(eq(sourceDocuments.vendorResponseId, vendorResponseId));

  const rfxLines = await db.select().from(rfxLineItems)
    .where(eq(rfxLineItems.rfxId, vendorResponse.rfxId));

  let parseSuccessCount = 0;
  let parseErrorCount = 0;

  for (const doc of docs) {
    try {
      const parsed = await parseDocument(doc.storagePath, doc.mimeType);
      
      await saveParsedDocument(doc.id, parsed);
      
      await db.update(sourceDocuments)
        .set({ 
          parsedPath: `./parsed/${doc.id}.json`, 
          pageCount: parsed.metadata.pageCount || parsed.images.length || 1 
        })
        .where(eq(sourceDocuments.id, doc.id));
      
      parseSuccessCount++;
    } catch (error) {
      console.error(`Failed to parse document ${doc.id}:`, error);
      parseErrorCount++;
      
      await db.update(sourceDocuments)
        .set({ 
          parsedPath: `./parsed/${doc.id}.error.json` 
        })
        .where(eq(sourceDocuments.id, doc.id));
      
      await saveParsedError(doc.id, error);
    }
  }

  const parseStatus = parseSuccessCount > 0 ? 'parsed' : 'failed';
  await db.update(vendorResponses)
    .set({ status: parseStatus, updatedAt: new Date().toISOString() })
    .where(eq(vendorResponses.id, vendorResponseId));
}

export async function extractVendorResponse(vendorResponseId: string): Promise<void> {
  await db.update(vendorResponses)
    .set({ status: 'extracting', updatedAt: new Date().toISOString() })
    .where(eq(vendorResponses.id, vendorResponseId));

  const vendorResponse = await getVendorResponse(vendorResponseId);
  if (!vendorResponse) throw new Error('Vendor response not found');

  const docs = await db.select().from(sourceDocuments)
    .where(eq(sourceDocuments.vendorResponseId, vendorResponseId));

  const rfxLines = await db.select().from(rfxLineItems)
    .where(eq(rfxLineItems.rfxId, vendorResponse.rfxId));

  let extractionSuccessCount = 0;
  let extractionErrorCount = 0;
  let hasConfigurationError = false;

  for (const doc of docs) {
    if (!doc.parsedPath || doc.parsedPath.endsWith('.error.json')) {
      continue;
    }

    try {
      const parsedContent = await readParsedDocument(doc.id);
      
      const extractionInput: ExtractionInput = {
        rfxLineItems: rfxLines as RFxLineItem[],
        parsedDoc: parsedContent,
      };

      let result = await extractLineItems(extractionInput);
      result = mapEvidenceToSpans(result, parsedContent);
      result = validateExtraction(result);

      for (const item of result.lineItems) {
        const matched = matchLinesToRFx(
          [{ ...item, rfxLineItemId: '' }] as any,
          rfxLines as RFxLineItem[]
        );
        for (const [rfxId, matches] of matched) {
          if (matches.length > 0) {
            item.vendorLineRef = rfxId;
          }
        }
        
        const rfxMatch = rfxLines.find(l => l.id === item.matchedRfxLineItemId || item.vendorLineRef);
        item.flags = generateExtractionFlags(item, rfxMatch ? { unit: rfxMatch.unit, quantity: rfxMatch.quantity } : undefined);
      }

      await persistExtraction(vendorResponse, doc as SourceDoc, rfxLines as RFxLineItem[], result);
      extractionSuccessCount++;
    } catch (error) {
      extractionErrorCount++;
      
      if (error instanceof Error && (error as ExtractionError).isConfigurationError) {
        hasConfigurationError = true;
        console.error(`Configuration error during extraction for ${doc.id}:`, error.message);
      } else {
        console.error(`Failed to extract document ${doc.id}:`, error);
      }
    }
  }

  if (hasConfigurationError || (extractionSuccessCount === 0 && extractionErrorCount > 0)) {
    await db.update(vendorResponses)
      .set({ status: 'failed', updatedAt: new Date().toISOString() })
      .where(eq(vendorResponses.id, vendorResponseId));
  }
}

async function getVendorResponse(id: string): Promise<VendorResponse | null> {
  const result = await db.select().from(vendorResponses).where(eq(vendorResponses.id, id));
  return result[0] || null;
}

export async function parseDocument(filePath: string, mimeType: string): Promise<ParsedDocument> {
  const parser = SUPPORTED_MIME_TYPES[mimeType as keyof typeof SUPPORTED_MIME_TYPES];
  switch (parser) {
    case 'pdf': return parsePdf(filePath);
    case 'xlsx': case 'csv': return parseExcel(filePath);
    case 'docx': return parseDocx(filePath);
    case 'image': return parseImage(filePath);
    case 'email': return parseEmail(filePath);
    default: throw new Error(`Unsupported mime type: ${mimeType}`);
  }
}

async function saveParsedDocument(docId: string, parsed: ParsedDocument): Promise<void> {
  await mkdir(PARSED_DIR, { recursive: true });
  const filePath = join(PARSED_DIR, `${docId}.json`);
  await writeFile(filePath, JSON.stringify(parsed, null, 2));
}

async function saveParsedError(docId: string, error: unknown): Promise<void> {
  await mkdir(PARSED_DIR, { recursive: true });
  const filePath = join(PARSED_DIR, `${docId}.error.json`);
  const errorObj = error instanceof Error ? { message: error.message, stack: error.stack } : { message: String(error) };
  await writeFile(filePath, JSON.stringify(errorObj, null, 2));
}

async function readParsedDocument(docId: string): Promise<ParsedDocument> {
  const filePath = join(PARSED_DIR, `${docId}.json`);
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content);
}