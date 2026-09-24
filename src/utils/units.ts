import { UNIT_CONVERSIONS } from '../domain/constants';
import type { UnitOfMeasure } from '../domain/types';

export function convertUnit(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value;
  const conversionMap = UNIT_CONVERSIONS[fromUnit];
  if (!conversionMap) {
    throw new Error(`Unsupported source unit: ${fromUnit}`);
  }
  const rate = conversionMap[toUnit];
  if (!rate) {
    throw new Error(`Unsupported unit conversion: ${fromUnit} -> ${toUnit}`);
  }
  return value * rate;
}

export function areUnitsCompatible(fromUnit: string, toUnit: string): boolean {
  if (fromUnit === toUnit) return true;
  const conversionMap = UNIT_CONVERSIONS[fromUnit];
  if (!conversionMap) return false;
  return toUnit in conversionMap;
}

export function getUnitConversionRate(fromUnit: string, toUnit: string): number | null {
  if (fromUnit === toUnit) return 1;
  const conversionMap = UNIT_CONVERSIONS[fromUnit];
  if (!conversionMap) return null;
  return conversionMap[toUnit] ?? null;
}

export function normalizeUnit(unit: string): UnitOfMeasure | null {
  const upper = unit.toUpperCase();
  const knownUnits: UnitOfMeasure[] = ['EA', 'KG', 'M', 'HR', 'L', 'PC', 'SET', 'M2', 'M3', 'TON'];
  if (knownUnits.includes(upper as UnitOfMeasure)) return upper as UnitOfMeasure;
  const aliases: Record<string, UnitOfMeasure> = {
    'EACH': 'EA',
    'PIECE': 'PC',
    'PCS': 'PC',
    'PIECES': 'PC',
    'KILOGRAM': 'KG',
    'KGS': 'KG',
    'METER': 'M',
    'METERS': 'M',
    'METRE': 'M',
    'METRES': 'M',
    'HOUR': 'HR',
    'HOURS': 'HR',
    'LITER': 'L',
    'LITRE': 'L',
    'LITERS': 'L',
    'LITRES': 'L',
    'SET': 'SET',
    'SETS': 'SET',
    'SQM': 'M2',
    'SQ M': 'M2',
    'CUBIC_M': 'M3',
    'CBM': 'M3',
    'TONNE': 'TON',
    'TONNES': 'TON',
  };
  return aliases[upper] ?? null;
}