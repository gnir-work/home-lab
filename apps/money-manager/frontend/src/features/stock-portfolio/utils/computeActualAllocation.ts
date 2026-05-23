import type { PortfolioSnapshot, TickerConfig } from '../../../types/index.js';

export interface TickerAllocation {
	symbol: string;
	value: number;
	pct: number;
}

export interface BucketAllocation {
	tickers: TickerAllocation[];
	total: number;
}

export function computeActualAllocation(
	snapshot: PortfolioSnapshot | null,
	tickers: TickerConfig[],
): { ils: BucketAllocation; usd: BucketAllocation } {
	const empty = (): BucketAllocation => ({ tickers: [], total: 0 });

	if (!snapshot) return { ils: empty(), usd: empty() };

	const ilsTickers = tickers.filter((t) => t.bucket === 'ibi_ils');
	const usdTickers = tickers.filter((t) => t.bucket === 'ibi_usd');

	function computeBucket(bucketTickers: TickerConfig[]): BucketAllocation {
		const items = bucketTickers.map((t) => {
			const pos = snapshot?.positions[t.symbol];
			const value = pos ? pos.shares * pos.price : 0;
			return { symbol: t.symbol, value };
		});
		const total = items.reduce((s, i) => s + i.value, 0);
		return {
			tickers: items.map((i) => ({
				...i,
				pct: total > 0 ? (i.value / total) * 100 : 0,
			})),
			total,
		};
	}

	return { ils: computeBucket(ilsTickers), usd: computeBucket(usdTickers) };
}
