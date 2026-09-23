import type { PortfolioSnapshot, TickerConfig } from '../../../types/index.js';

export interface TickerGrowth {
	symbol: string;
	currentValue: number;
	momAbsolute: number | null;
	momPct: number | null;
	twelveMPct: number | null;
	currentPrice: number;
	momPricePct: number | null;
	twelveMPricePct: number | null;
}

export interface BucketGrowth {
	tickers: TickerGrowth[];
	totalCurrent: number;
	totalMomAbsolute: number | null;
	totalMomPct: number | null;
	totalTwelveMPct: number | null;
}

function subtractMonths(yearMonth: string, months: number): string {
	const [y, m] = yearMonth.split('-').map(Number);
	const d = new Date(y, m - 1 - months, 1);
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function computeGrowth(
	snapshots: PortfolioSnapshot[],
	tickers: TickerConfig[],
	bucket: 'ibi_ils' | 'ibi_usd',
): BucketGrowth {
	if (snapshots.length === 0) {
		return {
			tickers: [],
			totalCurrent: 0,
			totalMomAbsolute: null,
			totalMomPct: null,
			totalTwelveMPct: null,
		};
	}

	const current = snapshots[0];
	const bucketTickers = tickers.filter((t) => t.bucket === bucket);

	// Find prev (MoM) and 12M snapshots
	const prevSnapshot = snapshots.length > 1 ? snapshots[1] : null;
	// For 12M: find snapshot closest to 12 months ago
	const twelveMAgo = subtractMonths(current.yearMonth, 12);
	const twelveMSnapshot =
		snapshots.find((s) => s.yearMonth <= twelveMAgo) ??
		(snapshots.length > 1 ? snapshots[snapshots.length - 1] : null);

	const tickerGrowths: TickerGrowth[] = bucketTickers.map((ticker) => {
		const pos = current.positions[ticker.symbol];
		const currentValue = pos ? pos.shares * pos.price : 0;
		const currentPrice = pos ? pos.price : 0;

		const prevPos = prevSnapshot?.positions[ticker.symbol];
		const prevValue = prevPos ? prevPos.shares * prevPos.price : null;
		const prevPrice = prevPos ? prevPos.price : null;

		const momAbsolute = prevValue !== null ? currentValue - prevValue : null;
		const momPct =
			prevValue !== null && prevValue !== 0 ? ((currentValue - prevValue) / prevValue) * 100 : null;
		const momPricePct =
			prevPrice !== null && prevPrice !== 0 && currentPrice !== 0
				? ((currentPrice - prevPrice) / prevPrice) * 100
				: null;

		const twelveMPos = twelveMSnapshot?.positions[ticker.symbol];
		const twelveMValue = twelveMPos ? twelveMPos.shares * twelveMPos.price : null;
		const twelveMPrice = twelveMPos ? twelveMPos.price : null;

		const twelveMPct =
			twelveMValue !== null && twelveMValue !== 0 && twelveMSnapshot !== snapshots[0]
				? ((currentValue - twelveMValue) / twelveMValue) * 100
				: null;
		const twelveMPricePct =
			twelveMPrice !== null && twelveMPrice !== 0 && twelveMSnapshot !== snapshots[0]
				? ((currentPrice - twelveMPrice) / twelveMPrice) * 100
				: null;

		return {
			symbol: ticker.symbol,
			currentValue,
			momAbsolute,
			momPct,
			twelveMPct,
			currentPrice,
			momPricePct,
			twelveMPricePct,
		};
	});

	const totalCurrent = tickerGrowths.reduce((s, t) => s + t.currentValue, 0);

	// Bucket-level MoM
	const prevBucketTotal = prevSnapshot
		? bucketTickers.reduce((s, t) => {
				const p = prevSnapshot.positions[t.symbol];
				return s + (p ? p.shares * p.price : 0);
			}, 0)
		: null;

	const totalMomAbsolute = prevBucketTotal !== null ? totalCurrent - prevBucketTotal : null;
	const totalMomPct =
		prevBucketTotal !== null && prevBucketTotal !== 0
			? ((totalCurrent - prevBucketTotal) / prevBucketTotal) * 100
			: null;

	// Bucket-level 12M
	const twelveMBucketTotal =
		twelveMSnapshot && twelveMSnapshot !== snapshots[0]
			? bucketTickers.reduce((s, t) => {
					const p = twelveMSnapshot.positions[t.symbol];
					return s + (p ? p.shares * p.price : 0);
				}, 0)
			: null;

	const totalTwelveMPct =
		twelveMBucketTotal !== null && twelveMBucketTotal !== 0
			? ((totalCurrent - twelveMBucketTotal) / twelveMBucketTotal) * 100
			: null;

	return {
		tickers: tickerGrowths,
		totalCurrent,
		totalMomAbsolute,
		totalMomPct,
		totalTwelveMPct,
	};
}
