import type { EvidenceSpan, ExtractedLine } from '@/domain/types';

export function createEvidenceSpan(
  sourceDocId: string,
  pageNumber: number,
  bbox: [number, number, number, number],
  text: string,
  field: 'price' | 'currency' | 'unit' | 'quantity' | 'terms'
): EvidenceSpan {
  return { sourceDocId, pageNumber, bbox, text, field };
}

export function mergeEvidence(existing: EvidenceSpan[], incoming: EvidenceSpan[]): EvidenceSpan[] {
  const merged = [...existing];
  for (const inc of incoming) {
    const exists = merged.some(e =>
      e.field === inc.field &&
      e.sourceDocId === inc.sourceDocId &&
      e.pageNumber === inc.pageNumber &&
      e.text === inc.text
    );
    if (!exists) merged.push(inc);
  }
  return merged;
}

export function getEvidenceForField(line: ExtractedLine, field: EvidenceSpan['field']): EvidenceSpan[] {
  return line.evidence.filter(e => e.field === field);
}

export function getBestEvidence(line: ExtractedLine, field: EvidenceSpan['field']): EvidenceSpan | null {
  const fieldEvidence = getEvidenceForField(line, field);
  if (fieldEvidence.length === 0) return null;
  return fieldEvidence.reduce((best, current) =>
    current.text.length > best.text.length ? current : best
  );
}