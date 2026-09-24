import { tool } from 'ai';
import { z } from 'zod';
import { buildComparison, getComparisonForLineItems } from '@/services/comparison';
import { optimizeSplit } from '@/services/split-analysis';
import { getVendorEligibility, getAllEligibility } from '@/services/questionnaire';
import { getUnitConversionRate } from '@/utils/units';
import type { EvidenceSpan } from '@/domain/types';

export const getComparisonTool = tool({
  description: 'Get normalized comparison data for specific line items or all',
  parameters: z.object({
    rfxId: z.string(),
    lineItemIds: z.array(z.string()).optional(),
    vendorIds: z.array(z.string()).optional(),
    includeFlagged: z.boolean().default(true),
    onlyFeasible: z.boolean().default(false),
  }),
  execute: async ({ rfxId, lineItemIds, onlyFeasible }) => {
    if (lineItemIds && lineItemIds.length > 0) {
      return await getComparisonForLineItems(rfxId, lineItemIds);
    }
    return await buildComparison(rfxId, onlyFeasible);
  },
});

export const getEvidenceTool = tool({
  description: 'Retrieve source evidence for a specific extracted value',
  parameters: z.object({
    extractedLineId: z.string(),
    field: z.enum(['price', 'currency', 'unit', 'quantity', 'terms']),
  }),
  execute: async ({ extractedLineId, field }) => {
    const { db } = await import('../../db/client');
    const { extractedLines } = await import('../../db/schema');
    const { eq } = await import('drizzle-orm');

    const result = await db.select().from(extractedLines).where(eq(extractedLines.id, extractedLineId));
    if (result.length === 0) return { evidence: null };

    const line = result[0];
    const evidence = (line.evidence as EvidenceSpan[]).filter(e => e.field === field);
    return { evidence: evidence[0] || null, documentId: line.sourceDocId };
  },
});

export const calculateSplitTool = tool({
  description: 'Compute optimal cost split across vendors for selected line items or all line items if omitted',
  parameters: z.object({
    rfxId: z.string(),
    lineItemIds: z.array(z.string()).optional(),
    constraints: z.object({
      maxVendors: z.number().optional(),
      minVolumePerVendor: z.number().optional(),
      preferredVendors: z.array(z.string()).optional(),
      excludedVendors: z.array(z.string()).optional(),
      requireFeasible: z.boolean().default(true),
    }).optional(),
  }),
  execute: async ({ rfxId, lineItemIds, constraints }) => {
    let ids = lineItemIds;
    if (!ids || ids.length === 0) {
      const { db } = await import('../../db/client');
      const { rfxLineItems } = await import('../../db/schema');
      const { eq } = await import('drizzle-orm');
      const allItems = await db.select().from(rfxLineItems).where(eq(rfxLineItems.rfxId, rfxId));
      ids = allItems.map(item => item.id);
    }
    return await optimizeSplit(rfxId, ids, constraints || {});
  },
});

export const filterFeasibleTool = tool({
  description: 'Get vendors passing questionnaire/eligibility',
  parameters: z.object({ rfxId: z.string() }),
  execute: async ({ rfxId }) => {
    return await getAllEligibility(rfxId);
  },
});

export const convertUnitsTool = tool({
  description: 'Convert between units with explicit rate',
  parameters: z.object({
    value: z.number(),
    fromUnit: z.string(),
    toUnit: z.string(),
    conversionRate: z.number().optional(),
  }),
  execute: async ({ value, fromUnit, toUnit, conversionRate }) => {
    if (conversionRate !== undefined) {
      return { converted: value * conversionRate, rate: conversionRate };
    }
    const rate = getUnitConversionRate(fromUnit, toUnit);
    if (rate === null) {
      return { error: `Unsupported conversion: ${fromUnit} -> ${toUnit}` };
    }
    return { converted: value * rate, rate };
  },
});

export const analystTools = [
  getComparisonTool,
  getEvidenceTool,
  calculateSplitTool,
  filterFeasibleTool,
  convertUnitsTool,
];