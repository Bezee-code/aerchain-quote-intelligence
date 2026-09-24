import type { NormalizedLineItem } from '../domain/types';
export declare function buildComparison(rfxId: string, onlyFeasible?: boolean): Promise<NormalizedLineItem[]>;
export declare function getComparisonForLineItems(rfxId: string, lineItemIds: string[]): Promise<NormalizedLineItem[]>;
//# sourceMappingURL=comparison.d.ts.map