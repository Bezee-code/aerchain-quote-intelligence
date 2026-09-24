import { extractedLineItemSchema } from '@/ai/extraction/schemas';
import type { ExtractionResult } from '@/ai/extraction/schemas';
import type { FlagType, MatchState } from '@/domain/types';

export function validateExtraction(result: ExtractionResult): ExtractionResult {
  const validatedItems = [];

  for (const item of result.lineItems) {
    const parsed = extractedLineItemSchema.safeParse(item);
    if (!parsed.success) {
      console.warn('Validation failed for item:', parsed.error);
      validatedItems.push({ ...item, flags: [...item.flags, 'low_confidence'] });
    } else {
      validatedItems.push(parsed.data);
    }
  }

  return { ...result, lineItems: validatedItems };
}

export function addFlagsFromValidation(
  item: ExtractionResult['lineItems'][0],
  rfxLineItem: { unit: string; quantity: number }
): FlagType[] {
  const flags: FlagType[] = [...(item.flags as FlagType[])];

  if (item.price === null) flags.push('missing_price');
  
  if (item.currency && !['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'INR'].includes(item.currency)) {
    flags.push('currency_mismatch');
  }
  
  if (item.price !== null && !item.currency) {
    flags.push('currency_mismatch');
  }
  
  if (item.unit) {
    const normalized = item.unit.toUpperCase();
    const known = ['EA', 'KG', 'M', 'HR', 'L', 'PC', 'SET', 'M2', 'M3', 'TON'];
    if (!known.includes(normalized)) {
      flags.push('unsupported_conversion');
    }
  } else if (item.price !== null) {
    flags.push('unit_mismatch');
  }
  
  if (item.confidence.overall < 0.5) flags.push('low_confidence');
  
  if (item.matchState === 'UNMATCHED') flags.push('no_match_found');

  return [...new Set(flags)];
}

export function generateExtractionFlags(
  item: ExtractionResult['lineItems'][0],
  rfxLineItem?: { unit: string; quantity: number }
): FlagType[] {
  const flags: FlagType[] = [];
  
  if (item.price === null) flags.push('missing_price');
  
  if (item.currency && !['USD', 'EUR', 'GBP', 'CNY', 'JPY', 'INR'].includes(item.currency)) {
    flags.push('currency_mismatch');
  }
  
  if (item.price !== null && !item.currency) {
    flags.push('currency_mismatch');
  }
  
  if (item.unit) {
    const normalized = item.unit.toUpperCase();
    const known = ['EA', 'KG', 'M', 'HR', 'L', 'PC', 'SET', 'M2', 'M3', 'TON'];
    if (!known.includes(normalized)) {
      flags.push('unsupported_conversion');
    } else if (rfxLineItem && !['EA', 'PC', 'SET'].includes(normalized) && !['EA', 'PC', 'SET'].includes(rfxLineItem.unit)) {
      // Check if units are compatible for conversion
      if (normalized !== rfxLineItem.unit) {
        flags.push('unit_mismatch');
      }
    }
  } else if (item.price !== null) {
    flags.push('unit_mismatch');
  }
  
  if (item.confidence.overall < 0.5) flags.push('low_confidence');
  
  if (item.matchState === 'UNMATCHED') flags.push('no_match_found');
  
  if (item.quantity !== null && rfxLineItem && item.quantity !== rfxLineItem.quantity) {
    flags.push('quantity_mismatch');
  }

  return [...new Set(flags)];
}