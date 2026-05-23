import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { TICKERS } from '../../../config/tickers.js';
import { cn, formatILS, formatUSD } from '../../../lib/utils.js';
import type { MonthlySnapshot, PortfolioSnapshot } from '../../../types/index.js';
import type { BucketGrowth } from '../utils/computeGrowth.js';
import { TickerSparkline } from './charts/TickerSparkline.js';

type GrowthBasis = 'value' | 'price';

function DeltaCell({ value, pct }: { value: number | null; pct: number | null }) {
	if (value === null || pct === null)
		return <td className="px-3 py-2 text-center text-gray-400 text-xs">—</td>;
	const up = value >= 0;
	return (
		<td
			className={cn(
				'px-3 py-2 text-center tabular-nums text-xs',
				up ? 'text-green-600' : 'text-red-600',
			)}
		>
			{up ? '+' : ''}
			{pct.toFixed(1)}%
		</td>
	);
}

function DeltaAbsCell({
	value,
	formatter,
}: { value: number | null; formatter: (v: number) => string }) {
	if (value === null) return <td className="px-3 py-2 text-center text-gray-400 text-xs">—</td>;
	const up = value >= 0;
	return (
		<td
			className={cn(
				'px-3 py-2 text-center tabular-nums text-xs',
				up ? 'text-green-600' : 'text-red-600',
			)}
		>
			{up ? '+' : ''}
			{formatter(value)}
		</td>
	);
}

function BucketTable({
	bucket,
	title,
	snapshots,
	growth,
	formatter,
	growthBasis,
}: {
	bucket: 'ibi_ils' | 'ibi_usd';
	title: string;
	snapshots: PortfolioSnapshot[];
	growth: BucketGrowth;
	formatter: (v: number) => string;
	growthBasis: GrowthBasis;
}) {
	const [expanded, setExpanded] = useState<Set<string>>(new Set());
	const snapshot = snapshots[0];
	const bucketTickers = TICKERS.filter((t) => t.bucket === bucket);

	function toggleExpand(symbol: string) {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(symbol)) next.delete(symbol);
			else next.add(symbol);
			return next;
		});
	}

	return (
		<div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-gray-200 bg-gray-50">
						<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 w-8" />
						<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
							{title}
						</th>
						<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
							Shares
						</th>
						<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
							Price
						</th>
						<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
							Value
						</th>
						<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
							%
						</th>
						<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
							Δ MoM
						</th>
						<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
							Δ MoM %
						</th>
						<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
							Δ 12M %
						</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-100">
					{bucketTickers.map((ticker) => {
						const pos = snapshot?.positions[ticker.symbol];
						const value = pos ? pos.shares * pos.price : 0;
						const pct = growth.totalCurrent > 0 ? (value / growth.totalCurrent) * 100 : 0;
						const tGrowth = growth.tickers.find((g) => g.symbol === ticker.symbol);
						const isExp = expanded.has(ticker.symbol);
						const hasPrevPrices =
							snapshots.length > 1 &&
							snapshots.some((s) => s !== snapshots[0] && s.positions[ticker.symbol]);

						return (
							<>
								<tr key={ticker.symbol} className="hover:bg-gray-50">
									<td className="px-4 py-2">
										<button
											type="button"
											onClick={() => toggleExpand(ticker.symbol)}
											className="rounded p-0.5 text-gray-400 hover:text-gray-600"
										>
											{isExp ? (
												<ChevronDown className="h-3.5 w-3.5" />
											) : (
												<ChevronRight className="h-3.5 w-3.5" />
											)}
										</button>
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<span
												className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
												style={{ backgroundColor: ticker.color }}
											/>
											<span className="font-medium text-gray-800">{ticker.name}</span>
											<span className="text-xs text-gray-400">{ticker.symbol}</span>
										</div>
									</td>
									<td className="px-4 py-3 text-right tabular-nums text-gray-700">
										{pos ? pos.shares.toLocaleString() : '—'}
									</td>
									<td className="px-4 py-3 text-right tabular-nums text-gray-700">
										{pos ? formatter(pos.price) : '—'}
									</td>
									<td className="px-4 py-3 text-right tabular-nums font-medium text-gray-800">
										{pos ? formatter(value) : '—'}
									</td>
									<td className="px-4 py-3 text-right tabular-nums text-gray-600">
										{pos ? `${pct.toFixed(1)}%` : '—'}
									</td>
									{growthBasis === 'value' ? (
										<DeltaAbsCell value={tGrowth?.momAbsolute ?? null} formatter={formatter} />
									) : (
										<td className="px-3 py-2 text-center text-gray-400 text-xs">—</td>
									)}
									<DeltaCell
										value={
											growthBasis === 'value'
												? (tGrowth?.momPct ?? null)
												: (tGrowth?.momPricePct ?? null)
										}
										pct={
											growthBasis === 'value'
												? (tGrowth?.momPct ?? null)
												: (tGrowth?.momPricePct ?? null)
										}
									/>
									<DeltaCell
										value={
											growthBasis === 'value'
												? (tGrowth?.twelveMPct ?? null)
												: (tGrowth?.twelveMPricePct ?? null)
										}
										pct={
											growthBasis === 'value'
												? (tGrowth?.twelveMPct ?? null)
												: (tGrowth?.twelveMPricePct ?? null)
										}
									/>
								</tr>
								{isExp && (
									<tr key={`${ticker.symbol}-expand`} className="bg-blue-50/30">
										<td />
										<td colSpan={8} className="px-6 py-4">
											<div className="grid grid-cols-2 gap-6">
												<div>
													<p className="mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
														Price History (last 6 snapshots)
													</p>
													{hasPrevPrices ? (
														<>
															<TickerSparkline
																symbol={ticker.symbol}
																snapshots={snapshots}
																color={ticker.color}
															/>
															<table className="mt-2 w-full text-xs">
																<tbody>
																	{[...snapshots]
																		.reverse()
																		.filter((s) => s.positions[ticker.symbol])
																		.slice(-6)
																		.map((s) => (
																			<tr key={s.yearMonth}>
																				<td className="py-0.5 text-gray-500">{s.yearMonth}</td>
																				<td className="py-0.5 text-right tabular-nums text-gray-700">
																					{formatter(s.positions[ticker.symbol].price)}
																				</td>
																			</tr>
																		))}
																</tbody>
															</table>
														</>
													) : (
														<p className="text-xs text-gray-400">No price history yet</p>
													)}
												</div>
											</div>
										</td>
									</tr>
								)}
							</>
						);
					})}

					{/* Total row */}
					<tr className="border-t-2 border-gray-200 bg-gray-50 font-semibold">
						<td />
						<td className="px-4 py-3 text-gray-700">TOTAL</td>
						<td />
						<td />
						<td className="px-4 py-3 text-right tabular-nums text-gray-900">
							{formatter(growth.totalCurrent)}
						</td>
						<td className="px-4 py-3 text-right text-gray-600">100.0%</td>
						{growthBasis === 'value' ? (
							<DeltaAbsCell value={growth.totalMomAbsolute} formatter={formatter} />
						) : (
							<td className="px-3 py-2 text-center text-gray-400 text-xs">—</td>
						)}
						<DeltaCell value={growth.totalMomPct} pct={growth.totalMomPct} />
						<DeltaCell value={growth.totalTwelveMPct} pct={growth.totalTwelveMPct} />
					</tr>
				</tbody>
			</table>
		</div>
	);
}

export function HoldingsTab({
	snapshots,
	ilsGrowth,
	usdGrowth,
	netWorthSnapshot,
}: {
	snapshots: PortfolioSnapshot[];
	ilsGrowth: BucketGrowth;
	usdGrowth: BucketGrowth;
	netWorthSnapshot: MonthlySnapshot | null;
}) {
	const [growthBasis, setGrowthBasis] = useState<GrowthBasis>('value');
	const current = snapshots[0] ?? null;

	// Reconciliation check
	let reconcileBanner: React.ReactNode = null;
	if (current && netWorthSnapshot && current.yearMonth === netWorthSnapshot.yearMonth) {
		const nwILS = netWorthSnapshot.values.ibi_ils ?? null;
		const nwUSD = netWorthSnapshot.values.ibi_usd ?? null;
		const usdRate = current.usdRate ?? 1;

		const ilsClose = nwILS !== null && Math.abs(ilsGrowth.totalCurrent - nwILS) < 1;
		const ilsDiff = nwILS !== null ? ilsGrowth.totalCurrent - nwILS : null;

		const portfolioUSDinILS = usdGrowth.totalCurrent * usdRate;
		const usdClose = nwUSD !== null && Math.abs(portfolioUSDinILS - nwUSD) < 1;
		const usdDiff = nwUSD !== null ? portfolioUSDinILS - nwUSD : null;

		const bothMatch = ilsClose && usdClose;
		const hasDiscrepancy = !ilsClose || !usdClose;

		if (bothMatch) {
			reconcileBanner = (
				<div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
					✓ Reconciles with Net Worth for {current.yearMonth}
				</div>
			);
		} else if (hasDiscrepancy) {
			reconcileBanner = (
				<div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2 text-sm text-yellow-700 space-y-1">
					{!ilsClose && ilsDiff !== null && nwILS !== null && (
						<p>
							⚠ ILS holdings {formatILS(ilsGrowth.totalCurrent)} doesn't match Net Worth IBI ILS (
							{formatILS(nwILS)}) — difference {formatILS(Math.abs(ilsDiff))}
						</p>
					)}
					{!usdClose && usdDiff !== null && nwUSD !== null && (
						<p>
							⚠ USD holdings in ILS {formatILS(portfolioUSDinILS)} doesn't match Net Worth IBI USD (
							{formatILS(nwUSD)}) — difference {formatILS(Math.abs(usdDiff))}
						</p>
					)}
				</div>
			);
		}
	}

	if (snapshots.length === 0) {
		return (
			<div className="flex flex-col items-center gap-3 py-16 text-gray-500">
				<p>No holdings snapshots yet.</p>
				<p className="text-sm">Click "+ New Holdings Snapshot" above to get started.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{reconcileBanner}

			<div className="flex items-center gap-2">
				<span className="text-xs text-gray-500">Growth basis:</span>
				{(['value', 'price'] as GrowthBasis[]).map((b) => (
					<button
						key={b}
						type="button"
						onClick={() => setGrowthBasis(b)}
						className={cn(
							'rounded-full px-3 py-1 text-xs font-medium transition-colors',
							growthBasis === b
								? 'bg-blue-600 text-white'
								: 'bg-gray-100 text-gray-600 hover:bg-gray-200',
						)}
					>
						{b === 'value' ? 'Value (incl. contributions)' : 'Price (market only)'}
					</button>
				))}
			</div>

			<div>
				<h3 className="mb-2 text-sm font-semibold text-gray-600">
					ILS Bucket (IBI Stock Market ILS)
				</h3>
				<BucketTable
					bucket="ibi_ils"
					title="Symbol / Name"
					snapshots={snapshots}
					growth={ilsGrowth}
					formatter={formatILS}
					growthBasis={growthBasis}
				/>
			</div>

			<div>
				<h3 className="mb-2 text-sm font-semibold text-gray-600">
					USD Bucket (IBI Stock Market USD)
				</h3>
				<BucketTable
					bucket="ibi_usd"
					title="Symbol / Name"
					snapshots={snapshots}
					growth={usdGrowth}
					formatter={formatUSD}
					growthBasis={growthBasis}
				/>
			</div>
		</div>
	);
}
