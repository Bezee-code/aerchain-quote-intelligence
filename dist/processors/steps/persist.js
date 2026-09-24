import { db } from '@/db/client';
import { extractedLines, vendorResponses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/utils/formatting';
import { normalizeExtractedLine } from '@/services/normalization';
export async function persistExtraction(vendorResponse, sourceDoc, rfxLineItems, result) {
    for (const item of result.lineItems) {
        const rfxLine = rfxLineItems.find(l => l.id === item.vendorLineRef) || rfxLineItems[0];
        const raw = {
            vendorLineRef: item.vendorLineRef,
            description: item.description,
            price: item.price,
            currency: item.currency,
            unit: item.unit,
            quantity: item.quantity,
            terms: item.terms,
        };
        const { normalized, flags: normFlags } = normalizeExtractedLine(raw, rfxLine);
        const allFlags = [...new Set([...item.flags, ...normFlags])];
        await db.insert(extractedLines).values({
            id: generateId('el'),
            vendorResponseId: vendorResponse.id,
            sourceDocId: sourceDoc.id,
            rfxLineItemId: rfxLine.id,
            rawVendorLineRef: item.vendorLineRef,
            rawDescription: item.description,
            rawPrice: item.price,
            rawCurrency: item.currency,
            rawUnit: item.unit,
            rawQuantity: item.quantity,
            rawTerms: item.terms,
            normPricePerBaseUnit: normalized.pricePerBaseUnit,
            normTotalPrice: normalized.totalPrice,
            normCurrency: normalized.currency,
            normUnit: normalized.unit,
            normQuantity: normalized.quantity,
            normTerms: normalized.terms,
            confidenceOverall: item.confidence.overall,
            confidencePrice: item.confidence.price,
            confidenceCurrency: item.confidence.currency,
            confidenceUnit: item.confidence.unit,
            confidenceQuantity: item.confidence.quantity,
            confidenceTerms: item.confidence.terms,
            evidence: item.evidence,
            flags: allFlags,
            status: 'auto',
            updatedAt: new Date().toISOString(),
        });
    }
    await db.update(vendorResponses)
        .set({ status: 'extracted', updatedAt: new Date().toISOString() })
        .where(eq(vendorResponses.id, vendorResponse.id));
}
//# sourceMappingURL=persist.js.map