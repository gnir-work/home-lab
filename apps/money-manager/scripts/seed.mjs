#!/usr/bin/env node
/**
 * Generates 12 months of realistic fake snapshot data and POSTs it to the
 * running backend. Existing snapshots for a month are skipped (no overwrite).
 *
 * Usage:
 *   node scripts/seed.mjs              # targets http://localhost:3001
 *   BACKEND_URL=http://x node scripts/seed.mjs
 *   node scripts/seed.mjs --months 24  # generate more history
 *   node scripts/seed.mjs --portfolio-only   # skip net worth, seed portfolio only
 *   node scripts/seed.mjs --skip-portfolio   # seed net worth only (legacy)
 */

const BASE_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';
const args = process.argv.slice(2);
const monthsIdx = args.indexOf('--months');
const MONTHS = monthsIdx !== -1 ? Number(args[monthsIdx + 1]) : 12;
const PORTFOLIO_ONLY = args.includes('--portfolio-only');
const SKIP_PORTFOLIO = args.includes('--skip-portfolio');

// Starting balances — ILS accounts in ILS, USD account in USD
const START = {
	bank: 45_000,
	pension_general: 280_000,
	pension_additional: 95_000,
	keren_hishtalmut: 120_000,
	altshuler_shaham: 85_000,
	apartment_deposit: 12_000, // fixed deposit, grows very slowly
	ibi_ils: 30_000,
	ibi_usd: 8_000, // USD — stored as raw dollars
};

// Monthly drift per account: [mean, stddev]
const DRIFT = {
	bank: [0, 8_000],
	pension_general: [2_200, 1_500],
	pension_additional: [800, 600],
	keren_hishtalmut: [1_100, 700],
	altshuler_shaham: [1_400, 2_500],
	apartment_deposit: [0, 0], // truly fixed
	ibi_ils: [1_000, 2_000],
	ibi_usd: [150, 400], // in USD
};

// Simulated USD/ILS rate drift: start around 3.70, small monthly fluctuation
let usdRate = 3.7;
const USD_RATE_DRIFT = [0, 0.05]; // mean 0, stddev 0.05

// Ticker starting prices
const TICKER_START = {
	1159235: 215,   // ILS — iShares MSCI ACWI ETF (ILS)
	5137906: 180,   // ILS — Keren Sheklit Dollarit IBI
	5139076: 190,   // ILS — Keren Sheklit Dollarit Ayelon
	ACWI: 110,      // USD — iShares MSCI ACWI ETF
	SOXX: 220,      // USD — iShares Semiconductor ETF
};

const TICKER_DRIFT = {
	1159235: [0.5, 8],
	5137906: [0.3, 6],
	5139076: [0.4, 7],
	ACWI: [1.5, 8],
	SOXX: [2, 18],
};

// Tickers per bucket
const ILS_TICKERS = ['1159235', '5137906', '5139076'];
const USD_TICKERS = ['ACWI', 'SOXX'];

// Target allocations (same as seed targets)
const ILS_TARGETS = { 1159235: 80, 5137906: 10, 5139076: 10 };
const USD_TARGETS = { ACWI: 80, SOXX: 20 };

function randn() {
	// Box-Muller transform
	const u = 1 - Math.random();
	const v = Math.random();
	return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function monthOffset(base, offsetMonths) {
	const d = new Date(base.getFullYear(), base.getMonth() - offsetMonths, 1);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	return `${y}-${m}`;
}

async function post(yearMonth, values, rate) {
	const res = await fetch(`${BASE_URL}/api/snapshots`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ yearMonth, values, usdRate: rate }),
	});
	return res.status;
}

async function postPortfolio(yearMonth, positions, rate) {
	const res = await fetch(`${BASE_URL}/api/portfolio`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ yearMonth, positions, usdRate: rate }),
	});
	return res.status;
}

async function putTargets(ils, usd) {
	const res = await fetch(`${BASE_URL}/api/portfolio/targets`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ils, usd }),
	});
	return res.status;
}

/**
 * Given a bucket total and a set of targets, allocate shares to tickers
 * such that bucket total reconciles with netWorthTotal.
 */
function allocateShares(bucketTotal, tickers, targets, prices) {
	if (bucketTotal <= 0) return {};

	// Allocate value per ticker by target proportions
	const allocated = {};
	for (const sym of tickers) {
		const targetPct = targets[sym] / 100;
		allocated[sym] = bucketTotal * targetPct;
	}

	// Derive shares (rounded)
	const shares = {};
	for (const sym of tickers) {
		shares[sym] = Math.max(1, Math.round(allocated[sym] / prices[sym]));
	}

	// Adjust largest-weight ticker to reconcile rounding error
	const actualTotal = tickers.reduce((s, sym) => s + shares[sym] * prices[sym], 0);
	const residual = bucketTotal - actualTotal;

	// Find the largest-weight ticker and absorb residual via price adjustment
	const largest = tickers.reduce((a, b) =>
		(targets[a] ?? 0) >= (targets[b] ?? 0) ? a : b,
	);

	// Adjust price of largest ticker so actual total reconciles
	const otherTotal = tickers
		.filter((s) => s !== largest)
		.reduce((s, sym) => s + shares[sym] * prices[sym], 0);
	const largestValue = bucketTotal - otherTotal;
	const adjustedPrice =
		shares[largest] > 0 ? largestValue / shares[largest] : prices[largest];

	const positions = {};
	for (const sym of tickers) {
		const price = sym === largest ? adjustedPrice : prices[sym];
		positions[sym] = {
			symbol: sym,
			shares: shares[sym],
			price: Math.round(price * 100) / 100,
		};
	}
	return positions;
}

async function main() {
	console.log(`Seeding ${MONTHS} months of fake data → ${BASE_URL}`);
	if (PORTFOLIO_ONLY) console.log('  Mode: --portfolio-only (skipping net worth)');
	if (SKIP_PORTFOLIO) console.log('  Mode: --skip-portfolio (skipping portfolio)');

	const now = new Date();
	// Build history from oldest → newest so balances accumulate correctly
	const balances = { ...START };
	const tickerPrices = { ...TICKER_START };
	const months = Array.from({ length: MONTHS }, (_, i) => MONTHS - 1 - i);

	// Collect net worth snapshots by yearMonth for portfolio reconciliation
	const netWorthByMonth = {};

	let created = 0;
	let skipped = 0;

	// --- Net Worth snapshots ---
	if (!PORTFOLIO_ONLY) {
		console.log('\n--- Net Worth Snapshots ---');
		for (const offset of months) {
			const yearMonth = monthOffset(now, offset);

			const values = Object.fromEntries(
				Object.entries(balances).map(([k, v]) => {
					const round = k === 'ibi_usd' ? 10 : 100;
					return [k, Math.round(v / round) * round];
				}),
			);
			const rate = Math.round(usdRate * 100) / 100;
			netWorthByMonth[yearMonth] = { values, rate };

			const status = await post(yearMonth, values, rate);

			const ilsTotal = Object.entries(values)
				.filter(([k]) => k !== 'ibi_usd')
				.reduce((a, [, b]) => a + b, 0);

			if (status === 201) {
				console.log(
					`  ✓ ${yearMonth}  ₪${ilsTotal.toLocaleString()}  $${values.ibi_usd.toLocaleString()}  (rate: ${rate})`,
				);
				created++;
			} else if (status === 409) {
				console.log(`  – ${yearMonth}  already exists, skipped`);
				skipped++;
			} else {
				console.error(`  ✗ ${yearMonth}  unexpected status ${status}`);
			}

			for (const [key, [mean, std]] of Object.entries(DRIFT)) {
				balances[key] += mean + std * randn();
			}
			usdRate += USD_RATE_DRIFT[0] + USD_RATE_DRIFT[1] * randn();
			usdRate = Math.max(3.2, Math.min(4.2, usdRate));
		}
	}

	// --- Portfolio targets ---
	if (!SKIP_PORTFOLIO) {
		console.log('\n--- Portfolio Targets ---');
		const tStatus = await putTargets(ILS_TARGETS, USD_TARGETS);
		if (tStatus === 200) {
			console.log('  ✓ Targets saved (ILS: 50/50, USD: 50/25/25)');
		} else {
			console.error(`  ✗ Targets failed — status ${tStatus}`);
		}

		// --- Portfolio snapshots ---
		console.log('\n--- Portfolio Snapshots ---');

		// Reset prices for portfolio seed pass
		const pPrices = { ...TICKER_START };
		const pRateStart = 3.7;
		let pRate = pRateStart;

		// We need to reconstruct net worth balances for each month if PORTFOLIO_ONLY
		// In that case we don't have netWorthByMonth, so we simulate them
		const balances2 = { ...START };
		let usdRate2 = pRateStart;

		for (const offset of months) {
			const yearMonth = monthOffset(now, offset);

			// Get IBI totals for this month
			let ibiBILS, ibiUSD, snapshotRate;
			if (netWorthByMonth[yearMonth]) {
				ibiBILS = netWorthByMonth[yearMonth].values.ibi_ils;
				ibiUSD = netWorthByMonth[yearMonth].values.ibi_usd;
				snapshotRate = netWorthByMonth[yearMonth].rate;
			} else {
				// PORTFOLIO_ONLY: simulate the same balances
				const roundedILS = Math.round(balances2.ibi_ils / 100) * 100;
				const roundedUSD = Math.round(balances2.ibi_usd / 10) * 10;
				ibiBILS = roundedILS;
				ibiUSD = roundedUSD;
				snapshotRate = Math.round(usdRate2 * 100) / 100;

				// Advance balances for next iteration
				balances2.ibi_ils += DRIFT.ibi_ils[0] + DRIFT.ibi_ils[1] * randn();
				balances2.ibi_usd += DRIFT.ibi_usd[0] + DRIFT.ibi_usd[1] * randn();
				usdRate2 += USD_RATE_DRIFT[0] + USD_RATE_DRIFT[1] * randn();
				usdRate2 = Math.max(3.2, Math.min(4.2, usdRate2));
			}

			// Advance ticker prices with drift
			for (const sym of [...ILS_TICKERS, ...USD_TICKERS]) {
				const [mean, std] = TICKER_DRIFT[sym];
				pPrices[sym] = Math.max(1, pPrices[sym] + mean + std * randn());
			}

			// Allocate shares to reconcile with IBI totals
			const ilsCopy = { ...pPrices };
			const usdCopy = { ...pPrices };
			const ilsPositions = allocateShares(ibiBILS, ILS_TICKERS, ILS_TARGETS, ilsCopy);
			const usdPositions = allocateShares(ibiUSD, USD_TICKERS, USD_TARGETS, usdCopy);

			const positions = { ...ilsPositions, ...usdPositions };
			const status = await postPortfolio(yearMonth, positions, snapshotRate);

			const ilsTotal = ILS_TICKERS.reduce(
				(s, sym) => s + (positions[sym]?.shares ?? 0) * (positions[sym]?.price ?? 0),
				0,
			);
			const usdTotal = USD_TICKERS.reduce(
				(s, sym) => s + (positions[sym]?.shares ?? 0) * (positions[sym]?.price ?? 0),
				0,
			);

			if (status === 201) {
				console.log(
					`  ✓ ${yearMonth}  ILS ₪${Math.round(ilsTotal).toLocaleString()} (net worth: ₪${ibiBILS?.toLocaleString() ?? '?'})  USD $${Math.round(usdTotal).toLocaleString()} (net worth: $${ibiUSD?.toLocaleString() ?? '?'})`,
				);
				created++;
			} else if (status === 409) {
				console.log(`  – ${yearMonth}  already exists, skipped`);
				skipped++;
			} else {
				console.error(`  ✗ ${yearMonth}  unexpected status ${status}`);
			}
		}
	}

	console.log(`\nDone. Created: ${created}, skipped: ${skipped}`);
}

main().catch((err) => {
	console.error('Seed failed:', err.message);
	process.exit(1);
});
