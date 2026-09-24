export type UnitOfMeasure = 'EA' | 'KG' | 'M' | 'HR' | 'L' | 'PC' | 'SET' | 'M2' | 'M3' | 'TON';

export const UNITS: UnitOfMeasure[] = ['EA', 'KG', 'M', 'HR', 'L', 'PC', 'SET', 'M2', 'M3', 'TON'];

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'INR'] as const;
export type Currency = (typeof CURRENCIES)[number];

export type FlagType =
  | 'currency_mismatch'
  | 'unit_mismatch'
  | 'missing_price'
  | 'missing_unit'
  | 'ambiguous_terms'
  | 'low_confidence'
  | 'unsupported_conversion'
  | 'quantity_mismatch'
  | 'no_match_found';

export type MatchState = 'EXACT' | 'PROBABLE' | 'NONE';

export type ExtractionStatus = 'auto' | 'reviewed' | 'corrected';

export type VendorResponseStatus = 'not_received' | 'uploaded' | 'processing' | 'parsing' | 'parsed' | 'extracting' | 'extracted' | 'validating' | 'ready' | 'review_required' | 'reviewed' | 'failed';

export interface RFxLineItem {
  id: string;
  lineNumber: number;
  description: string;
  specification: string;
  quantity: number;
  unit: UnitOfMeasure;
  category: string;
  mandatory: boolean;
}

export interface RFx {
  id: string;
  name: string;
  description: string;
  lineItems: RFxLineItem[];
  createdAt: string;
  updatedAt: string;
}

export interface SourceDoc {
  id: string;
  vendorResponseId: string;
  fileName: string;
  mimeType: string;
  storagePath: string;
  parsedPath?: string;
  pageCount?: number;
  uploadedAt: string;
}

export interface ParsedDocument {
  id: string;
  mimeType: string;
  text: string;
  tables: ParsedTable[];
  images: ParsedImage[];
  metadata: ParsedMetadata;
}

export interface ParsedTable {
  headers: string[];
  rows: string[][];
  pageNumber?: number;
  sheetName?: string;
  rowCount?: number;
  colCount?: number;
}

export interface ParsedImage {
  pageNumber: number;
  text: string;
  confidence?: number;
  bbox?: [number, number, number, number];
}

export interface ParsedMetadata {
  pageCount?: number;
  sheetNames?: string[];
  author?: string;
  createdAt?: string;
  modifiedAt?: string;
  ocrRequired?: boolean;
  attachmentCount?: number;
  [key: string]: unknown;
}

export interface VendorResponse {
  id: string;
  rfxId: string;
  vendorName: string;
  status: VendorResponseStatus;
  sourceDocuments: SourceDoc[];
  createdAt: string;
  updatedAt: string;
}

export interface CommercialTerms {
  paymentTerms?: string;
  deliveryTerms?: string;
  incoterms?: string;
  validityDays?: number;
  minimumOrderQty?: number;
  leadTimeDays?: number;
  custom: Record<string, string>;
}

export interface EvidenceSpan {
  sourceDocId: string;
  pageNumber: number;
  bbox: [number, number, number, number];
  text: string;
  field: 'price' | 'currency' | 'unit' | 'quantity' | 'terms';
}

export interface ConfidenceScores {
  overall: number;
  price: number;
  currency: number;
  unit: number;
  quantity: number;
  terms: number;
}

export interface RawExtractedValues {
  vendorLineRef: string | null;
  description: string;
  price: number | null;
  currency: string | null;
  unit: string | null;
  quantity: number | null;
  terms: string | null;
}

export interface NormalizedValues {
  pricePerBaseUnit: number | null;
  totalPrice: number | null;
  currency: Currency;
  unit: string;
  quantity: number;
  terms: CommercialTerms | null;
}

export interface BuyerOverride {
  pricePerBaseUnit?: number;
  unit?: string;
  terms?: CommercialTerms;
  correctedAt: string;
}

export interface ExtractedLine {
  id: string;
  vendorResponseId: string;
  sourceDocId: string;
  rfxLineItemId: string;
  raw: RawExtractedValues;
  normalized: NormalizedValues;
  confidence: ConfidenceScores;
  evidence: EvidenceSpan[];
  flags: FlagType[];
  buyerOverride?: BuyerOverride;
  status: ExtractionStatus;
  updatedAt: string;
}

export interface QuestionnaireAnswer {
  questionId: string;
  question: string;
  answer: string | boolean | number;
  confidence: number;
  evidence?: EvidenceSpan;
}

export interface VendorEligibility {
  vendorResponseId: string;
  isEligible: boolean;
  answers: QuestionnaireAnswer[];
  disqualificationReasons: string[];
}

export interface NormalizedLineItem {
  rfxLineItem: RFxLineItem;
  quotations: NormalizedQuotation[];
  cheapestVendorId?: string;
}

export interface NormalizedQuotation {
  vendorId: string;
  vendorName: string;
  extractedLineId: string;
  pricePerBaseUnit: number | null;
  totalPrice: number | null;
  currency: Currency;
  unit: string;
  terms: CommercialTerms | null;
  flags: FlagType[];
  confidence: number;
  isFeasible: boolean;
  evidence: EvidenceSpan[];
}

export interface SplitAllocation {
  vendorId: string;
  vendorName: string;
  lineItems: {
    rfxLineItemId: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
  }[];
  subtotal: number;
}

export interface SplitResult {
  allocations: SplitAllocation[];
  totalCost: number;
  currency: Currency;
  unallocated: string[];
  assumptions: string[];
}

export interface Citation {
  extractedLineId: string;
  vendorName: string;
  lineDescription: string;
  field: string;
  value: string;
  evidence: EvidenceSpan;
}

export interface AnalystMessage {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolCalls?: ToolCall[];
  citations: Citation[];
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  id: string;
}