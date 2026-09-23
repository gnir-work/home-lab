import type { PortfolioSnapshot, TickerConfig } from '../../../types/index.js';

export interface RebalanceResult {
	rows: RebalanceRow[];
	totalSpent: number;
	leftover: number;
	allOverTarget: boolean;
	missingPrices: string[];
}

export interface RebalanceRow {
	symbol: string;
	price: number;
	buyShares: number;
	spend: number;
	newPct: number;
	targetPct: number;
}

export function computeRebalance(
	snapshot: PortfolioSnapshot,
	targets: Record<string, number>,
	tickers: TickerConfig[],
	bucket: 'ibi_ils' | 'ibi_usd',
	cash: number,
): RebalanceResult {
	const bucketTickers = tickers.filter((t) => t.bucket === bucket);

	// Current values per ticker
	const values: Record<string, number> = {};
	const prices: Record<string, number> = {};

	for (const ticker of bucketTickers) {
		const pos = snapshot.positions[ticker.symbol];
		prices[ticker.symbol] = pos ? pos.price : 0;
		values[ticker.symbol] = pos ? pos.shares * pos.price : 0;
	}

	const currentTotal = Object.values(values).reduce((s, v) => s + v, 0);
	const newTotal = currentTotal + cash;

	// Compute deficits
	const deficits: Record<string, number> = {};
	for (const ticker of bucketTickers) {
		const targetPct = targets[ticker.symbol] ?? 0;
		const desired = (targetPct / 100) * newTotal;
		deficits[ticker.symbol] = Math.max(0, desired - values[ticker.symbol]);
	}

	const totalDeficit = Object.values(deficits).reduce((s, d) => s + d, 0);
	const allOverTarget = totalDeficit === 0;

	// Determine weights
	const weights: Record<string, number> = {};
	if (allOverTarget) {
		// Fallback: deploy in target proportions
		for (const ticker of bucketTickers) {
			weights[ticker.symbol] = (targets[ticker.symbol] ?? 0) / 100;
		}
	} else {
		for (const ticker of bucketTickers) {
			weights[ticker.symbol] = deficits[ticker.symbol] / totalDeficit;
		}
	}

	// Initial share allocation
	const spends: Record<string, number> = {};
	const shares: Record<string, number> = {};

	for (const ticker of bucketTickers) {
		const price = prices[ticker.symbol];
		if (price <= 0) {
			spends[ticker.symbol] = 0;
			shares[ticker.symbol] = 0;
			continue;
		}
		const spend = weights[ticker.symbol] * cash;
		const s = Math.floor(spend / price);
		shares[ticker.symbol] = s;
		spends[ticker.symbol] = s * price;
	}

	let spent = Object.values(spends).reduce((s, v) => s + v, 0);
	let leftover = cash - spent;

	// Greedily buy one more share at a time, picking whichever ticker minimises drift,
	// until no ticker can be afforded with the remaining cash.
	while (true) {
		let bestTicker: string | null = null;
		let bestDrift = Number.POSITIVE_INFINITY;

		const runningTotal = currentTotal + spent;

		for (const ticker of bucketTickers) {
			const price = prices[ticker.symbol];
			if (price <= 0 || leftover < price) continue;

			const targetPct = targets[ticker.symbol] ?? 0;
			const valueAfter = values[ticker.symbol] + (shares[ticker.symbol] + 1) * price;
			const totalAfter = runningTotal + price;
			const pctAfter = totalAfter > 0 ? (valueAfter / totalAfter) * 100 : 0;
			const drift = Math.abs(pctAfter - targetPct);

			if (drift < bestDrift) {
				bestDrift = drift;
				bestTicker = ticker.symbol;
			}
		}

		if (bestTicker === null) break;

		const price = prices[bestTicker];
		shares[bestTicker] += 1;
		spends[bestTicker] += price;
		spent += price;
		leftover -= price;
	}

	leftover = cash - Object.values(spends).reduce((s, v) => s + v, 0);

	// Build result rows
	const finalNewTotal = currentTotal + Object.values(spends).reduce((s, v) => s + v, 0);

	const rows: RebalanceRow[] = bucketTickers.map((ticker) => {
		const newValue = values[ticker.symbol] + spends[ticker.symbol];
		const newPct = finalNewTotal > 0 ? (newValue / finalNewTotal) * 100 : 0;
		return {
			symbol: ticker.symbol,
			price: prices[ticker.symbol],
			buyShares: shares[ticker.symbol],
			spend: spends[ticker.symbol],
			newPct,
			targetPct: targets[ticker.symbol] ?? 0,
		};
	});

	const missingPrices = bucketTickers
		.filter((t) => prices[t.symbol] <= 0)
		.map((t) => t.symbol);

	return {
		rows,
		totalSpent: Object.values(spends).reduce((s, v) => s + v, 0),
		leftover,
		allOverTarget,
		missingPrices,
	};
}
