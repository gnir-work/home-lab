import { useState } from 'react';
import { ILS_TICKERS, USD_TICKERS } from '../../../config/tickers.js';
import type { PortfolioSnapshot, PortfolioTargets } from '../../../types/index.js';
import { EditTargetsModal } from './EditTargetsModal.js';
import { AllocationDonut } from './charts/AllocationDonut.js';

interface BucketRow {
	symbol: string;
	target: number;
	actual: number;
	drift: number;
}

function BucketAllocationPanel({
	label,
	tickers: bucketTickers,
	snapshot,
	targets,
	onEditTargets,
}: {
	label: string;
	tickers: typeof ILS_TICKERS;
	snapshot: PortfolioSnapshot | null;
	targets: Record<string, number>;
	onEditTargets: () => void;
}) {
	const rows: BucketRow[] = bucketTickers.map((t) => {
		const pos = snapshot?.positions[t.symbol];
		const value = pos ? pos.shares * pos.price : 0;
		const totalBucket = bucketTickers.reduce((s, bt) => {
			const p = snapshot?.positions[bt.symbol];
			return s + (p ? p.shares * p.price : 0);
		}, 0);
		const actual = totalBucket > 0 ? (value / totalBucket) * 100 : 0;
		const target = targets[t.symbol] ?? 0;
		return { symbol: t.symbol, target, actual, drift: actual - target };
	});

	const donutData = rows.map((r) => ({ symbol: r.symbol, value: r.actual }));
	const hasTargets = Object.keys(targets).length > 0;

	return (
		<div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
			<p className="mb-3 text-sm font-semibold text-gray-700">{label}</p>

			<AllocationDonut data={donutData} tickers={bucketTickers} label={label} />

			<table className="mt-4 w-full text-sm">
				<thead>
					<tr className="border-b border-gray-100">
						<th className="pb-2 text-left text-xs font-semibold uppercase text-gray-400">Stock</th>
						<th className="pb-2 text-right text-xs font-semibold uppercase text-gray-400">
							Target
						</th>
						<th className="pb-2 text-right text-xs font-semibold uppercase text-gray-400">
							Actual
						</th>
						<th className="pb-2 text-right text-xs font-semibold uppercase text-gray-400">Drift</th>
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-50">
					{rows.map((row) => (
						<tr key={row.symbol}>
							<td className="py-1.5">
								<div className="flex items-center gap-1.5">
									<span
										className="inline-block h-2 w-2 rounded-full"
										style={{
											backgroundColor:
												bucketTickers.find((t) => t.symbol === row.symbol)?.color ?? '#94a3b8',
										}}
									/>
													<div>
											<div className="font-medium text-gray-800">
												{bucketTickers.find((t) => t.symbol === row.symbol)?.name ?? row.symbol}
											</div>
											<div className="text-xs text-gray-400">{row.symbol}</div>
										</div>
								</div>
							</td>
							<td className="py-1.5 text-right tabular-nums text-gray-600">
								{hasTargets ? `${row.target.toFixed(0)}%` : '—'}
							</td>
							<td className="py-1.5 text-right tabular-nums text-gray-800">
								{snapshot ? `${row.actual.toFixed(1)}%` : '—'}
							</td>
							<td
								className={`py-1.5 text-right tabular-nums text-xs ${
									!hasTargets || !snapshot
										? 'text-gray-400'
										: row.drift > 0
											? 'text-orange-500'
											: row.drift < 0
												? 'text-blue-500'
												: 'text-gray-400'
								}`}
							>
								{hasTargets && snapshot
									? `${row.drift >= 0 ? '+' : ''}${row.drift.toFixed(1)}%`
									: '—'}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			<button
				type="button"
				onClick={onEditTargets}
				className="mt-4 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
			>
				Edit Targets
			</button>
		</div>
	);
}

export function AllocationTab({
	snapshot,
	targets,
	onSaveTargets,
}: {
	snapshot: PortfolioSnapshot | null;
	targets: PortfolioTargets;
	onSaveTargets: (ils: Record<string, number>, usd: Record<string, number>) => Promise<void>;
}) {
	const [editBucket, setEditBucket] = useState<'ils' | 'usd' | null>(null);

	const noTargets = Object.keys(targets.ils).length === 0 && Object.keys(targets.usd).length === 0;

	return (
		<div className="space-y-4">
			{noTargets && (
				<div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
					Set your targets to enable the calculator.
				</div>
			)}

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<BucketAllocationPanel
					label="ILS Bucket"
					tickers={ILS_TICKERS}
					snapshot={snapshot}
					targets={targets.ils}
					onEditTargets={() => setEditBucket('ils')}
				/>
				<BucketAllocationPanel
					label="USD Bucket"
					tickers={USD_TICKERS}
					snapshot={snapshot}
					targets={targets.usd}
					onEditTargets={() => setEditBucket('usd')}
				/>
			</div>

			{editBucket && (
				<EditTargetsModal
					open={editBucket !== null}
					onOpenChange={(o) => !o && setEditBucket(null)}
					bucket={editBucket}
					targets={targets}
					onSave={onSaveTargets}
				/>
			)}
		</div>
	);
}
