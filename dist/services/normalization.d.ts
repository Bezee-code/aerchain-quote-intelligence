import type { RawExtractedValues, NormalizedValues, CommercialTerms, FlagType, UnitOfMeasure } from '../domain/types';
export declare function normalizeExtractedLine(raw: RawExtractedValues, rfxLineItem: {
    quantity: number;
    unit: UnitOfMeasure;
}): {
    normalized: NormalizedValues;
    flags: FlagType[];
};
export declare function applyBuyerOverride(normalized: NormalizedValues, override: {
    pricePerBaseUnit?: number;
    unit?: string;
    terms?: CommercialTerms;
}, rfxQuantity: number): NormalizedValues;
//# sourceMappingURL=normalization.d.ts.map