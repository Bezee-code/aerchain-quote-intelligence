export function matchLinesToRFx(extractedLines, rfxLineItems) {
    const matched = new Map();
    for (const rfxLine of rfxLineItems) {
        matched.set(rfxLine.id, []);
    }
    for (const extracted of extractedLines) {
        if (extracted.rfxLineItemId && matched.has(extracted.rfxLineItemId)) {
            matched.get(extracted.rfxLineItemId).push(extracted);
        }
        else {
            const bestMatch = findBestMatch(extracted, rfxLineItems);
            if (bestMatch) {
                if (!matched.has(bestMatch.id))
                    matched.set(bestMatch.id, []);
                matched.get(bestMatch.id).push({ ...extracted, rfxLineItemId: bestMatch.id });
            }
        }
    }
    return matched;
}
function findBestMatch(extracted, rfxLineItems) {
    let bestScore = 0;
    let bestMatch = null;
    for (const rfxLine of rfxLineItems) {
        const score = calculateSimilarity(extracted.raw.description, rfxLine.description);
        if (score > bestScore && score > 0.6) {
            bestScore = score;
            bestMatch = rfxLine;
        }
    }
    return bestMatch;
}
function calculateSimilarity(a, b) {
    const aTokens = tokenize(a.toLowerCase());
    const bTokens = tokenize(b.toLowerCase());
    if (aTokens.length === 0 || bTokens.length === 0)
        return 0;
    const intersection = aTokens.filter(t => bTokens.includes(t));
    const union = [...new Set([...aTokens, ...bTokens])];
    return intersection.length / union.length;
}
function tokenize(text) {
    return text
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(t => t.length > 2);
}
export function computeCheapestVendor(quotations) {
    const valid = quotations.filter(q => q.pricePerBaseUnit !== null);
    if (valid.length === 0)
        return undefined;
    return valid.reduce((min, q) => q.pricePerBaseUnit < min.pricePerBaseUnit ? q : min).vendorId;
}
//# sourceMappingURL=matching.js.map