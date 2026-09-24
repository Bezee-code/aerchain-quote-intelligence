import { convertCurrency, isCurrencySupported } from '../utils/currency';
import { convertUnit, areUnitsCompatible, normalizeUnit, getUnitConversionRate } from '../utils/units';
import type { RawExtractedValues, NormalizedValues, CommercialTerms, FlagType, UnitOfMeasure } from '../domain/types';

export function normalizeExtractedLine(
  raw: RawExtractedValues,
  rfxLineItem: { quantity: number; unit: UnitOfMeasure }
): { normalized: NormalizedValues; flags: FlagType[] } {
  const flags: FlagType[] = [];

  let pricePerBaseUnit: number | null = null;
  let totalPrice: number | null = null;
  let currency: 'USD' = 'USD';
  let unit: string = 'Unit not provided';
  let quantity: number = rfxLineItem.quantity;
  let terms: CommercialTerms | null = null;

  // Currency validation
  if (raw.price !== null && raw.currency) {
    if (!isCurrencySupported(raw.currency)) {
      flags.push('currency_mismatch');
    }
  } else if (raw.price !== null && !raw.currency) {
    flags.push('currency_mismatch');
  } else if (raw.price === null) {
    flags.push('missing_price');
  }

  // Unit normalization and price per base unit calculation
  if (raw.unit) {
    const normalizedVendorUnit = normalizeUnit(raw.unit);
    if (normalizedVendorUnit) {
      if (!areUnitsCompatible(normalizedVendorUnit, rfxLineItem.unit)) {
        flags.push('unit_mismatch');
        unit = raw.unit;
        pricePerBaseUnit = null;
      } else {
        const rate = getUnitConversionRate(normalizedVendorUnit, rfxLineItem.unit);
        if (rate !== null && raw.price !== null && raw.currency && isCurrencySupported(raw.currency)) {
          const usdPrice = convertCurrency(raw.price, raw.currency as any, 'USD');
          pricePerBaseUnit = usdPrice * rate;
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
    flags.push('unit_mismatch');
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
    totalPrice = pricePerBaseUnit * rfxLineItem.quantity;
  } else {
    totalPrice = null;
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

function parseCommercialTerms(termsText: string): CommercialTerms {
  const terms: CommercialTerms = { custom: {} };
  const lower = termsText.toLowerCase();

  const paymentMatch = lower.match(/net\s*(\d+)/i);
  if (paymentMatch) terms.paymentTerms = `Net ${paymentMatch[1]}`;

  const deliveryMatch = lower.match(/\b(fob|cfc|cif|dap|dpu|ddp|exw)\b/i);
  if (deliveryMatch) terms.incoterms = deliveryMatch[1].toUpperCase();

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

function hasAmbiguousTerms(terms: CommercialTerms): boolean {
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
  if (override.unit) {
    result.unit = override.unit;
    // When raw.unit was absent and pricePerBaseUnit was blocked, setting unit explicitly allows normalization to proceed
    if (result.pricePerBaseUnit === null && override.pricePerBaseUnit === undefined && raw && raw.price !== null) {
      const normalizedOverrideUnit = normalizeUnit(override.unit);
      const targetUnit = rfxUnit || 'EA';
      if (normalizedOverrideUnit && areUnitsCompatible(normalizedOverrideUnit, targetUnit)) {
        const rate = getUnitConversionRate(normalizedOverrideUnit, targetUnit);
        if (rate !== null) {
          const usdPrice = convertCurrency(raw.price, (raw.currency as any) || 'USD', 'USD');
          result.pricePerBaseUnit = usdPrice * rate;
          result.totalPrice = result.pricePerBaseUnit * rfxQuantity;
          result.unit = targetUnit;
        }
      }
    }
  }
  if (override.pricePerBaseUnit !== undefined) {
    result.pricePerBaseUnit = override.pricePerBaseUnit;
    result.totalPrice = override.pricePerBaseUnit * rfxQuantity;
  }
  if (override.terms) {
    result.terms = override.terms;
  }
  return result;
}