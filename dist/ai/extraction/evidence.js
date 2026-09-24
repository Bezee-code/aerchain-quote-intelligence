export function createEvidenceSpan(sourceDocId, pageNumber, bbox, text, field) {
    return { sourceDocId, pageNumber, bbox, text, field };
}
export function mergeEvidence(existing, incoming) {
    const merged = [...existing];
    for (const inc of incoming) {
        const exists = merged.some(e => e.field === inc.field &&
            e.sourceDocId === inc.sourceDocId &&
            e.pageNumber === inc.pageNumber &&
            e.text === inc.text);
        if (!exists)
            merged.push(inc);
    }
    return merged;
}
export function getEvidenceForField(line, field) {
    return line.evidence.filter(e => e.field === field);
}
export function getBestEvidence(line, field) {
    const fieldEvidence = getEvidenceForField(line, field);
    if (fieldEvidence.length === 0)
        return null;
    return fieldEvidence.reduce((best, current) => current.text.length > best.text.length ? current : best);
}
//# sourceMappingURL=evidence.js.map