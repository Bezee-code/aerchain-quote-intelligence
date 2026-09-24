import type { RawExtractedValues, RFxLineItem } from '@/domain/types';
import type { ExtractedLineItem } from '@/ai/extraction/schemas';
export declare function buildRawValues(item: ExtractedLineItem): RawExtractedValues;
export declare function normalizeLineItem(item: ExtractedLineItem, rfxLineItem: RFxLineItem): {
    normalized: any;
    flags: any[];
};
//# sourceMappingURL=normalize.d.ts.map