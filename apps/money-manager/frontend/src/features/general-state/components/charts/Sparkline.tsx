import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { cn, formatCurrency } from '../../../../lib/utils.js';
import type { AccountConfig, MonthlySnapshot } from '../../../../types/index.js';

export function AccountSparklines({
	snapshots,
	accounts,
	liquidOnly,
	showNative,
}: {
	snapshots: MonthlySnapshot[];
	accounts: AccountConfig[];
	liquidOnly: boolean;
	showNative: boolean;
}) {
	if (snapshots.length < 2) return null;

	const sorted = [...snapshots].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
	const latest = sorted[sorted.length - 1];
	const previous = sorted[sorted.length - 2];

	const visibleAccounts = accounts.filter((a) => !liquidOnly || a.liquid);
	const hiddenAccounts = liquidOnly ? accounts.filter((a) => !a.liquid) : [];

	function displayCurrency(account: AccountConfig): string {
		return showNative ? account.currency : 'ILS';
	}

	return (
		<div>
			<h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
				Per-Account Trend
			</h3>
			<div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
				{visibleAccounts.map((account) => {
					const data = sorted.map((s) => ({ v: s.values[account.id] ?? 0 }));
					const currentVal = latest.values[account.id] ?? 0;
					const prevVal = previous.values[account.id] ?? 0;
					const delta = currentVal - prevVal;
					const currency = displayCurrency(account);

					return (
						<div key={account.id} className="px-4 py-3">
							{/* Top row: dot + label + delta */}
							<div className="flex items-center gap-2">
								<span
									className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
									style={{ backgroundColor: account.color }}
								/>
								<span className="truncate text-sm font-medium text-gray-700">{account.label}</span>
								<span
									className={cn(
										'ml-auto shrink-0 text-xs tabular-nums',
										delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-gray-400',
									)}
								>
									{delta > 0 ? '▲' : delta < 0 ? '▼' : '—'}{' '}
									{delta !== 0 ? formatCurrency(Math.abs(delta), currency) : ''}
								</span>
							</div>

							{/* Bottom row: sparkline + current value */}
							<div className="mt-1 flex items-center gap-3 pl-4">
								<div className="h-8 w-24 shrink-0">
									<ResponsiveContainer width="100%" height="100%">
										<LineChart data={data}>
											<Line
												type="monotone"
												dataKey="v"
												stroke={account.color}
												strokeWidth={1.5}
												dot={false}
												isAnimationActive={false}
											/>
										</LineChart>
									</ResponsiveContainer>
								</div>
								<span
									className={cn(
										'text-sm font-semibold tabular-nums',
										currentVal < 0 ? 'text-red-600' : 'text-gray-900',
									)}
								>
									{formatCurrency(currentVal, currency)}
								</span>
							</div>
						</div>
					);
				})}

				{/* Greyed-out long-term accounts when liquid filter active */}
				{hiddenAccounts.map((account) => {
					const currency = displayCurrency(account);
					return (
						<div key={account.id} className="px-4 py-3 opacity-30">
							<div className="flex items-center gap-2">
								<span
									className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
									style={{ backgroundColor: account.color }}
								/>
								<span className="truncate text-sm font-medium text-gray-700">{account.label}</span>
								<span className="ml-auto text-sm text-gray-400">
									{formatCurrency(latest.values[account.id] ?? 0, currency)}
								</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
