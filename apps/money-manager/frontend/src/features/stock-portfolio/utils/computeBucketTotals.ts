import type { PortfolioSnapshot, TickerConfig } from '../../../types/index.js';

export interface BucketTotals {
	ilsTotal: number;
	usdTotal: number;
}

export function computeBucketTotals(
	snapshot: PortfolioSnapshot | null,
	tickers: TickerConfig[],
): BucketTotals {
	if (!snapshot) return { ilsTotal: 0, usdTotal: 0 };

	let ilsTotal = 0;
	let usdTotal = 0;

	for (const ticker of tickers) {
		const pos = snapshot.positions[ticker.symbol];
		if (!pos) continue;
		const value = pos.shares * pos.price;
		if (ticker.bucket === 'ibi_ils') {
			ilsTotal += value;
		} else {
			usdTotal += value;
		}
	}

	return { ilsTotal, usdTotal };
}
