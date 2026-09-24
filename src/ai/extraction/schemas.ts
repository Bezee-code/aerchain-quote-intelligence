import { z } from 'zod';

export const evidenceSchema = z.object({
  field: z.string(),
  text: z.string(),
  pageNumber: z.number().int().nonnegative().optional(),
  bbox: z.array(z.number()).optional(),
});

export const lineItemConfidenceSchema = z.object({
  price: z.number().min(0).max(1),
  currency: z.number().min(0).max(1),
  unit: z.number().min(0).max(1),
  quantity: z.number().min(0).max(1),
  terms: z.number().min(0).max(1),
  overall: z.number().min(0).max(1),
});

export const matchStateSchema = z.enum(['MATCHED', 'PROBABLE', 'UNMATCHED', 'REVIEW']);

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
  matchState: matchStateSchema.optional(),
  matchedRfxLineItemId: z.string().nullable().optional(),
});

export const questionnaireAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
  confidence: z.number().min(0).max(1),
  evidence: z.array(evidenceSchema).optional(),
});

export const extractionResultSchema = z.object({
  vendorName: z.string().optional().describe('Commercial company/vendor name extracted from document header, logo, or letterhead'),
  lineItems: z.array(extractedLineItemSchema),
  questionnaireAnswers: z.array(questionnaireAnswerSchema).optional(),
});

export type ExtractionResult = z.infer<typeof extractionResultSchema>;
export type ExtractedLineItem = z.infer<typeof extractedLineItemSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type MatchState = z.infer<typeof matchStateSchema>;