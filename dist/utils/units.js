import { UNIT_CONVERSIONS } from '../domain/constants';
export function convertUnit(value, fromUnit, toUnit) {
    if (fromUnit === toUnit)
        return value;
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
export function areUnitsCompatible(fromUnit, toUnit) {
    if (fromUnit === toUnit)
        return true;
    const conversionMap = UNIT_CONVERSIONS[fromUnit];
    if (!conversionMap)
        return false;
    return toUnit in conversionMap;
}
export function getUnitConversionRate(fromUnit, toUnit) {
    if (fromUnit === toUnit)
        return 1;
    const conversionMap = UNIT_CONVERSIONS[fromUnit];
    if (!conversionMap)
        return null;
    return conversionMap[toUnit] ?? null;
}
export function normalizeUnit(unit) {
    const upper = unit.toUpperCase();
    const knownUnits = ['EA', 'KG', 'M', 'HR', 'L', 'PC', 'SET', 'M2', 'M3', 'TON'];
    if (knownUnits.includes(upper))
        return upper;
    const aliases = {
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
//# sourceMappingURL=units.js.map