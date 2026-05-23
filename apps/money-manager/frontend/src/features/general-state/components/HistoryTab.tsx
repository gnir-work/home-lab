import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { cn, formatILS, formatUSD, formatYearMonth } from '../../../lib/utils.js';
import { Currency } from '../../../types/index.js';
import type { AccountConfig, MonthlySnapshot } from '../../../types/index.js';
import { filterAccounts } from '../utils/filterAccounts.js';

type SortKey = 'yearMonth' | string;

function ilsTotalFor(snapshot: MonthlySnapshot, accounts: AccountConfig[]): number {
	return accounts.reduce((sum, a) => {
		if (a.currency === Currency.USD) return sum;
		return sum + (snapshot.values[a.id] ?? 0);
	}, 0);
}

function getDisplayValue(
	val: number,
	account: AccountConfig,
	snapshot: MonthlySnapshot,
	showNative: boolean,
): number {
	if (account.currency !== Currency.USD) return val;
	return showNative ? val : val * (snapshot.usdRate ?? 0);
}

export function HistoryTab({
	snapshots,
	accounts,
	liquidOnly,
	showNative,
	onEdit,
	onDelete,
}: {
	snapshots: MonthlySnapshot[];
	accounts: AccountConfig[];
	liquidOnly: boolean;
	showNative: boolean;
	onEdit: (snapshot: MonthlySnapshot) => void;
	onDelete: (yearMonth: string) => Promise<void>;
}) {
	const [sortKey, setSortKey] = useState<SortKey>('yearMonth');
	const [sortAsc, setSortAsc] = useState(false);
	const [visibleCount, setVisibleCount] = useState(12);
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);

	async function handleDelete(yearMonth: string) {
		setDeleting(true);
		try {
			await onDelete(yearMonth);
		} finally {
			setDeleting(false);
			setConfirmDelete(null);
		}
	}

	const visibleAccounts = filterAccounts(accounts, liquidOnly);

	function handleSort(key: SortKey) {
		if (key === sortKey) {
			setSortAsc((v) => !v);
		} else {
			setSortKey(key);
			setSortAsc(false);
		}
	}

	const sorted = [...snapshots].sort((a, b) => {
		let cmp = 0;
		if (sortKey === 'yearMonth') {
			cmp = a.yearMonth.localeCompare(b.yearMonth);
		} else if (sortKey === '__total__') {
			// Sort by ILS total only (USD incommensurable)
			cmp = ilsTotalFor(a, visibleAccounts) - ilsTotalFor(b, visibleAccounts);
		} else {
			cmp = (a.values[sortKey] ?? 0) - (b.values[sortKey] ?? 0);
		}
		return sortAsc ? cmp : -cmp;
	});

	const displayed = sorted.slice(0, visibleCount);

	function SortIndicator({ col }: { col: SortKey }) {
		if (col !== sortKey) return <span className="ml-1 text-gray-300">↕</span>;
		return <span className="ml-1">{sortAsc ? '↑' : '↓'}</span>;
	}

	function HeaderCell({
		col,
		label,
		className,
	}: {
		col: SortKey;
		label: string;
		className?: string;
	}) {
		return (
			<th className={cn('whitespace-nowrap bg-gray-50 px-0 py-0', className)}>
				<button
					type="button"
					className="w-full px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hover:text-gray-700"
					onClick={() => handleSort(col)}
				>
					{label}
					<SortIndicator col={col} />
				</button>
			</th>
		);
	}

	if (snapshots.length === 0) {
		return (
			<p className="py-12 text-center text-sm text-gray-400">
				No snapshots yet. Add one to get started.
			</p>
		);
	}

	return (
		<div className="rounded-xl border border-gray-200 bg-white shadow-sm">
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-gray-200">
							<HeaderCell col="yearMonth" label="Month" className="sticky left-0 z-10" />
							{visibleAccounts.map((a) => (
								<HeaderCell key={a.id} col={a.id} label={a.label} />
							))}
							<HeaderCell col="__total__" label={showNative ? 'Total (₪)' : 'Total'} />
							<th className="bg-gray-50 px-3 py-3" />
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100">
						{displayed.map((snapshot) => {
							const ilsTotal = ilsTotalFor(snapshot, visibleAccounts);
							const usdTotal = visibleAccounts
								.filter((a) => a.currency === Currency.USD)
								.reduce((sum, a) => sum + (snapshot.values[a.id] ?? 0), 0);
							return (
								<tr key={snapshot.id} className="hover:bg-gray-50">
									<td className="sticky left-0 z-10 bg-white px-4 py-3 font-medium text-gray-700">
										{formatYearMonth(snapshot.yearMonth)}
									</td>
									{visibleAccounts.map((a) => {
										const rawVal = snapshot.values[a.id] ?? 0;
										const displayVal = getDisplayValue(rawVal, a, snapshot, showNative);
										const isUsdNoRate =
											!showNative && a.currency === Currency.USD && !snapshot.usdRate;
										const fmt = showNative && a.currency === Currency.USD ? formatUSD : formatILS;
										return (
											<td
												key={a.id}
												className={cn(
													'px-4 py-3 tabular-nums text-gray-700',
													rawVal < 0 ? 'text-red-600' : '',
													isUsdNoRate ? 'text-gray-300' : '',
												)}
												title={isUsdNoRate ? 'No rate stored for this snapshot' : undefined}
											>
												{isUsdNoRate ? '—' : fmt(displayVal)}
											</td>
										);
									})}
									<td className="bg-white px-4 py-3 font-semibold tabular-nums text-gray-900">
										{showNative ? (
											<span>
												{formatILS(ilsTotal)}
												{usdTotal > 0 && (
													<>
														{' '}
														<span className="text-gray-400">/</span>{' '}
														<span className="text-red-700">{formatUSD(usdTotal)}</span>
													</>
												)}
											</span>
										) : (
											formatILS(
												visibleAccounts.reduce(
													(sum, a) =>
														sum + getDisplayValue(snapshot.values[a.id] ?? 0, a, snapshot, false),
													0,
												),
											)
										)}
									</td>
									<td className="bg-white px-3 py-3">
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
							);
						})}
					</tbody>
				</table>
			</div>

			{sorted.length > visibleCount && (
				<div className="border-t border-gray-100 p-4 text-center">
					<button
						type="button"
						onClick={() => setVisibleCount((n) => n + 12)}
						className="text-sm font-medium text-blue-600 hover:text-blue-700"
					>
						Show more ({sorted.length - visibleCount} remaining)
					</button>
				</div>
			)}
		</div>
	);
}
