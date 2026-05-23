import { formatILS } from '../../../lib/utils.js';
import type { AccountConfig } from '../../../types/index.js';
import type { FeeImpact } from '../utils/computeFeeImpact.js';

export function ImpactSummary({
	impacts,
	accounts,
	hasBalanceData,
}: {
	impacts: FeeImpact[];
	accounts: AccountConfig[];
	hasBalanceData: boolean;
}) {
	const totalBalance = impacts.reduce((s, i) => s + i.currentBalance, 0);
	const totalDeposit = impacts.reduce((s, i) => s + i.depositCostAnnual, 0);
	const totalMgmt = impacts.reduce((s, i) => s + i.managementCostAnnual, 0);
	const totalAll = impacts.reduce((s, i) => s + i.totalCostAnnual, 0);

	return (
		<div>
			<div className="mb-3 flex items-center gap-3">
				<h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
					Estimated Annual Cost
				</h2>
				{!hasBalanceData && (
					<span className="text-xs text-gray-400">
						(management cost shows ₪0 — no net worth snapshot found)
					</span>
				)}
			</div>
			<div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b border-gray-200 bg-gray-50">
							<th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
								Account
							</th>
							<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
								Current Balance
							</th>
							<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
								Deposit Cost / Year
							</th>
							<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
								Management Cost / Year
							</th>
							<th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
								Total Fees / Year
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-100">
						{accounts.map((account) => {
							const impact = impacts.find((i) => i.accountId === account.id);
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
										{impact ? formatILS(impact.currentBalance) : '—'}
									</td>
									<td className="px-4 py-3 text-right tabular-nums text-red-600">
										{impact ? formatILS(impact.depositCostAnnual) : '—'}
									</td>
									<td className="px-4 py-3 text-right tabular-nums text-red-600">
										{impact ? formatILS(impact.managementCostAnnual) : '—'}
									</td>
									<td className="px-4 py-3 text-right font-semibold tabular-nums text-red-700">
										{impact ? formatILS(impact.totalCostAnnual) : '—'}
									</td>
								</tr>
							);
						})}
					</tbody>
					<tfoot>
						<tr className="border-t-2 border-gray-200 bg-gray-50">
							<td className="px-4 py-3 text-sm font-semibold text-gray-700">Total</td>
							<td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-700">
								{formatILS(totalBalance)}
							</td>
							<td className="px-4 py-3 text-right font-semibold tabular-nums text-red-600">
								{formatILS(totalDeposit)}
							</td>
							<td className="px-4 py-3 text-right font-semibold tabular-nums text-red-600">
								{formatILS(totalMgmt)}
							</td>
							<td className="px-4 py-3 text-right font-bold tabular-nums text-red-700">
								{formatILS(totalAll)}
							</td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
	);
}
