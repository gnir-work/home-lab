import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatILS, formatUSD, formatYearMonth } from '../../../../lib/utils.js';
import { Currency } from '../../../../types/index.js';
import type { AccountConfig, MonthlySnapshot } from '../../../../types/index.js';
import { filterAccounts } from '../../utils/filterAccounts.js';

function toILS(val: number, account: AccountConfig, rate: number | undefined): number {
	if (account.currency !== Currency.USD) return val;
	return rate !== undefined ? val * rate : 0;
}

function DonutChart({
	data,
	formatter,
	label,
}: {
	data: { name: string; value: number; color: string }[];
	formatter: (v: number) => string;
	label?: string;
}) {
	return (
		<div className="flex flex-col items-center gap-2">
			{label && (
				<p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
			)}
			<div className="h-36 w-36 sm:h-44 sm:w-44">
				<ResponsiveContainer width="100%" height="100%">
					<PieChart>
						<Pie
							data={data}
							cx="50%"
							cy="50%"
							innerRadius="55%"
							outerRadius="80%"
							dataKey="value"
							paddingAngle={2}
						>
							{data.map((entry) => (
								<Cell key={entry.name} fill={entry.color} />
							))}
						</Pie>
						<Tooltip
							formatter={(value) => [typeof value === 'number' ? formatter(value) : value]}
							contentStyle={{
								borderRadius: '8px',
								border: '1px solid #e5e7eb',
								fontSize: '12px',
							}}
						/>
					</PieChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}

export function BreakdownDonut({
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
	const sorted = [...snapshots].sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
	const [idx, setIdx] = useState(0);

	const snapshot = sorted[idx];
	const visibleAccounts = filterAccounts(accounts, liquidOnly);

	if (!snapshot) return null;

	if (!showNative) {
		const data = visibleAccounts
			.map((a) => ({
				name: a.label,
				value: Math.max(0, toILS(snapshot.values[a.id] ?? 0, a, snapshot.usdRate)),
				color: a.color,
			}))
			.filter((d) => d.value > 0);
		const total = data.reduce((sum, d) => sum + d.value, 0);

		return (
			<div>
				<MonthNav idx={idx} setIdx={setIdx} total={sorted.length} snapshot={snapshot} />
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
					<div className="mx-auto h-36 w-36 shrink-0 sm:h-48 sm:w-48">
						<ResponsiveContainer width="100%" height="100%">
							<PieChart>
								<Pie
									data={data}
									cx="50%"
									cy="50%"
									innerRadius="55%"
									outerRadius="80%"
									dataKey="value"
									paddingAngle={2}
								>
									{data.map((entry) => (
										<Cell key={entry.name} fill={entry.color} />
									))}
								</Pie>
								<Tooltip
									formatter={(value) => [typeof value === 'number' ? formatILS(value) : value]}
									contentStyle={{
										borderRadius: '8px',
										border: '1px solid #e5e7eb',
										fontSize: '12px',
									}}
								/>
							</PieChart>
						</ResponsiveContainer>
					</div>
					<div className="flex-1 divide-y divide-gray-100 sm:divide-y-0 sm:space-y-2">
						{visibleAccounts.map((a) => {
							const value = toILS(snapshot.values[a.id] ?? 0, a, snapshot.usdRate);
							const pct = total > 0 ? ((Math.max(0, value) / total) * 100).toFixed(1) : '0.0';
							return (
								<LegendRow key={a.id} account={a} value={value} pct={pct} formatter={formatILS} />
							);
						})}
					</div>
				</div>
			</div>
		);
	}

	// Native mode — side-by-side donuts
	const ilsAccounts = visibleAccounts.filter((a) => a.currency !== Currency.USD);
	const usdAccounts = visibleAccounts.filter((a) => a.currency === Currency.USD);

	const ilsData = ilsAccounts
		.map((a) => ({ name: a.label, value: Math.max(0, snapshot.values[a.id] ?? 0), color: a.color }))
		.filter((d) => d.value > 0);
	const usdData = usdAccounts
		.map((a) => ({ name: a.label, value: Math.max(0, snapshot.values[a.id] ?? 0), color: a.color }))
		.filter((d) => d.value > 0);
	const ilsTotal = ilsData.reduce((sum, d) => sum + d.value, 0);
	const usdTotal = usdData.reduce((sum, d) => sum + d.value, 0);

	return (
		<div>
			<MonthNav idx={idx} setIdx={setIdx} total={sorted.length} snapshot={snapshot} />
			<div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
				<div className="flex flex-1 flex-col items-center gap-3">
					<DonutChart data={ilsData} formatter={formatILS} label="ILS accounts" />
					<div className="w-full space-y-1">
						{ilsAccounts.map((a) => {
							const value = snapshot.values[a.id] ?? 0;
							const pct = ilsTotal > 0 ? ((Math.max(0, value) / ilsTotal) * 100).toFixed(1) : '0.0';
							return (
								<LegendRow key={a.id} account={a} value={value} pct={pct} formatter={formatILS} />
							);
						})}
					</div>
				</div>
				{usdAccounts.length > 0 && (
					<div className="flex flex-1 flex-col items-center gap-3">
						<DonutChart data={usdData} formatter={formatUSD} label="USD accounts" />
						<div className="w-full space-y-1">
							{usdAccounts.map((a) => {
								const value = snapshot.values[a.id] ?? 0;
								const pct =
									usdTotal > 0 ? ((Math.max(0, value) / usdTotal) * 100).toFixed(1) : '0.0';
								return (
									<LegendRow key={a.id} account={a} value={value} pct={pct} formatter={formatUSD} />
								);
							})}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function MonthNav({
	idx,
	setIdx,
	total,
	snapshot,
}: {
	idx: number;
	setIdx: (fn: (i: number) => number) => void;
	total: number;
	snapshot: MonthlySnapshot;
}) {
	return (
		<div className="mb-3 flex items-center justify-between">
			<h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Breakdown</h3>
			<div className="flex items-center gap-2 text-sm font-medium text-gray-700">
				<button
					type="button"
					onClick={() => setIdx((i) => Math.min(i + 1, total - 1))}
					disabled={idx >= total - 1}
					className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
					aria-label="Previous month"
				>
					<ChevronLeft className="h-4 w-4" />
				</button>
				{formatYearMonth(snapshot.yearMonth)}
				<button
					type="button"
					onClick={() => setIdx((i) => Math.max(i - 1, 0))}
					disabled={idx <= 0}
					className="rounded p-1 hover:bg-gray-100 disabled:opacity-30"
					aria-label="Next month"
				>
					<ChevronRight className="h-4 w-4" />
				</button>
			</div>
		</div>
	);
}

function LegendRow({
	account,
	value,
	pct,
	formatter,
}: {
	account: AccountConfig;
	value: number;
	pct: string;
	formatter: (v: number) => string;
}) {
	return (
		<div className="py-2 sm:py-0">
			<div className="flex items-center gap-2">
				<span
					className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
					style={{ backgroundColor: account.color }}
				/>
				<span className="text-sm text-gray-700">{account.label}</span>
				<span
					className={`ml-auto hidden text-sm font-medium tabular-nums sm:inline ${value < 0 ? 'text-red-600' : 'text-gray-900'}`}
				>
					{formatter(value)}
				</span>
				<span className="hidden text-xs text-gray-400 sm:inline">{pct}%</span>
			</div>
			<div className="mt-0.5 flex items-center gap-2 pl-5 sm:hidden">
				<span
					className={`text-sm font-medium tabular-nums ${value < 0 ? 'text-red-600' : 'text-gray-900'}`}
				>
					{formatter(value)}
				</span>
				<span className="text-xs text-gray-400">{pct}%</span>
			</div>
		</div>
	);
}
