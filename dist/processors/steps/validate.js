import { extractedLineItemSchema } from '@/ai/extraction/schemas';
export function validateExtraction(result) {
    const validatedItems = [];
    for (const item of result.lineItems) {
        const parsed = extractedLineItemSchema.safeParse(item);
        if (!parsed.success) {
            console.warn('Validation failed for item:', parsed.error);
            validatedItems.push({ ...item, flags: [...item.flags, 'low_confidence'] });
        }
        else {
            validatedItems.push(parsed.data);
        }
    }
    return { ...result, lineItems: validatedItems };
}
export function addFlagsFromValidation(item, rfxLineItem) {
    const flags = [...item.flags];
    if (item.price === null)
        flags.push('missing_price');
    if (item.currency && !['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'INR'].includes(item.currency)) {
        flags.push('currency_mismatch');
    }
    if (item.unit) {
        const normalized = item.unit.toUpperCase();
        const known = ['EA', 'KG', 'M', 'HR', 'L', 'PC', 'SET', 'M2', 'M3', 'TON'];
        if (!known.includes(normalized))
            flags.push('unsupported_conversion');
    }
    if (item.confidence.overall < 0.5)
        flags.push('low_confidence');
    return [...new Set(flags)];
}
//# sourceMappingURL=validate.js.map