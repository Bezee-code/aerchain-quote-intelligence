import type { ExtractionResult } from '@/ai/extraction/schemas';
import type { FlagType } from '@/domain/types';
export declare function validateExtraction(result: ExtractionResult): ExtractionResult;
export declare function addFlagsFromValidation(item: ExtractionResult['lineItems'][0], rfxLineItem: {
    unit: string;
    quantity: number;
}): FlagType[];
//# sourceMappingURL=validate.d.ts.map