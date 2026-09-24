import type { EvidenceSpan, ExtractedLine } from '@/domain/types';
export declare function createEvidenceSpan(sourceDocId: string, pageNumber: number, bbox: [number, number, number, number], text: string, field: 'price' | 'currency' | 'unit' | 'quantity' | 'terms'): EvidenceSpan;
export declare function mergeEvidence(existing: EvidenceSpan[], incoming: EvidenceSpan[]): EvidenceSpan[];
export declare function getEvidenceForField(line: ExtractedLine, field: EvidenceSpan['field']): EvidenceSpan[];
export declare function getBestEvidence(line: ExtractedLine, field: EvidenceSpan['field']): EvidenceSpan | null;
//# sourceMappingURL=evidence.d.ts.map