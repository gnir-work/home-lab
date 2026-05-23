import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { formatILS, formatUSD, formatYearMonth } from '../../../../lib/utils.js';
import { Currency } from '../../../../types/index.js';
import type { AccountConfig, MonthlySnapshot } from '../../../../types/index.js';
import { filterAccounts } from '../../utils/filterAccounts.js';

function toILS(val: number, account: AccountConfig, rate: number | undefined): number {
	if (account.currency !== Currency.USD) return val;
	return rate !== undefined ? val * rate : 0;
}

export function NetWorthLineChart({
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
	const visibleAccounts = filterAccounts(accounts, liquidOnly);
	const ilsAccounts = visibleAccounts.filter((a) => a.currency !== Currency.USD);
	const usdAccounts = visibleAccounts.filter((a) => a.currency === Currency.USD);

	const sorted = [...snapshots].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));

	const data = sorted.map((s) => ({
		label: formatYearMonth(s.yearMonth),
		totalILS: showNative
			? ilsAccounts.reduce((sum, a) => sum + (s.values[a.id] ?? 0), 0)
			: visibleAccounts.reduce((sum, a) => sum + toILS(s.values[a.id] ?? 0, a, s.usdRate), 0),
		totalUSD: usdAccounts.reduce((sum, a) => sum + (s.values[a.id] ?? 0), 0),
	}));

	if (!showNative) {
		return (
			<div>
				<h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
					Net Worth Over Time
				</h3>
				<ResponsiveContainer width="100%" height={240}>
					<LineChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
						<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
						<XAxis
							dataKey="label"
							tick={{ fontSize: 11, fill: '#9ca3af' }}
							tickLine={false}
							axisLine={false}
						/>
						<YAxis
							tickFormatter={(v: number) => `₪${(v / 1000).toFixed(0)}k`}
							tick={{ fontSize: 11, fill: '#9ca3af' }}
							tickLine={false}
							axisLine={false}
							width={52}
						/>
						<Tooltip
							formatter={(value) => [
								typeof value === 'number' ? formatILS(value) : value,
								'Net Worth',
							]}
							labelFormatter={(label) => String(label)}
							contentStyle={{
								borderRadius: '8px',
								border: '1px solid #e5e7eb',
								fontSize: '12px',
							}}
						/>
						<Line
							type="monotone"
							dataKey="totalILS"
							stroke="#3b82f6"
							strokeWidth={2}
							dot={{ r: 3, fill: '#3b82f6' }}
							activeDot={{ r: 5 }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		);
	}

	// Native mode — dual Y-axes
	return (
		<div>
			<h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
				Net Worth Over Time
			</h3>
			<div className="mb-2 flex gap-4 text-xs">
				<span className="flex items-center gap-1">
					<span className="inline-block h-2 w-4 rounded bg-blue-500" />
					ILS accounts (₪)
				</span>
				<span className="flex items-center gap-1">
					<span className="inline-block h-2 w-4 rounded bg-red-500" />
					USD accounts ($)
				</span>
			</div>
			<ResponsiveContainer width="100%" height={240}>
				<LineChart data={data} margin={{ top: 4, right: 60, bottom: 0, left: 0 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
					<XAxis
						dataKey="label"
						tick={{ fontSize: 11, fill: '#9ca3af' }}
						tickLine={false}
						axisLine={false}
					/>
					<YAxis
						yAxisId="ils"
						orientation="left"
						tickFormatter={(v: number) => `₪${(v / 1000).toFixed(0)}k`}
						tick={{ fontSize: 11, fill: '#9ca3af' }}
						tickLine={false}
						axisLine={false}
						width={52}
					/>
					<YAxis
						yAxisId="usd"
						orientation="right"
						tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
						tick={{ fontSize: 11, fill: '#9ca3af' }}
						tickLine={false}
						axisLine={false}
						width={52}
					/>
					<Tooltip
						formatter={(value, name) => [
							typeof value === 'number'
								? name === 'totalUSD'
									? formatUSD(value)
									: formatILS(value)
								: value,
							name === 'totalUSD' ? 'USD accounts' : 'ILS accounts',
						]}
						labelFormatter={(label) => String(label)}
						contentStyle={{
							borderRadius: '8px',
							border: '1px solid #e5e7eb',
							fontSize: '12px',
						}}
					/>
					<Line
						yAxisId="ils"
						type="monotone"
						dataKey="totalILS"
						stroke="#3b82f6"
						strokeWidth={2}
						dot={{ r: 3, fill: '#3b82f6' }}
						activeDot={{ r: 5 }}
					/>
					<Line
						yAxisId="usd"
						type="monotone"
						dataKey="totalUSD"
						stroke="#ef4444"
						strokeWidth={2}
						dot={{ r: 3, fill: '#ef4444' }}
						activeDot={{ r: 5 }}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
