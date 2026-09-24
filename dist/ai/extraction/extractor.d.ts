import { type ExtractionResult } from './schemas';
import type { RFxLineItem } from '@/domain/types';
import type { ParsedDocument } from './extractor';
export interface ExtractionInput {
    rfxLineItems: RFxLineItem[];
    parsedDoc: ParsedDocument;
}
export interface ParsedDocument {
    id: string;
    text: string;
    tables: {
        headers: string[];
        rows: string[][];
        pageNumber?: number;
    }[];
    images: {
        pageNumber: number;
        text: string;
    }[];
    mimeType: string;
}
export declare function extractLineItems(input: ExtractionInput): Promise<ExtractionResult>;
export declare function mapEvidenceToSpans(extracted: ExtractionResult, parsedDoc: ParsedDocument): ExtractionResult;
//# sourceMappingURL=extractor.d.ts.map