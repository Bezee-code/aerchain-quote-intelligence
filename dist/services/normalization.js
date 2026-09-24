import { convertCurrency, isCurrencySupported } from '../utils/currency';
import { areUnitsCompatible, normalizeUnit, getUnitConversionRate } from '../utils/units';
export function normalizeExtractedLine(raw, rfxLineItem) {
    const flags = [];
    let pricePerBaseUnit = null;
    let totalPrice = null;
    let currency = 'USD';
    let unit = rfxLineItem.unit;
    let quantity = rfxLineItem.quantity;
    let terms = null;
    if (raw.price !== null && raw.currency) {
        if (!isCurrencySupported(raw.currency)) {
            flags.push('currency_mismatch');
        }
        else {
            currency = 'USD';
            const convertedPrice = convertCurrency(raw.price, raw.currency, 'USD');
            pricePerBaseUnit = convertedPrice;
        }
    }
    else if (raw.price !== null && !raw.currency) {
        flags.push('currency_mismatch');
    }
    else {
        flags.push('missing_price');
    }
    if (raw.unit) {
        const normalizedVendorUnit = normalizeUnit(raw.unit);
        if (normalizedVendorUnit) {
            if (!areUnitsCompatible(normalizedVendorUnit, rfxLineItem.unit)) {
                flags.push('unit_mismatch');
            }
            else {
                const rate = getUnitConversionRate(normalizedVendorUnit, rfxLineItem.unit);
                if (rate !== null && raw.price !== null && raw.currency && isCurrencySupported(raw.currency)) {
                    const usdPrice = convertCurrency(raw.price, raw.currency, 'USD');
                    pricePerBaseUnit = usdPrice * rate;
                }
                unit = rfxLineItem.unit;
            }
        }
        else {
            flags.push('unsupported_conversion');
        }
    }
    else if (raw.price !== null) {
        flags.push('unit_mismatch');
    }
    if (raw.quantity !== null && raw.quantity > 0) {
        const normalizedVendorUnit = raw.unit ? normalizeUnit(raw.unit) : null;
        if (normalizedVendorUnit && areUnitsCompatible(normalizedVendorUnit, rfxLineItem.unit)) {
            const rate = getUnitConversionRate(normalizedVendorUnit, rfxLineItem.unit);
            if (rate !== null) {
                quantity = raw.quantity * rate;
            }
            else {
                flags.push('quantity_mismatch');
            }
        }
        else if (normalizedVendorUnit) {
            flags.push('quantity_mismatch');
        }
    }
    else {
        quantity = rfxLineItem.quantity;
    }
    if (pricePerBaseUnit !== null) {
        totalPrice = pricePerBaseUnit * rfxLineItem.quantity;
    }
    if (raw.terms) {
        terms = parseCommercialTerms(raw.terms);
        if (hasAmbiguousTerms(terms)) {
            flags.push('ambiguous_terms');
        }
    }
    return {
        normalized: {
            pricePerBaseUnit,
            totalPrice,
            currency,
            unit,
            quantity,
            terms,
        },
        flags,
    };
}
function parseCommercialTerms(termsText) {
    const terms = { custom: {} };
    const lower = termsText.toLowerCase();
    const paymentMatch = lower.match(/net\s*(\d+)/i);
    if (paymentMatch)
        terms.paymentTerms = `Net ${paymentMatch[1]}`;
    const deliveryMatch = lower.match(/\b(fob|cfc|cif|dap|dpu|ddp|exw)\b/i);
    if (deliveryMatch)
        terms.incoterms = deliveryMatch[1].toUpperCase();
    const validityMatch = lower.match(/valid(?:ity)?\s*(?:for)?\s*(\d+)\s*days?/i);
    if (validityMatch)
        terms.validityDays = parseInt(validityMatch[1], 10);
    const moqMatch = lower.match(/(?:moq|minimum\s+order)\s*[:\-]?\s*(\d+)/i);
    if (moqMatch)
        terms.minimumOrderQty = parseInt(moqMatch[1], 10);
    const leadTimeMatch = lower.match(/lead\s*time\s*[:\-]?\s*(\d+)\s*days?/i);
    if (leadTimeMatch)
        terms.leadTimeDays = parseInt(leadTimeMatch[1], 10);
    const warrantyMatch = lower.match(/warranty\s*[:\-]?\s*(\d+)\s*months?/i);
    if (warrantyMatch)
        terms.custom.warrantyMonths = warrantyMatch[1];
    return terms;
}
function hasAmbiguousTerms(terms) {
    if (!terms.paymentTerms)
        return true;
    if (!terms.incoterms)
        return true;
    return false;
}
export function applyBuyerOverride(normalized, override, rfxQuantity) {
    const result = { ...normalized };
    if (override.pricePerBaseUnit !== undefined) {
        result.pricePerBaseUnit = override.pricePerBaseUnit;
        result.totalPrice = override.pricePerBaseUnit * rfxQuantity;
    }
    if (override.unit) {
        result.unit = override.unit;
    }
    if (override.terms) {
        result.terms = override.terms;
    }
    return result;
}
//# sourceMappingURL=normalization.js.map