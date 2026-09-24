import type { RFxLineItem, ExtractedLine } from '../domain/types';

export function matchLinesToRFx(
  extractedLines: ExtractedLine[],
  rfxLineItems: RFxLineItem[]
): Map<string, ExtractedLine[]> {
  const matched = new Map<string, ExtractedLine[]>();

  for (const rfxLine of rfxLineItems) {
    matched.set(rfxLine.id, []);
  }

  for (const extracted of extractedLines) {
    if (extracted.rfxLineItemId && matched.has(extracted.rfxLineItemId)) {
      matched.get(extracted.rfxLineItemId)!.push(extracted);
    } else {
      const bestMatch = findBestMatch(extracted, rfxLineItems);
      if (bestMatch) {
        if (!matched.has(bestMatch.id)) matched.set(bestMatch.id, []);
        matched.get(bestMatch.id)!.push({ ...extracted, rfxLineItemId: bestMatch.id });
      }
    }
  }

  return matched;
}

function findBestMatch(
  extracted: ExtractedLine,
  rfxLineItems: RFxLineItem[]
): RFxLineItem | null {
  const ref = (extracted.raw?.vendorLineRef || (extracted as any).vendorLineRef || '').trim();
  if (ref) {
    // 1. Direct match by exact ID (e.g. "li-001")
    const idMatch = rfxLineItems.find(l => l.id.toLowerCase() === ref.toLowerCase());
    if (idMatch) return idMatch;

    // 2. Direct match by line number (e.g. "1" or "001")
    const num = parseInt(ref.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      const numMatch = rfxLineItems.find(l => l.lineNumber === num);
      if (numMatch) return numMatch;
    }
  }

  // 3. Fallback to token similarity on description
  let bestScore = 0;
  let bestMatch: RFxLineItem | null = null;

  const desc = extracted.raw?.description || (extracted as any).description || '';

  for (const rfxLine of rfxLineItems) {
    const score = calculateSimilarity(desc, rfxLine.description);
    if (score > bestScore && score > 0.45) {
      bestScore = score;
      bestMatch = rfxLine;
    }
  }

  return bestMatch;
}

function calculateSimilarity(a: string, b: string): number {
  const aTokens = tokenize(a.toLowerCase());
  const bTokens = tokenize(b.toLowerCase());

  if (aTokens.length === 0 || bTokens.length === 0) return 0;

  const intersection = aTokens.filter(t => bTokens.includes(t));
  const union = [...new Set([...aTokens, ...bTokens])];

  return intersection.length / union.length;
}

function tokenize(text: string): string[] {
  return text
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

export function computeCheapestVendor(
  quotations: { vendorId: string; pricePerBaseUnit: number | null }[]
): string | undefined {
  const valid = quotations.filter(q => q.pricePerBaseUnit !== null);
  if (valid.length === 0) return undefined;
  return valid.reduce((min, q) => q.pricePerBaseUnit! < min.pricePerBaseUnit! ? q : min).vendorId;
}