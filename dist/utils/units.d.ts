import type { UnitOfMeasure } from '../domain/types';
export declare function convertUnit(value: number, fromUnit: string, toUnit: string): number;
export declare function areUnitsCompatible(fromUnit: string, toUnit: string): boolean;
export declare function getUnitConversionRate(fromUnit: string, toUnit: string): number | null;
export declare function normalizeUnit(unit: string): UnitOfMeasure | null;
//# sourceMappingURL=units.d.ts.map