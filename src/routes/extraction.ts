import { FastifyInstance } from 'fastify';
import { db } from '../db/client';
import { extractedLines, rfxLineItems } from '../db/schema';
import { eq } from 'drizzle-orm';
import { normalizeExtractedLine, applyBuyerOverride } from '../services/normalization';

export async function extractionRoutes(app: FastifyInstance) {
  app.get('/api/extraction/:vendorResponseId', async (request) => {
    const { vendorResponseId } = request.params as { vendorResponseId: string };
    const lines = await db.select().from(extractedLines)
      .where(eq(extractedLines.vendorResponseId, vendorResponseId));
    return lines;
  });

  app.get('/api/extraction/line/:id', async (request) => {
    const { id } = request.params as { id: string };
    const result = await db.select().from(extractedLines).where(eq(extractedLines.id, id));
    if (!result[0]) throw new Error('Extraction not found');
    return result[0];
  });

  app.post('/api/extraction/:id/override', async (request) => {
    const { id } = request.params as { id: string };
    const override = request.body as { pricePerBaseUnit?: number; unit?: string; terms?: any };

    const existing = await db.select().from(extractedLines).where(eq(extractedLines.id, id));
    if (!existing[0]) throw new Error('Extraction not found');

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

    const rfxItems = await db.select().from(rfxLineItems).where(eq(rfxLineItems.id, line.rfxLineItemId));
    const rfxLine = rfxItems[0] || { quantity: line.normQuantity, unit: 'EA' as const };
    let normalized = normalizeExtractedLine(raw, rfxLine as any).normalized;
    normalized = applyBuyerOverride(normalized, override, rfxLine.quantity, raw, rfxLine.unit as any);

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
    const { id } = request.params as { id: string };
    await db.update(extractedLines)
      .set({ status: 'reviewed', updatedAt: new Date().toISOString() })
      .where(eq(extractedLines.id, id));
    return { success: true };
  });
}