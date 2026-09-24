import { normalizeExtractedLine } from '@/services/normalization';
import type { RawExtractedValues, RFxLineItem } from '@/domain/types';
import type { ExtractedLineItem } from '@/ai/extraction/schemas';

export function buildRawValues(item: ExtractedLineItem): RawExtractedValues {
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

export function normalizeLineItem(
  item: ExtractedLineItem,
  rfxLineItem: RFxLineItem
): { normalized: any; flags: any[] } {
  const raw = buildRawValues(item);
  return normalizeExtractedLine(raw, rfxLineItem);
}