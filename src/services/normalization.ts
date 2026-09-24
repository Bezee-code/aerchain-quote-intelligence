import { convertCurrency, isCurrencySupported } from '../utils/currency';
import { convertUnit, areUnitsCompatible, normalizeUnit, getUnitConversionRate } from '../utils/units';
import type { RawExtractedValues, NormalizedValues, CommercialTerms, FlagType, UnitOfMeasure, Currency } from '../domain/types';

export function normalizeExtractedLine(
  raw: RawExtractedValues,
  rfxLineItem: { quantity: number; unit: UnitOfMeasure; currency?: string }
): { normalized: NormalizedValues; flags: FlagType[] } {
  const flags: FlagType[] = [];

  let pricePerBaseUnit: number | null = null;
  let totalPrice: number | null = null;
  const targetCurrency: Currency = ((rfxLineItem as any)?.currency as Currency) || 'INR';
  let currency: Currency = targetCurrency;
  let unit: string = 'Unit not provided';
  let quantity: number = rfxLineItem.quantity;
  let terms: CommercialTerms | null = null;

  // Currency validation
  if (raw.price !== null && raw.currency) {
    if (!isCurrencySupported(raw.currency) || raw.currency !== targetCurrency) {
      flags.push('currency_mismatch');
    }
  } else if (raw.price !== null && !raw.currency) {
    flags.push('currency_mismatch');
  } else if (raw.price === null) {
    flags.push('missing_price');
  }

  // Unit normalization and price per base unit calculation
  const packMatch = raw.unit?.match(/per\s*(\d+)\s*(pcs|pc|ea|pieces?)/i);
  if (packMatch) {
    // Pack unit pricing, e.g. "Per 100 Pcs"
    const packSize = parseInt(packMatch[1], 10);
    if (raw.price !== null && raw.currency && isCurrencySupported(raw.currency)) {
      const convertedPrice = convertCurrency(raw.price, raw.currency as any, targetCurrency);
      pricePerBaseUnit = Math.round((convertedPrice / packSize) * 100) / 100;
    }
    unit = rfxLineItem.unit;
    flags.push('unit_mismatch');
  } else if (raw.unit && raw.unit.trim().length > 0 && raw.unit !== '(BLANK)') {
    const normalizedVendorUnit = normalizeUnit(raw.unit);
    if (normalizedVendorUnit) {
      if (!areUnitsCompatible(normalizedVendorUnit, rfxLineItem.unit)) {
        flags.push('unit_mismatch');
        unit = raw.unit;
        pricePerBaseUnit = null;
      } else {
        const rate = getUnitConversionRate(normalizedVendorUnit, rfxLineItem.unit);
        if (rate !== null && raw.price !== null && raw.currency && isCurrencySupported(raw.currency)) {
          const convertedPrice = convertCurrency(raw.price, raw.currency as any, targetCurrency);
          pricePerBaseUnit = Math.round(convertedPrice * rate * 100) / 100;
        }
        unit = rfxLineItem.unit;
      }
    } else {
      flags.push('unsupported_conversion');
      unit = raw.unit;
      pricePerBaseUnit = null;
    }
  } else {
    // When vendor does not provide a unit, do NOT default to EA or infer from RFx.
    // Price per base unit cannot be calculated without knowing source unit.
    unit = 'Unit not provided';
    pricePerBaseUnit = null;
    totalPrice = null;
    flags.push('missing_unit');
  }

  // Quantity conversion
  if (raw.quantity !== null && raw.quantity > 0) {
    if (raw.unit) {
      const normalizedVendorUnit = normalizeUnit(raw.unit);
      if (normalizedVendorUnit && areUnitsCompatible(normalizedVendorUnit, rfxLineItem.unit)) {
        const rate = getUnitConversionRate(normalizedVendorUnit, rfxLineItem.unit);
        if (rate !== null) {
          quantity = raw.quantity * rate;
        } else {
          flags.push('quantity_mismatch');
          quantity = raw.quantity;
        }
      } else {
        flags.push('quantity_mismatch');
        quantity = raw.quantity;
      }
    } else {
      quantity = raw.quantity;
    }
  } else {
    quantity = rfxLineItem.quantity;
  }

  if (pricePerBaseUnit !== null) {
    totalPrice = Math.round(pricePerBaseUnit * rfxLineItem.quantity * 100) / 100;
  } else {
    totalPrice = null;
  }

  if (raw.terms) {
    terms = parseCommercialTerms(raw.terms);
    if (hasAmbiguousTerms(terms, raw.terms)) {
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

function parseCommercialTerms(termsText: string): CommercialTerms {
  const terms: CommercialTerms = { custom: {} };
  const lower = termsText.toLowerCase();

  const paymentMatch = lower.match(/net\s*(\d+)/i);
  if (paymentMatch) terms.paymentTerms = `Net ${paymentMatch[1]}`;

  const deliveryMatch = lower.match(/\b(fob|cfc|cif|dap|dpu|ddp|exw|ex-works|ex\s+works)\b/i);
  if (deliveryMatch) {
    terms.incoterms = deliveryMatch[1].toLowerCase().includes('ex') ? 'EXW' : deliveryMatch[1].toUpperCase();
  }

  const validityMatch = lower.match(/valid(?:ity)?\s*(?:for)?\s*(\d+)\s*days?/i);
  if (validityMatch) terms.validityDays = parseInt(validityMatch[1], 10);

  const moqMatch = lower.match(/(?:moq|minimum\s+order)\s*[:\-]?\s*(\d+)/i);
  if (moqMatch) terms.minimumOrderQty = parseInt(moqMatch[1], 10);

  const leadTimeMatch = lower.match(/lead\s*time\s*[:\-]?\s*(\d+)\s*days?/i);
  if (leadTimeMatch) terms.leadTimeDays = parseInt(leadTimeMatch[1], 10);

  const warrantyMatch = lower.match(/warranty\s*[:\-]?\s*(\d+)\s*months?/i);
  if (warrantyMatch) terms.custom.warrantyMonths = warrantyMatch[1];

  return terms;
}

function hasAmbiguousTerms(terms: CommercialTerms, rawTermsText?: string): boolean {
  if (rawTermsText) {
    const lower = rawTermsText.toLowerCase();
    if (
      lower.includes('freight extra') ||
      lower.includes('actuals') ||
      lower.includes('escalation') ||
      lower.includes('consignee scope') ||
      lower.includes('underwriting') ||
      lower.includes('advance deposit')
    ) {
      return true;
    }
  }
  if (!terms.paymentTerms) return true;
  if (!terms.incoterms) return true;
  return false;
}

export function applyBuyerOverride(
  normalized: NormalizedValues,
  override: { pricePerBaseUnit?: number; unit?: string; terms?: CommercialTerms },
  rfxQuantity: number,
  raw?: RawExtractedValues,
  rfxUnit?: UnitOfMeasure
): NormalizedValues {
  const result = { ...normalized };
  const targetCurrency = (normalized.currency as Currency) || 'INR';

  if (override.unit) {
    result.unit = override.unit;
    // When raw.unit was absent and pricePerBaseUnit was blocked, setting unit explicitly allows normalization to proceed
    if (result.pricePerBaseUnit === null && override.pricePerBaseUnit === undefined && raw && raw.price !== null) {
      const normalizedOverrideUnit = normalizeUnit(override.unit);
      const targetUnit = rfxUnit || 'EA';
      if (normalizedOverrideUnit && areUnitsCompatible(normalizedOverrideUnit, targetUnit)) {
        const rate = getUnitConversionRate(normalizedOverrideUnit, targetUnit);
        if (rate !== null) {
          const convertedPrice = convertCurrency(raw.price, (raw.currency as any) || targetCurrency, targetCurrency);
          result.pricePerBaseUnit = Math.round(convertedPrice * rate * 100) / 100;
          result.totalPrice = Math.round(result.pricePerBaseUnit * rfxQuantity * 100) / 100;
          result.unit = targetUnit;
        }
      }
    }
  }
  if (override.pricePerBaseUnit !== undefined) {
    result.pricePerBaseUnit = override.pricePerBaseUnit;
    result.totalPrice = Math.round(override.pricePerBaseUnit * rfxQuantity * 100) / 100;
  }
  if (override.terms) {
    result.terms = override.terms;
  }
  return result;
}