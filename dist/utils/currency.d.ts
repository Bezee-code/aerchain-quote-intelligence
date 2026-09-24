import type { Currency } from '../domain/types';
export declare function convertCurrency(amount: number, from: Currency, to?: Currency): number;
export declare function formatCurrency(amount: number | null, currency?: Currency): string;
export declare function getExchangeRate(from: Currency, to?: Currency): number;
export declare function isCurrencySupported(currency: string): currency is Currency;
//# sourceMappingURL=currency.d.ts.map