import { useEffect, useState } from 'react';
import { ILS_TICKERS, TICKERS, USD_TICKERS } from '../../../config/tickers.js';
import { cn, formatILS, formatUSD } from '../../../lib/utils.js';
import type { PortfolioSnapshot, PortfolioTargets, TickerConfig } from '../../../types/index.js';
import { type RebalanceResult, computeRebalance } from '../utils/rebalanceCalculator.js';

export function CalculatorTab({
	snapshot,
	targets,
}: {
	snapshot: PortfolioSnapshot | null;
	targets: PortfolioTargets;
}) {
	const [cash, setCash] = useState('');
	const [currency, setCurrency] = useState<'usd' | 'ils'>('usd');
	const [currentPrices, setCurrentPrices] = useState<Record<string, string>>({});
	const [result, setResult] = useState<RebalanceResult | null>(null);

	const hasTargets = Object.keys(targets.ils).length > 0 || Object.keys(targets.usd).length > 0;

	const bucketTickers: TickerConfig[] = currency === 'usd' ? USD_TICKERS : ILS_TICKERS;

	// Pre-fill prices from snapshot when currency or snapshot changes
	useEffect(() => {
		if (!snapshot) return;
		const init: Record<string, string> = {};
		for (const t of bucketTickers) {
			const pos = snapshot.positions[t.symbol];
			init[t.symbol] = pos ? pos.price.toString() : '';
		}
		setCurrentPrices(init);
		setResult(null);
	}, [currency, snapshot]);

	function compute() {
		if (!snapshot || !cash || Number(cash) <= 0) return;
		const bucket = currency === 'usd' ? 'ibi_usd' : 'ibi_ils';
		const targetMap = currency === 'usd' ? targets.usd : targets.ils;

		// Build a patched snapshot with overridden prices
		const patchedPositions = { ...snapshot.positions };
		for (const t of bucketTickers) {
			const priceStr = currentPrices[t.symbol];
			const price = priceStr ? Number(priceStr) : 0;
			if (price > 0) {
				const existing = patchedPositions[t.symbol];
				patchedPositions[t.symbol] = {
					symbol: t.symbol,
					shares: existing?.shares ?? 0,
					price,
				};
			}
		}
		const patchedSnapshot: PortfolioSnapshot = { ...snapshot, positions: patchedPositions };

		const res = computeRebalance(patchedSnapshot, targetMap, TICKERS, bucket, Number(cash));
		setResult(res);
	}

	const formatter = currency === 'usd' ? formatUSD : formatILS;
	const currSymbol = currency === 'usd' ? '$' : '₪';

	if (!snapshot) {
		return (
			<div className="py-16 text-center text-gray-500">
				<p>Create a holdings snapshot first to use the calculator.</p>
			</div>
		);
	}

	if (!hasTargets) {
		return (
			<div className="py-16 text-center text-gray-500">
				<p>Set targets on the Allocation tab first.</p>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-2xl space-y-6">
			<div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
				<h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
					Rebalance Calculator
				</h3>

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label htmlFor="calc-cash" className="mb-1 block text-sm font-medium text-gray-700">
							Amount to invest
						</label>
						<div className="relative">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
								{currSymbol}
							</span>
							<input
								id="calc-cash"
								type="number"
								min="0"
								step="100"
								value={cash}
								onChange={(e) => {
									setCash(e.target.value);
									setResult(null);
								}}
								placeholder="5000"
								className="w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					</div>

					<div>
						<p className="mb-1 text-sm font-medium text-gray-700">Currency</p>
						<div className="flex gap-2">
							{(['usd', 'ils'] as const).map((c) => (
								<button
									key={c}
									type="button"
									onClick={() => {
										setCurrency(c);
										setResult(null);
									}}
									className={cn(
										'flex-1 rounded-md border py-2 text-sm font-medium transition-colors',
										currency === c
											? 'border-blue-600 bg-blue-600 text-white'
											: 'border-gray-300 text-gray-600 hover:bg-gray-50',
									)}
								>
									{c.toUpperCase()}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Current prices */}
				<div className="mt-4">
					<p className="mb-2 text-sm font-medium text-gray-700">Current prices</p>
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-gray-200">
								<th className="pb-1.5 text-left text-xs font-medium text-gray-500">Stock</th>
								<th className="pb-1.5 pl-3 text-left text-xs font-medium text-gray-500 w-36">
									Price ({currSymbol})
								</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
							{bucketTickers.map((t) => (
								<tr key={t.symbol}>
									<td className="py-2 pr-3">
										<div className="flex items-center gap-2">
											<span
												className="inline-block h-2 w-2 shrink-0 rounded-full"
												style={{ backgroundColor: t.color }}
											/>
											<div>
												<div className="font-medium text-gray-800">{t.name}</div>
												<div className="text-xs text-gray-400">{t.symbol}</div>
											</div>
										</div>
									</td>
									<td className="py-2 pl-3">
										<div className="relative">
											<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
												{currSymbol}
											</span>
											<input
												type="number"
												step="0.01"
												min="0"
												value={currentPrices[t.symbol] ?? ''}
												onChange={(e) => {
													setCurrentPrices((prev) => ({ ...prev, [t.symbol]: e.target.value }));
													setResult(null);
												}}
												placeholder="0.00"
												className="w-full rounded-md border border-gray-300 py-1.5 pl-6 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					<p className="mt-1.5 text-xs text-gray-400">
						Pre-filled from snapshot ({snapshot.yearMonth}). Update to today's prices before computing.
					</p>
				</div>

				<button
					type="button"
					onClick={compute}
					disabled={!cash || Number(cash) <= 0}
					className="mt-4 w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					Compute
				</button>
			</div>

			{result && (
				<div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
					<h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
						Result — Buy these shares
					</h3>

					{result.missingPrices.length > 0 && (
						<p className="mb-3 rounded-md bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
							⚠ No price entered for{' '}
							{result.missingPrices
								.map((sym) => TICKERS.find((t) => t.symbol === sym)?.name ?? sym)
								.join(', ')}
							. Enter a current price above to include them.
						</p>
					)}
					{result.allOverTarget && (
						<p className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
							All tickers are at or above target. Deploying new cash in target proportions; full
							rebalance would require selling.
						</p>
					)}

					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-gray-200">
									<th className="pb-2 text-left text-xs font-semibold uppercase text-gray-400">
										Stock
									</th>
									<th className="pb-2 text-right text-xs font-semibold uppercase text-gray-400">
										Price
									</th>
									<th className="pb-2 text-right text-xs font-semibold uppercase text-gray-400">
										Buy
									</th>
									<th className="pb-2 text-right text-xs font-semibold uppercase text-gray-400">
										Spend
									</th>
									<th className="pb-2 text-right text-xs font-semibold uppercase text-gray-400">
										New %
									</th>
									<th className="pb-2 text-right text-xs font-semibold uppercase text-gray-400">
										Target %
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{result.rows.map((row) => (
									<tr key={row.symbol}>
										<td className="py-2">
											<div className="font-medium text-gray-800">
												{TICKERS.find((t) => t.symbol === row.symbol)?.name ?? row.symbol}
											</div>
											<div className="text-xs text-gray-400">{row.symbol}</div>
										</td>
										<td className="py-2 text-right tabular-nums text-gray-600">
											{formatter(row.price)}
										</td>
										<td className="py-2 text-right tabular-nums font-semibold text-gray-900">
											{row.buyShares}
										</td>
										<td className="py-2 text-right tabular-nums text-gray-700">
											{formatter(row.spend)}
										</td>
										<td className="py-2 text-right tabular-nums text-gray-700">
											{row.newPct.toFixed(1)}%
										</td>
										<td className="py-2 text-right tabular-nums text-gray-500">
											{row.targetPct.toFixed(0)}%
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="mt-4 border-t border-gray-100 pt-3 flex justify-between text-sm">
						<span className="text-gray-600">
							Total spent:{' '}
							<span className="font-semibold text-gray-900">{formatter(result.totalSpent)}</span>
						</span>
						<span className="text-gray-600">
							Leftover:{' '}
							<span
								className={cn(
									'font-semibold',
									result.leftover > 0 ? 'text-orange-500' : 'text-gray-900',
								)}
							>
								{formatter(result.leftover)}
							</span>
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
