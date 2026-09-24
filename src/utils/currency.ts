import { EXCHANGE_RATES_TO_USD } from '../domain/constants';
import type { Currency } from '../domain/types';

export function convertCurrency(amount: number, from: Currency, to: Currency = 'USD'): number {
  if (from === to) return amount;
  const fromRate = EXCHANGE_RATES_TO_USD[from];
  const toRate = EXCHANGE_RATES_TO_USD[to];
  if (!fromRate || !toRate) {
    throw new Error(`Unsupported currency conversion: ${from} -> ${to}`);
  }
  const usdAmount = amount * fromRate;
  return usdAmount / toRate;
}

export function formatCurrency(amount: number | null, currency: Currency = 'USD'): string {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getExchangeRate(from: Currency, to: Currency = 'USD'): number {
  const fromRate = EXCHANGE_RATES_TO_USD[from];
  const toRate = EXCHANGE_RATES_TO_USD[to];
  if (!fromRate || !toRate) return NaN;
  return fromRate / toRate;
}

export function isCurrencySupported(currency: string): currency is Currency {
  return currency in EXCHANGE_RATES_TO_USD;
}