import { normalizeExtractedLine } from '@/services/normalization';
export function buildRawValues(item) {
    return {
        vendorLineRef: item.vendorLineRef,
        description: item.description,
        price: item.price,
        currency: item.currency,
        unit: item.unit,
        quantity: item.quantity,
        terms: item.terms,
    };
}
export function normalizeLineItem(item, rfxLineItem) {
    const raw = buildRawValues(item);
    return normalizeExtractedLine(raw, rfxLineItem);
}
//# sourceMappingURL=normalize.js.map