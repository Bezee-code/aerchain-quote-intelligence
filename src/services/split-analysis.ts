import { db } from '../db/client';
import { rfxLineItems, extractedLines, vendorResponses, vendorEligibility } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { SplitResult, SplitAllocation, RFxLineItem, NormalizedQuotation } from '../domain/types';
import { buildComparison } from './comparison';

export interface SplitConstraints {
  maxVendors?: number;
  minVolumePerVendor?: number;
  preferredVendors?: string[];
  excludedVendors?: string[];
  requireFeasible?: boolean;
}

export async function optimizeSplit(
  rfxId: string,
  lineItemIds: string[],
  constraints: SplitConstraints = {}
): Promise<SplitResult> {
  const comparison = await buildComparison(rfxId, constraints.requireFeasible ?? true);

  const relevantLines = comparison.filter(item => lineItemIds.includes(item.rfxLineItem.id));
  const allVendors = await db.select().from(vendorResponses).where(eq(vendorResponses.rfxId, rfxId));
  const vendors = allVendors.filter(v => v.status !== 'not_received');

  if (vendors.length === 0) {
    return {
      allocations: [],
      totalCost: 0,
      currency: 'INR',
      unallocated: lineItemIds,
      assumptions: ['No uploaded quotations found.'],
    };
  }

  const feasibleVendorIds = new Set<string>();
  if (constraints.requireFeasible) {
    const eligibility = await db.select().from(vendorEligibility).where(inArray(vendorEligibility.vendorResponseId, vendors.map(v => v.id)));
    for (const e of eligibility) {
      if (e.isEligible) feasibleVendorIds.add(e.vendorResponseId);
    }
  } else {
    for (const v of vendors) feasibleVendorIds.add(v.id);
  }

  if (constraints.excludedVendors) {
    for (const id of constraints.excludedVendors) feasibleVendorIds.delete(id);
  }

  const allocations: SplitAllocation[] = [];
  const vendorAllocations = new Map<string, { lineItems: SplitAllocation['lineItems']; subtotal: number }>();
  const unallocated: string[] = [];

  for (const line of relevantLines) {
    const validQuotes = line.quotations.filter(q =>
      q.pricePerBaseUnit !== null &&
      feasibleVendorIds.has(q.vendorId)
    );

    if (validQuotes.length === 0) {
      unallocated.push(line.rfxLineItem.id);
      continue;
    }

    validQuotes.sort((a, b) => (a.pricePerBaseUnit ?? Infinity) - (b.pricePerBaseUnit ?? Infinity));

    let allocated = false;
    for (const quote of validQuotes) {
      const vendorId = quote.vendorId;
      const currentAllocation = vendorAllocations.get(vendorId) || { lineItems: [], subtotal: 0 };

      if (constraints.maxVendors && vendorAllocations.size >= constraints.maxVendors && !vendorAllocations.has(vendorId)) {
        continue;
      }

      if (constraints.minVolumePerVendor) {
        const projectedSubtotal = currentAllocation.subtotal + (quote.pricePerBaseUnit! * line.rfxLineItem.quantity);
        if (projectedSubtotal < constraints.minVolumePerVendor && vendorAllocations.has(vendorId)) {
          continue;
        }
      }

      const allocationItem = {
        rfxLineItemId: line.rfxLineItem.id,
        quantity: line.rfxLineItem.quantity,
        pricePerUnit: quote.pricePerBaseUnit!,
        totalPrice: quote.pricePerBaseUnit! * line.rfxLineItem.quantity,
      };

      currentAllocation.lineItems.push(allocationItem);
      currentAllocation.subtotal += allocationItem.totalPrice;
      vendorAllocations.set(vendorId, currentAllocation);
      allocated = true;
      break;
    }

    if (!allocated) {
      unallocated.push(line.rfxLineItem.id);
    }
  }

  for (const [vendorId, allocation] of vendorAllocations) {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) {
      allocations.push({
        vendorId,
        vendorName: vendor.vendorName,
        lineItems: allocation.lineItems,
        subtotal: allocation.subtotal,
      });
    }
  }

  const totalCost = allocations.reduce((sum, a) => sum + a.subtotal, 0);

  const assumptions = [
    'Greedy allocation: each line item assigned to cheapest feasible vendor',
    constraints.maxVendors ? `Maximum ${constraints.maxVendors} vendors` : 'No vendor limit',
    constraints.minVolumePerVendor ? `Minimum volume per vendor: ${constraints.minVolumePerVendor}` : 'No minimum volume',
    constraints.requireFeasible ? 'Only questionnaire-eligible vendors considered' : 'All vendors considered',
  ].filter(Boolean);

  return {
    allocations,
    totalCost,
    currency: 'INR',
    unallocated,
    assumptions,
  };
}