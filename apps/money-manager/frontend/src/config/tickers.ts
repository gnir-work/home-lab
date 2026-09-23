import { Currency } from '../types/index.js';
import type { TickerConfig } from '../types/index.js';

export const TICKERS: TickerConfig[] = [
	{
		symbol: '1159235',
		name: 'iShares MSCI ACWI ETF (ILS)',
		bucket: 'ibi_ils',
		currency: Currency.ILS,
		color: '#ef4444',
		order: 1,
	},
	{
		symbol: '5137906',
		name: 'Keren Sheklit Dollarit IBI',
		bucket: 'ibi_ils',
		currency: Currency.ILS,
		color: '#f97316',
		order: 2,
	},
	{
		symbol: '5139076',
		name: 'Keren Sheklit Dollarit Ayelon',
		bucket: 'ibi_ils',
		currency: Currency.ILS,
		color: '#f59e0b',
		order: 3,
	},
	{
		symbol: 'ACWI',
		name: 'iShares MSCI ACWI ETF',
		bucket: 'ibi_usd',
		currency: Currency.USD,
		color: '#3b82f6',
		order: 4,
	},
	{
		symbol: 'SOXX',
		name: 'iShares Semiconductor ETF',
		bucket: 'ibi_usd',
		currency: Currency.USD,
		color: '#8b5cf6',
		order: 5,
	},
];

export const ILS_TICKERS = TICKERS.filter((t) => t.bucket === 'ibi_ils');
export const USD_TICKERS = TICKERS.filter((t) => t.bucket === 'ibi_usd');
