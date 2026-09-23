import { formatILS } from '../../../lib/utils.js';
import type { AccountConfig, FeeSnapshot } from '../../../types/index.js';

export function CurrentRatesTable({
	latestSnapshot,
	accounts,
}: {
	latestSnapshot: FeeSnapshot | null;
	accounts: AccountConfig[];
}) {
	return (
		<div>
			<h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
				Current Rates
			</h2>
			<div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-gray-200 bg-gray-50">
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
								Account
							</th>
							<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
								Deposit Fee
							</th>
							<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
								Management Fee
							</th>
							<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
								Monthly Deposit
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100">
						{accounts.map((account) => {
							const entry = latestSnapshot?.entries[account.id];
							return (
								<tr key={account.id} className="hover:bg-gray-50">
									<td className="px-4 py-3">
										<div className="flex items-center gap-2">
											<span
												className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
												style={{ backgroundColor: account.color }}
											/>
											<span className="font-medium text-gray-700">{account.label}</span>
										</div>
									</td>
									<td className="px-4 py-3 text-right tabular-nums text-gray-700">
										{entry ? `${entry.depositFeePct}%` : '—'}
									</td>
									<td className="px-4 py-3 text-right tabular-nums text-gray-700">
										{entry ? `${entry.managementFeePct}%` : '—'}
									</td>
									<td className="px-4 py-3 text-right tabular-nums text-gray-700">
										{entry ? formatILS(entry.monthlyDeposit) : '—'}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
				{!latestSnapshot && (
					<p className="py-8 text-center text-sm text-gray-400">
						No fee data yet. Add a fee snapshot to get started.
					</p>
				)}
			</div>
		</div>
	);
}
