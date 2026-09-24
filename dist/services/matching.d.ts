import type { RFxLineItem, ExtractedLine } from '../domain/types';
export declare function matchLinesToRFx(extractedLines: ExtractedLine[], rfxLineItems: RFxLineItem[]): Map<string, ExtractedLine[]>;
export declare function computeCheapestVendor(quotations: {
    vendorId: string;
    pricePerBaseUnit: number | null;
}[]): string | undefined;
//# sourceMappingURL=matching.d.ts.map