import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const rfx = sqliteTable('rfx', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const rfxLineItems = sqliteTable('rfx_line_items', {
  id: text('id').primaryKey(),
  rfxId: text('rfx_id').notNull().references(() => rfx.id, { onDelete: 'cascade' }),
  lineNumber: integer('line_number').notNull(),
  description: text('description').notNull(),
  specification: text('specification').notNull(),
  quantity: real('quantity').notNull(),
  unit: text('unit').notNull(),
  category: text('category').notNull(),
  mandatory: integer('mandatory', { mode: 'boolean' }).notNull().default(true),
}, (table) => ({
  rfxIdIdx: index('rfx_line_items_rfx_id_idx').on(table.rfxId),
}));

export const vendorResponses = sqliteTable('vendor_responses', {
  id: text('id').primaryKey(),
  rfxId: text('rfx_id').notNull().references(() => rfx.id, { onDelete: 'cascade' }),
  vendorName: text('vendor_name').notNull(),
  status: text('status', { enum: ['not_received', 'uploaded', 'processing', 'parsing', 'parsed', 'extracting', 'extracted', 'validating', 'ready', 'review_required', 'reviewed', 'failed'] }).notNull().default('not_received'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  rfxIdIdx: index('vendor_responses_rfx_id_idx').on(table.rfxId),
}));

export const sourceDocuments = sqliteTable('source_documents', {
  id: text('id').primaryKey(),
  vendorResponseId: text('vendor_response_id').notNull().references(() => vendorResponses.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  storagePath: text('storage_path').notNull(),
  parsedPath: text('parsed_path'),
  pageCount: integer('page_count'),
  uploadedAt: text('uploaded_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  vendorResponseIdIdx: index('source_documents_vendor_response_id_idx').on(table.vendorResponseId),
}));

export const extractedLines = sqliteTable('extracted_lines', {
  id: text('id').primaryKey(),
  vendorResponseId: text('vendor_response_id').notNull().references(() => vendorResponses.id, { onDelete: 'cascade' }),
  sourceDocId: text('source_doc_id').notNull().references(() => sourceDocuments.id, { onDelete: 'cascade' }),
  rfxLineItemId: text('rfx_line_item_id').notNull().references(() => rfxLineItems.id, { onDelete: 'cascade' }),
  rawVendorLineRef: text('raw_vendor_line_ref'),
  rawDescription: text('raw_description').notNull(),
  rawPrice: real('raw_price'),
  rawCurrency: text('raw_currency'),
  rawUnit: text('raw_unit'),
  rawQuantity: real('raw_quantity'),
  rawTerms: text('raw_terms'),
  normPricePerBaseUnit: real('norm_price_per_base_unit'),
  normTotalPrice: real('norm_total_price'),
  normCurrency: text('norm_currency').notNull().default('USD'),
  normUnit: text('norm_unit').notNull(),
  normQuantity: real('norm_quantity').notNull(),
  normTerms: text('norm_terms', { mode: 'json' }),
  confidenceOverall: real('confidence_overall').notNull(),
  confidencePrice: real('confidence_price').notNull(),
  confidenceCurrency: real('confidence_currency').notNull(),
  confidenceUnit: real('confidence_unit').notNull(),
  confidenceQuantity: real('confidence_quantity').notNull(),
  confidenceTerms: real('confidence_terms').notNull(),
  evidence: text('evidence', { mode: 'json' }).notNull().default('[]'),
  flags: text('flags', { mode: 'json' }).notNull().default('[]'),
  buyerOverride: text('buyer_override', { mode: 'json' }),
  status: text('status', { enum: ['auto', 'reviewed', 'corrected'] }).notNull().default('auto'),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  vendorResponseIdIdx: index('extracted_lines_vendor_response_id_idx').on(table.vendorResponseId),
  rfxLineItemIdIdx: index('extracted_lines_rfx_line_item_id_idx').on(table.rfxLineItemId),
}));

export const questionnaireAnswers = sqliteTable('questionnaire_answers', {
  id: text('id').primaryKey(),
  vendorResponseId: text('vendor_response_id').notNull().references(() => vendorResponses.id, { onDelete: 'cascade' }),
  questionId: text('question_id').notNull(),
  question: text('question').notNull(),
  answer: text('answer', { mode: 'json' }).notNull(),
  confidence: real('confidence').notNull(),
  evidence: text('evidence', { mode: 'json' }),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  vendorResponseIdIdx: index('questionnaire_answers_vendor_response_id_idx').on(table.vendorResponseId),
}));

export const vendorEligibility = sqliteTable('vendor_eligibility', {
  vendorResponseId: text('vendor_response_id').primaryKey().references(() => vendorResponses.id, { onDelete: 'cascade' }),
  isEligible: integer('is_eligible', { mode: 'boolean' }).notNull(),
  disqualificationReasons: text('disqualification_reasons', { mode: 'json' }).notNull().default('[]'),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
});

export type RFx = typeof rfx.$inferSelect;
export type NewRFx = typeof rfx.$inferInsert;
export type RFxLineItem = typeof rfxLineItems.$inferSelect;
export type NewRFxLineItem = typeof rfxLineItems.$inferInsert;
export type VendorResponse = typeof vendorResponses.$inferSelect;
export type NewVendorResponse = typeof vendorResponses.$inferInsert;
export type SourceDocument = typeof sourceDocuments.$inferSelect;
export type NewSourceDocument = typeof sourceDocuments.$inferInsert;
export type ExtractedLine = typeof extractedLines.$inferSelect;
export type NewExtractedLine = typeof extractedLines.$inferInsert;
export type QuestionnaireAnswer = typeof questionnaireAnswers.$inferSelect;
export type NewQuestionnaireAnswer = typeof questionnaireAnswers.$inferInsert;
export type VendorEligibility = typeof vendorEligibility.$inferSelect;
export type NewVendorEligibility = typeof vendorEligibility.$inferInsert;