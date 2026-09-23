import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { formatYearMonth } from '../../../lib/utils.js';
import type { AccountConfig, FeeSnapshot } from '../../../types/index.js';

export function FeeHistoryTable({
	snapshots,
	accounts,
	onEdit,
	onDelete,
}: {
	snapshots: FeeSnapshot[];
	accounts: AccountConfig[];
	onEdit: (snapshot: FeeSnapshot) => void;
	onDelete: (date: string) => Promise<void>;
}) {
	const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);

	async function handleDelete(date: string) {
		setDeleting(true);
		try {
			await onDelete(date);
		} finally {
			setDeleting(false);
			setConfirmDelete(null);
		}
	}

	if (snapshots.length === 0) {
		return null;
	}

	return (
		<div>
			<h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">History</h2>
			<div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-gray-200 bg-gray-50">
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
								Date
							</th>
							{accounts.map((a) => (
								<th
									key={a.id}
									className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
									colSpan={2}
								>
									{a.label}
								</th>
							))}
							<th className="bg-gray-50 px-3 py-3" />
						</tr>
						<tr className="border-b border-gray-100 bg-gray-50">
							<th className="px-4 py-2" />
							{accounts.map((a) => (
								<>
									<th key={`${a.id}-dep`} className="px-3 py-2 text-center text-xs text-gray-400">
										Dep%
									</th>
									<th key={`${a.id}-mgmt`} className="px-3 py-2 text-center text-xs text-gray-400">
										Mgmt%
									</th>
								</>
							))}
							<th className="px-3 py-2" />
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100">
						{snapshots.map((snapshot) => (
							<tr key={snapshot.id} className="hover:bg-gray-50">
								<td className="px-4 py-3 font-medium text-gray-700">
									{formatYearMonth(snapshot.date)}
								</td>
								{accounts.map((a) => {
									const entry = snapshot.entries[a.id];
									return (
										<>
											<td
												key={`${a.id}-dep`}
												className="px-3 py-3 text-center tabular-nums text-gray-700"
											>
												{entry ? `${entry.depositFeePct}%` : '—'}
											</td>
											<td
												key={`${a.id}-mgmt`}
												className="px-3 py-3 text-center tabular-nums text-gray-700"
											>
												{entry ? `${entry.managementFeePct}%` : '—'}
											</td>
										</>
									);
								})}
								<td className="px-3 py-3">
									<div className="flex items-center gap-1">
										<button
											type="button"
											onClick={() => onEdit(snapshot)}
											className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
											aria-label={`Edit ${formatYearMonth(snapshot.date)}`}
										>
											<Pencil className="h-4 w-4" />
										</button>
										{confirmDelete === snapshot.date ? (
											<>
												<button
													type="button"
													onClick={() => handleDelete(snapshot.date)}
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
												onClick={() => setConfirmDelete(snapshot.date)}
												className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
												aria-label={`Delete ${formatYearMonth(snapshot.date)}`}
											>
												<Trash2 className="h-4 w-4" />
											</button>
										)}
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
