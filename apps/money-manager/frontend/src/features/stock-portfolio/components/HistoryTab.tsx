import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ILS_TICKERS, USD_TICKERS } from '../../../config/tickers.js';
import { cn, formatILS, formatUSD, formatYearMonth } from '../../../lib/utils.js';
import type { PortfolioSnapshot } from '../../../types/index.js';

export function HistoryTab({
	snapshots,
	onEdit,
	onDelete,
}: {
	snapshots: PortfolioSnapshot[];
	onEdit: (snapshot: PortfolioSnapshot) => void;
	onDelete: (yearMonth: string) => Promise<void>;
}) {
	const [expanded, setExpanded] = useState<Set<string>>(new Set());
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);

	function toggleExpand(yearMonth: string) {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(yearMonth)) next.delete(yearMonth);
			else next.add(yearMonth);
			return next;
		});
	}

	async function handleDelete(yearMonth: string) {
		setDeleting(true);
		try {
			await onDelete(yearMonth);
		} finally {
			setDeleting(false);
			setConfirmDelete(null);
		}
	}

	function bucketTotal(snapshot: PortfolioSnapshot, bucket: 'ibi_ils' | 'ibi_usd') {
		const tickers = bucket === 'ibi_ils' ? ILS_TICKERS : USD_TICKERS;
		return tickers.reduce((s, t) => {
			const pos = snapshot.positions[t.symbol];
			return s + (pos ? pos.shares * pos.price : 0);
		}, 0);
	}

	// MoM delta per snapshot (vs the next-older one in the list)
	function momPct(snapshot: PortfolioSnapshot, idx: number, bucket: 'ibi_ils' | 'ibi_usd') {
		const prev = snapshots[idx + 1];
		if (!prev) return null;
		const cur = bucketTotal(snapshot, bucket);
		const pre = bucketTotal(prev, bucket);
		if (pre === 0) return null;
		return ((cur - pre) / pre) * 100;
	}

	if (snapshots.length === 0) {
		return (
			<div className="py-16 text-center text-gray-500">
				<p>No history yet.</p>
			</div>
		);
	}

	return (
		<div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-gray-200 bg-gray-50">
						<th className="w-8 px-3 py-3" />
						<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
							Month
						</th>
						<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
							ILS Bucket
						</th>
						<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
							Δ
						</th>
						<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
							USD Bucket
						</th>
						<th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
							Δ
						</th>
						<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
							USD Rate
						</th>
						<th className="px-3 py-3" />
					</tr>
				</thead>
				<tbody className="divide-y divide-gray-100">
					{snapshots.map((snapshot, idx) => {
						const ilsTotal = bucketTotal(snapshot, 'ibi_ils');
						const usdTotal = bucketTotal(snapshot, 'ibi_usd');
						const ilsMoM = momPct(snapshot, idx, 'ibi_ils');
						const usdMoM = momPct(snapshot, idx, 'ibi_usd');
						const isExp = expanded.has(snapshot.yearMonth);

						return (
							<>
								<tr key={snapshot.yearMonth} className="hover:bg-gray-50">
									<td className="px-3 py-3">
										<button
											type="button"
											onClick={() => toggleExpand(snapshot.yearMonth)}
											className="rounded p-0.5 text-gray-400 hover:text-gray-600"
										>
											{isExp ? (
												<ChevronDown className="h-3.5 w-3.5" />
											) : (
												<ChevronRight className="h-3.5 w-3.5" />
											)}
										</button>
									</td>
									<td className="px-4 py-3 font-medium text-gray-700">
										{formatYearMonth(snapshot.yearMonth)}
									</td>
									<td className="px-4 py-3 text-right tabular-nums text-gray-700">
										{formatILS(ilsTotal)}
									</td>
									<td className="px-4 py-3 text-center text-xs">
										{ilsMoM !== null ? (
											<span className={cn(ilsMoM >= 0 ? 'text-green-600' : 'text-red-600')}>
												{ilsMoM >= 0 ? '+' : ''}
												{ilsMoM.toFixed(1)}%
											</span>
										) : (
											<span className="text-gray-400">—</span>
										)}
									</td>
									<td className="px-4 py-3 text-right tabular-nums text-gray-700">
										{formatUSD(usdTotal)}
									</td>
									<td className="px-4 py-3 text-center text-xs">
										{usdMoM !== null ? (
											<span className={cn(usdMoM >= 0 ? 'text-green-600' : 'text-red-600')}>
												{usdMoM >= 0 ? '+' : ''}
												{usdMoM.toFixed(1)}%
											</span>
										) : (
											<span className="text-gray-400">—</span>
										)}
									</td>
									<td className="px-4 py-3 text-right tabular-nums text-gray-600">
										{snapshot.usdRate ? `₪${snapshot.usdRate.toFixed(2)}` : '—'}
									</td>
									<td className="px-3 py-3">
										<div className="flex items-center gap-1">
											<button
												type="button"
												onClick={() => onEdit(snapshot)}
												className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
												aria-label={`Edit ${formatYearMonth(snapshot.yearMonth)}`}
											>
												<Pencil className="h-4 w-4" />
											</button>
											{confirmDelete === snapshot.yearMonth ? (
												<>
													<button
														type="button"
														onClick={() => handleDelete(snapshot.yearMonth)}
														disabled={deleting}
														className="rounded bg-red-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
													>
														{deleting ? '…' : 'Delete'}
													</button>
													<button
														type="button"
														onClick={() => setConfirmDelete(null)}
														className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
													>
														Cancel
													</button>
												</>
											) : (
												<button
													type="button"
													onClick={() => setConfirmDelete(snapshot.yearMonth)}
													className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
													aria-label={`Delete ${formatYearMonth(snapshot.yearMonth)}`}
												>
													<Trash2 className="h-4 w-4" />
												</button>
											)}
										</div>
									</td>
								</tr>

								{isExp && (
									<tr key={`${snapshot.yearMonth}-exp`} className="bg-gray-50/50">
										<td />
										<td colSpan={7} className="px-6 py-4">
											<div className="grid grid-cols-2 gap-6 text-xs">
												<div>
													<p className="mb-2 font-semibold uppercase tracking-wide text-gray-500">
														ILS Bucket
													</p>
													{ILS_TICKERS.map((t) => {
														const pos = snapshot.positions[t.symbol];
														if (!pos) return null;
														return (
															<div key={t.symbol} className="flex justify-between py-0.5">
																<span className="text-gray-600">
																	{t.name} — {pos.shares} sh × {formatILS(pos.price)}
																</span>
																<span className="tabular-nums font-medium text-gray-800">
																	= {formatILS(pos.shares * pos.price)}
																</span>
															</div>
														);
													})}
												</div>
												<div>
													<p className="mb-2 font-semibold uppercase tracking-wide text-gray-500">
														USD Bucket
													</p>
													{USD_TICKERS.map((t) => {
														const pos = snapshot.positions[t.symbol];
														if (!pos) return null;
														return (
															<div key={t.symbol} className="flex justify-between py-0.5">
																<span className="text-gray-600">
																	{t.name} — {pos.shares} sh × {formatUSD(pos.price)}
																</span>
																<span className="tabular-nums font-medium text-gray-800">
																	= {formatUSD(pos.shares * pos.price)}
																</span>
															</div>
														);
													})}
												</div>
											</div>
										</td>
									</tr>
								)}
							</>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
