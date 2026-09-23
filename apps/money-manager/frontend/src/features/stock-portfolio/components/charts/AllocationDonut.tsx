import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { TickerConfig } from '../../../../types/index.js';

interface DonutSlice {
	symbol: string;
	value: number;
}

export function AllocationDonut({
	data,
	tickers,
	label,
}: {
	data: DonutSlice[];
	tickers: TickerConfig[];
	label: string;
}) {
	const colorMap = Object.fromEntries(tickers.map((t) => [t.symbol, t.color]));
	const total = data.reduce((s, d) => s + d.value, 0);

	if (total === 0) {
		return (
			<div className="flex h-32 items-center justify-center text-sm text-gray-400">{label}</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height={140}>
			<PieChart>
				<Pie
					data={data}
					dataKey="value"
					nameKey="symbol"
					cx="50%"
					cy="50%"
					innerRadius={38}
					outerRadius={60}
					paddingAngle={2}
					isAnimationActive={false}
				>
					{data.map((entry) => (
						<Cell key={entry.symbol} fill={colorMap[entry.symbol] ?? '#94a3b8'} />
					))}
				</Pie>
				<Tooltip
					formatter={(v) => [
						typeof v === 'number' ? `${((v / total) * 100).toFixed(1)}%` : `${v}`,
						'Actual',
					]}
					contentStyle={{ fontSize: 11 }}
				/>
			</PieChart>
		</ResponsiveContainer>
	);
}
