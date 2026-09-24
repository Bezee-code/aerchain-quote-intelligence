import { db } from '../db/client';
import { rfxLineItems, extractedLines, vendorResponses, vendorEligibility } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { NormalizedLineItem, NormalizedQuotation, RFxLineItem, ExtractedLine, VendorResponse, VendorEligibility } from '../domain/types';
import { normalizeExtractedLine, applyBuyerOverride } from './normalization';
import { computeCheapestVendor } from './matching';

export async function buildComparison(rfxId: string, onlyFeasible = false): Promise<NormalizedLineItem[]> {
  const lines = await db.select().from(rfxLineItems).where(eq(rfxLineItems.rfxId, rfxId));
  const allVendors = await db.select().from(vendorResponses).where(eq(vendorResponses.rfxId, rfxId));
  const vendors = allVendors.filter(v => v.status !== 'not_received');

  if (vendors.length === 0) {
    return lines.map(line => ({
      rfxLineItem: line as any,
      quotations: [],
      cheapestVendorId: undefined,
    }));
  }

  const eligibilityMap = new Map<string, boolean>();
  if (onlyFeasible) {
    const eligibility = await db.select().from(vendorEligibility).where(inArray(vendorEligibility.vendorResponseId, vendors.map(v => v.id)));
    for (const e of eligibility) {
      eligibilityMap.set(e.vendorResponseId, e.isEligible);
    }
  }

  const result: NormalizedLineItem[] = [];

  for (const line of lines) {
    const extractions = await db.select().from(extractedLines)
      .where(and(eq(extractedLines.rfxLineItemId, line.id), inArray(extractedLines.vendorResponseId, vendors.map(v => v.id))));

    const quotations: NormalizedQuotation[] = [];

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
          currency: 'INR' as any,
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
        currency: (extracted.normCurrency || extracted.rawCurrency || 'INR') as any,
        unit: extracted.normUnit,
        quantity: extracted.normQuantity,
        terms: extracted.normTerms as any,
      };

      if (extracted.buyerOverride) {
        const raw = {
          vendorLineRef: extracted.rawVendorLineRef,
          description: extracted.rawDescription,
          price: extracted.rawPrice,
          currency: extracted.rawCurrency,
          unit: extracted.rawUnit,
          quantity: extracted.rawQuantity,
          terms: extracted.rawTerms,
        };
        normalized = applyBuyerOverride(normalized, extracted.buyerOverride, line.quantity, raw, line.unit as any);
      }

      const flags = [...((extracted.flags as any[]) || [])];
      if (extracted.confidenceOverall < 0.5 && !flags.includes('low_confidence')) {
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
        evidence: extracted.evidence as any[],
      });
    }

    // Dynamic Cheapest Vendor Calculation
    // Rules:
    // - Ineligible vendor = excluded when "Feasible vendors only" is enabled
    // - Missing quote = not comparable
    // - Unknown unit = not comparable
    // - Unsupported conversion = not comparable
    const comparableQuotations = quotations.filter(q => {
      if (onlyFeasible && !q.isFeasible) return false;
      if (q.pricePerBaseUnit === null || q.pricePerBaseUnit === undefined || !q.extractedLineId) return false;
      if (!q.unit || q.unit.toLowerCase().includes('not provided') || q.unit.toLowerCase().includes('unknown')) return false;
      if (q.flags && ((q.flags as any[]).includes('unsupported_conversion') || (q.flags as any[]).includes('unsupported_unit_conversion'))) return false;
      return true;
    });

    const cheapestVendorId = computeCheapestVendor(
      comparableQuotations.map(q => ({ vendorId: q.vendorId, pricePerBaseUnit: q.pricePerBaseUnit }))
    );

    result.push({
      rfxLineItem: line as any,
      quotations,
      cheapestVendorId,
    });
  }

  return result;
}

export async function getComparisonForLineItems(rfxId: string, lineItemIds: string[]): Promise<NormalizedLineItem[]> {
  const all = await buildComparison(rfxId);
  return all.filter(item => lineItemIds.includes(item.rfxLineItem.id));
}