import { z } from 'zod';
export const evidenceSchema = z.object({
    field: z.enum(['price', 'currency', 'unit', 'quantity', 'terms']),
    text: z.string(),
    pageNumber: z.number().int().nonnegative().optional(),
    bbox: z.tuple([z.number(), z.number(), z.number(), z.number()]).optional(),
});
export const lineItemConfidenceSchema = z.object({
    price: z.number().min(0).max(1),
    currency: z.number().min(0).max(1),
    unit: z.number().min(0).max(1),
    quantity: z.number().min(0).max(1),
    terms: z.number().min(0).max(1),
    overall: z.number().min(0).max(1),
});
export const extractedLineItemSchema = z.object({
    vendorLineRef: z.string().nullable(),
    description: z.string(),
    price: z.number().nullable(),
    currency: z.string().nullable(),
    unit: z.string().nullable(),
    quantity: z.number().nullable(),
    terms: z.string().nullable(),
    confidence: lineItemConfidenceSchema,
    evidence: z.array(evidenceSchema),
    flags: z.array(z.string()),
});
export const questionnaireAnswerSchema = z.object({
    questionId: z.string(),
    answer: z.union([z.string(), z.boolean(), z.number()]),
    confidence: z.number().min(0).max(1),
    evidence: z.array(evidenceSchema).optional(),
});
export const extractionResultSchema = z.object({
    lineItems: z.array(extractedLineItemSchema),
    questionnaireAnswers: z.array(questionnaireAnswerSchema).optional(),
});
//# sourceMappingURL=schemas.js.map