import type { SplitResult } from '../domain/types';
export interface SplitConstraints {
    maxVendors?: number;
    minVolumePerVendor?: number;
    preferredVendors?: string[];
    excludedVendors?: string[];
    requireFeasible?: boolean;
}
export declare function optimizeSplit(rfxId: string, lineItemIds: string[], constraints?: SplitConstraints): Promise<SplitResult>;
//# sourceMappingURL=split-analysis.d.ts.map