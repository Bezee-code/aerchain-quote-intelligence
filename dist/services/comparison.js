import { db } from '../db/client';
import { rfxLineItems, extractedLines, vendorResponses, vendorEligibility } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { applyBuyerOverride } from './normalization';
import { computeCheapestVendor } from './matching';
export async function buildComparison(rfxId, onlyFeasible = false) {
    const lines = await db.select().from(rfxLineItems).where(eq(rfxLineItems.rfxId, rfxId));
    const vendors = await db.select().from(vendorResponses).where(eq(vendorResponses.rfxId, rfxId));
    const eligibilityMap = new Map();
    if (onlyFeasible) {
        const eligibility = await db.select().from(vendorEligibility).where(inArray(vendorEligibility.vendorResponseId, vendors.map(v => v.id)));
        for (const e of eligibility) {
            eligibilityMap.set(e.vendorResponseId, e.isEligible);
        }
    }
    const result = [];
    for (const line of lines) {
        const extractions = await db.select().from(extractedLines)
            .where(and(eq(extractedLines.rfxLineItemId, line.id), inArray(extractedLines.vendorResponseId, vendors.map(v => v.id))));
        const quotations = [];
        for (const vendor of vendors) {
            const vendorExtractions = extractions.filter(e => e.vendorResponseId === vendor.id);
            const extracted = vendorExtractions[0];
            if (!extracted) {
                quotations.push({
                    vendorId: vendor.id,
                    vendorName: vendor.vendorName,
                    extractedLineId: '',
                    pricePerBaseUnit: null,
                    totalPrice: null,
                    currency: 'USD',
                    unit: line.unit,
                    terms: null,
                    flags: ['no_match_found'],
                    confidence: 0,
                    isFeasible: eligibilityMap.get(vendor.id) ?? true,
                    evidence: [],
                });
                continue;
            }
            let normalized = {
                pricePerBaseUnit: extracted.normPricePerBaseUnit,
                totalPrice: extracted.normTotalPrice,
                currency: 'USD',
                unit: extracted.normUnit,
                quantity: extracted.normQuantity,
                terms: extracted.normTerms,
            };
            if (extracted.buyerOverride) {
                normalized = applyBuyerOverride(normalized, extracted.buyerOverride, line.quantity);
            }
            const flags = extracted.flags;
            if (extracted.confidenceOverall < 0.5) {
                flags.push('low_confidence');
            }
            quotations.push({
                vendorId: vendor.id,
                vendorName: vendor.vendorName,
                extractedLineId: extracted.id,
                pricePerBaseUnit: normalized.pricePerBaseUnit,
                totalPrice: normalized.totalPrice,
                currency: normalized.currency,
                unit: normalized.unit,
                terms: normalized.terms,
                flags,
                confidence: extracted.confidenceOverall,
                isFeasible: eligibilityMap.get(vendor.id) ?? true,
                evidence: extracted.evidence,
            });
        }
        const cheapestVendorId = computeCheapestVendor(quotations.map(q => ({ vendorId: q.vendorId, pricePerBaseUnit: q.pricePerBaseUnit })));
        result.push({
            rfxLineItem: line,
            quotations,
            cheapestVendorId,
        });
    }
    return result;
}
export async function getComparisonForLineItems(rfxId, lineItemIds) {
    const all = await buildComparison(rfxId);
    return all.filter(item => lineItemIds.includes(item.rfxLineItem.id));
}
//# sourceMappingURL=comparison.js.map