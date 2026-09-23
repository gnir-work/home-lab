import { Currency } from '../../../types/index.js';
import type { AccountConfig, MonthlySnapshot } from '../../../types/index.js';

export type Summary =
	| {
			mode: 'ils';
			totalNetWorth: number;
			liquidTotal: number;
			momDelta: number | null;
			bestAccount: { account: AccountConfig; delta: number } | null;
	  }
	| {
			mode: 'native';
			totalNetWorthILS: number;
			totalNetWorthUSD: number;
			liquidILS: number;
			liquidUSD: number;
			momDeltaILS: number | null;
			momDeltaUSD: number | null;
			bestILS: { account: AccountConfig; delta: number } | null;
			bestUSD: { account: AccountConfig; delta: number } | null;
	  };

function toILS(val: number, account: AccountConfig, rate: number | undefined): number {
	if (account.currency !== Currency.USD) return val;
	return rate !== undefined ? val * rate : 0;
}

function sumILS(snapshot: MonthlySnapshot, accounts: AccountConfig[]): number {
	return accounts.reduce(
		(sum, a) => sum + toILS(snapshot.values[a.id] ?? 0, a, snapshot.usdRate),
		0,
	);
}

function sumUSD(snapshot: MonthlySnapshot, accounts: AccountConfig[]): number {
	return accounts.reduce(
		(sum, a) => (a.currency === Currency.USD ? sum + (snapshot.values[a.id] ?? 0) : sum),
		0,
	);
}

function sumILSOnly(snapshot: MonthlySnapshot, accounts: AccountConfig[]): number {
	return accounts.reduce(
		(sum, a) => (a.currency !== Currency.USD ? sum + (snapshot.values[a.id] ?? 0) : sum),
		0,
	);
}

function bestDelta(
	latest: MonthlySnapshot,
	previous: MonthlySnapshot,
	accounts: AccountConfig[],
	mode: 'ils' | 'usd',
): { account: AccountConfig; delta: number } | null {
	let best: { account: AccountConfig; delta: number } | null = null;
	let maxDelta = Number.NEGATIVE_INFINITY;
	for (const account of accounts) {
		const curr = latest.values[account.id] ?? 0;
		const prev = previous.values[account.id] ?? 0;
		const delta =
			mode === 'ils'
				? toILS(curr, account, latest.usdRate) - toILS(prev, account, previous.usdRate)
				: curr - prev;
		if (delta > maxDelta) {
			maxDelta = delta;
			best = { account, delta };
		}
	}
	return best;
}

export function computeSummary(
	snapshots: MonthlySnapshot[],
	allAccounts: AccountConfig[],
	liquidOnly: boolean,
	showNative: boolean,
	liveUsdRate?: number,
): Summary {
	const accounts = liquidOnly ? allAccounts.filter((a) => a.liquid) : allAccounts;

	// snapshots arrive newest-first from the API
	const latest = snapshots[0] ?? null;
	const previous = snapshots[1] ?? null;

	// Inject live rate into the latest snapshot for display purposes
	const latestWithRate =
		latest && liveUsdRate !== undefined
			? { ...latest, usdRate: latest.usdRate ?? liveUsdRate }
			: latest;

	if (!showNative) {
		if (!latestWithRate) {
			return { mode: 'ils', totalNetWorth: 0, liquidTotal: 0, momDelta: null, bestAccount: null };
		}
		const totalNetWorth = sumILS(latestWithRate, accounts);
		const liquidAccounts = allAccounts.filter((a) => a.liquid);
		const liquidTotal = sumILS(latestWithRate, liquidAccounts);
		const momDelta = previous !== null ? totalNetWorth - sumILS(previous, accounts) : null;
		const best = previous !== null ? bestDelta(latestWithRate, previous, accounts, 'ils') : null;
		return { mode: 'ils', totalNetWorth, liquidTotal, momDelta, bestAccount: best };
	}

	// native mode
	if (!latestWithRate) {
		return {
			mode: 'native',
			totalNetWorthILS: 0,
			totalNetWorthUSD: 0,
			liquidILS: 0,
			liquidUSD: 0,
			momDeltaILS: null,
			momDeltaUSD: null,
			bestILS: null,
			bestUSD: null,
		};
	}

	const ilsAccounts = accounts.filter((a) => a.currency !== Currency.USD);
	const usdAccounts = accounts.filter((a) => a.currency === Currency.USD);
	const liquidILSAccounts = allAccounts.filter((a) => a.liquid && a.currency !== Currency.USD);
	const liquidUSDAccounts = allAccounts.filter((a) => a.liquid && a.currency === Currency.USD);

	const totalNetWorthILS = sumILSOnly(latestWithRate, ilsAccounts);
	const totalNetWorthUSD = sumUSD(latestWithRate, usdAccounts);
	const liquidILS = sumILSOnly(latestWithRate, liquidILSAccounts);
	const liquidUSD = sumUSD(latestWithRate, liquidUSDAccounts);

	const momDeltaILS =
		previous !== null ? totalNetWorthILS - sumILSOnly(previous, ilsAccounts) : null;
	const momDeltaUSD = previous !== null ? totalNetWorthUSD - sumUSD(previous, usdAccounts) : null;

	const bestILS =
		previous !== null ? bestDelta(latestWithRate, previous, ilsAccounts, 'ils') : null;
	const bestUSD =
		previous !== null ? bestDelta(latestWithRate, previous, usdAccounts, 'usd') : null;

	return {
		mode: 'native',
		totalNetWorthILS,
		totalNetWorthUSD,
		liquidILS,
		liquidUSD,
		momDeltaILS,
		momDeltaUSD,
		bestILS,
		bestUSD,
	};
}
