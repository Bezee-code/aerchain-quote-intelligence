import { db } from '../db/client';
import { extractedLines } from '../db/schema';
import { eq } from 'drizzle-orm';
import { normalizeExtractedLine, applyBuyerOverride } from '../services/normalization';
export async function extractionRoutes(app) {
    app.get('/api/extraction/:vendorResponseId', async (request) => {
        const { vendorResponseId } = request.params;
        const lines = await db.select().from(extractedLines)
            .where(eq(extractedLines.vendorResponseId, vendorResponseId));
        return lines;
    });
    app.get('/api/extraction/line/:id', async (request) => {
        const { id } = request.params;
        const result = await db.select().from(extractedLines).where(eq(extractedLines.id, id));
        if (!result[0])
            throw new Error('Extraction not found');
        return result[0];
    });
    app.post('/api/extraction/:id/override', async (request) => {
        const { id } = request.params;
        const override = request.body;
        const existing = await db.select().from(extractedLines).where(eq(extractedLines.id, id));
        if (!existing[0])
            throw new Error('Extraction not found');
        const line = existing[0];
        const raw = {
            vendorLineRef: line.rawVendorLineRef,
            description: line.rawDescription,
            price: line.rawPrice,
            currency: line.rawCurrency,
            unit: line.rawUnit,
            quantity: line.rawQuantity,
            terms: line.rawTerms,
        };
        const rfxLine = { quantity: line.normQuantity, unit: line.normUnit };
        let normalized = normalizeExtractedLine(raw, rfxLine).normalized;
        normalized = applyBuyerOverride(normalized, override, line.normQuantity);
        await db.update(extractedLines)
            .set({
            normPricePerBaseUnit: normalized.pricePerBaseUnit,
            normTotalPrice: normalized.totalPrice,
            normUnit: normalized.unit,
            normTerms: normalized.terms,
            buyerOverride: { ...override, correctedAt: new Date().toISOString() },
            status: 'corrected',
            updatedAt: new Date().toISOString(),
        })
            .where(eq(extractedLines.id, id));
        return { success: true };
    });
    app.post('/api/extraction/:id/review', async (request) => {
        const { id } = request.params;
        await db.update(extractedLines)
            .set({ status: 'reviewed', updatedAt: new Date().toISOString() })
            .where(eq(extractedLines.id, id));
        return { success: true };
    });
}
//# sourceMappingURL=extraction.js.map