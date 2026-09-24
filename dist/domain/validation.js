import { z } from 'zod';
export const unitSchema = z.enum(['EA', 'KG', 'M', 'HR', 'L', 'PC', 'SET', 'M2', 'M3', 'TON']);
export const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'INR']);
export const flagTypeSchema = z.enum([
    'currency_mismatch',
    'unit_mismatch',
    'missing_price',
    'ambiguous_terms',
    'low_confidence',
    'unsupported_conversion',
    'quantity_mismatch',
    'no_match_found',
]);
export const extractionStatusSchema = z.enum(['auto', 'reviewed', 'corrected']);
export const vendorResponseStatusSchema = z.enum(['uploaded', 'processing', 'extracted', 'reviewed']);
export const commercialTermsSchema = z.object({
    paymentTerms: z.string().optional(),
    deliveryTerms: z.string().optional(),
    incoterms: z.string().optional(),
    validityDays: z.number().int().optional(),
    minimumOrderQty: z.number().optional(),
    leadTimeDays: z.number().int().optional(),
    custom: z.record(z.string()),
});
export const evidenceSpanSchema = z.object({
    sourceDocId: z.string(),
    pageNumber: z.number().int().nonnegative(),
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]),
    text: z.string(),
    field: z.enum(['price', 'currency', 'unit', 'quantity', 'terms']),
});
export const confidenceScoresSchema = z.object({
    overall: z.number().min(0).max(1),
    price: z.number().min(0).max(1),
    currency: z.number().min(0).max(1),
    unit: z.number().min(0).max(1),
    quantity: z.number().min(0).max(1),
    terms: z.number().min(0).max(1),
});
export const rawExtractedValuesSchema = z.object({
    vendorLineRef: z.string().nullable(),
    description: z.string(),
    price: z.number().nullable(),
    currency: z.string().nullable(),
    unit: z.string().nullable(),
    quantity: z.number().nullable(),
    terms: z.string().nullable(),
});
export const normalizedValuesSchema = z.object({
    pricePerBaseUnit: z.number().nullable(),
    totalPrice: z.number().nullable(),
    currency: z.literal('USD'),
    unit: z.string(),
    quantity: z.number(),
    terms: commercialTermsSchema.nullable(),
});
export const buyerOverrideSchema = z.object({
    pricePerBaseUnit: z.number().optional(),
    unit: z.string().optional(),
    terms: commercialTermsSchema.optional(),
    correctedAt: z.string(),
});
export const extractedLineSchema = z.object({
    id: z.string(),
    vendorResponseId: z.string(),
    sourceDocId: z.string(),
    rfxLineItemId: z.string(),
    raw: rawExtractedValuesSchema,
    normalized: normalizedValuesSchema,
    confidence: confidenceScoresSchema,
    evidence: z.array(evidenceSpanSchema),
    flags: z.array(flagTypeSchema),
    buyerOverride: buyerOverrideSchema.optional(),
    status: extractionStatusSchema,
    updatedAt: z.string(),
});
export const rfxLineItemSchema = z.object({
    id: z.string(),
    lineNumber: z.number().int().positive(),
    description: z.string(),
    specification: z.string(),
    quantity: z.number().positive(),
    unit: unitSchema,
    category: z.string(),
    mandatory: z.boolean(),
});
export const rfxSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    lineItems: z.array(rfxLineItemSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const sourceDocSchema = z.object({
    id: z.string(),
    vendorResponseId: z.string(),
    fileName: z.string(),
    mimeType: z.string(),
    storagePath: z.string(),
    parsedPath: z.string().optional(),
    pageCount: z.number().int().optional(),
    uploadedAt: z.string(),
});
export const vendorResponseSchema = z.object({
    id: z.string(),
    rfxId: z.string(),
    vendorName: z.string(),
    status: vendorResponseStatusSchema,
    sourceDocuments: z.array(sourceDocSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const questionnaireAnswerSchema = z.object({
    questionId: z.string(),
    question: z.string(),
    answer: z.union([z.string(), z.boolean(), z.number()]),
    confidence: z.number().min(0).max(1),
    evidence: evidenceSpanSchema.optional(),
});
export const vendorEligibilitySchema = z.object({
    vendorResponseId: z.string(),
    isEligible: z.boolean(),
    answers: z.array(questionnaireAnswerSchema),
    disqualificationReasons: z.array(z.string()),
});
export const normalizedQuotationSchema = z.object({
    vendorId: z.string(),
    vendorName: z.string(),
    extractedLineId: z.string(),
    pricePerBaseUnit: z.number().nullable(),
    totalPrice: z.number().nullable(),
    currency: z.literal('USD'),
    unit: z.string(),
    terms: commercialTermsSchema.nullable(),
    flags: z.array(flagTypeSchema),
    confidence: z.number().min(0).max(1),
    isFeasible: z.boolean(),
    evidence: z.array(evidenceSpanSchema),
});
export const normalizedLineItemSchema = z.object({
    rfxLineItem: rfxLineItemSchema,
    quotations: z.array(normalizedQuotationSchema),
    cheapestVendorId: z.string().optional(),
});
export const splitAllocationSchema = z.object({
    vendorId: z.string(),
    vendorName: z.string(),
    lineItems: z.array(z.object({
        rfxLineItemId: z.string(),
        quantity: z.number(),
        pricePerUnit: z.number(),
        totalPrice: z.number(),
    })),
    subtotal: z.number(),
});
export const splitResultSchema = z.object({
    allocations: z.array(splitAllocationSchema),
    totalCost: z.number(),
    currency: z.literal('USD'),
    unallocated: z.array(z.string()),
    assumptions: z.array(z.string()),
});
export const citationSchema = z.object({
    extractedLineId: z.string(),
    vendorName: z.string(),
    lineDescription: z.string(),
    field: z.string(),
    value: z.string(),
    evidence: evidenceSpanSchema,
});
export const toolCallSchema = z.object({
    name: z.string(),
    args: z.record(z.unknown()),
    id: z.string(),
});
export const analystMessageSchema = z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'tool']),
    content: z.string(),
    toolCalls: z.array(toolCallSchema).optional(),
    citations: z.array(citationSchema),
});
//# sourceMappingURL=validation.js.map