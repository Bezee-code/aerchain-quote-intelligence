import { parsePdf } from './parse/pdf';
import { parseExcel } from './parse/excel';
import { parseDocx } from './parse/docx';
import { parseImage } from './parse/image';
import { parseEmail } from './parse/email';
import { validateExtraction, addFlagsFromValidation } from './steps/validate';
import { persistExtraction } from './steps/persist';
import { extractLineItems, mapEvidenceToSpans } from '@/ai/extraction/extractor';
import { matchLinesToRFx } from '@/services/matching';
import { db } from '@/db/client';
import { rfxLineItems, vendorResponses, sourceDocuments } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { SUPPORTED_MIME_TYPES } from '@/domain/constants';
export async function processVendorResponse(vendorResponseId) {
    await db.update(vendorResponses)
        .set({ status: 'processing', updatedAt: new Date().toISOString() })
        .where(eq(vendorResponses.id, vendorResponseId));
    const vendorResponse = await getVendorResponse(vendorResponseId);
    if (!vendorResponse)
        throw new Error('Vendor response not found');
    const docs = await db.select().from(sourceDocuments)
        .where(eq(sourceDocuments.vendorResponseId, vendorResponseId));
    const rfxLines = await db.select().from(rfxLineItems)
        .where(eq(rfxLineItems.rfxId, vendorResponse.rfxId));
    for (const doc of docs) {
        const parsed = await parseDocument(doc.storagePath, doc.mimeType);
        await db.update(sourceDocuments)
            .set({ parsedPath: `./parsed/${doc.id}.json`, pageCount: parsed.images.length || 1 })
            .where(eq(sourceDocuments.id, doc.id));
        const extractionInput = {
            rfxLineItems: rfxLines,
            parsedDoc: parsed,
        };
        let result = await extractLineItems(extractionInput);
        result = mapEvidenceToSpans(result, parsed);
        result = validateExtraction(result);
        for (const item of result.lineItems) {
            const matched = matchLinesToRFx([{ ...item, rfxLineItemId: '' }], rfxLines);
            for (const [rfxId, matches] of matched) {
                if (matches.length > 0) {
                    item.vendorLineRef = rfxId;
                }
            }
            item.flags = addFlagsFromValidation(item, rfxLines[0]);
        }
        await persistExtraction(vendorResponse, doc, rfxLines, result);
    }
    await db.update(vendorResponses)
        .set({ status: 'extracted', updatedAt: new Date().toISOString() })
        .where(eq(vendorResponses.id, vendorResponseId));
}
async function getVendorResponse(id) {
    const result = await db.select().from(vendorResponses).where(eq(vendorResponses.id, id));
    return result[0] || null;
}
async function parseDocument(filePath, mimeType) {
    const parser = SUPPORTED_MIME_TYPES[mimeType];
    switch (parser) {
        case 'pdf': return parsePdf(filePath);
        case 'xlsx':
        case 'csv': return parseExcel(filePath);
        case 'docx': return parseDocx(filePath);
        case 'image': return parseImage(filePath);
        case 'email': return parseEmail(filePath);
        default: throw new Error(`Unsupported mime type: ${mimeType}`);
    }
}
//# sourceMappingURL=pipeline.js.map