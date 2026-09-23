import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { PortfolioSnapshot } from '../../../../types/index.js';

export function TickerSparkline({
	symbol,
	snapshots,
}: {
	symbol: string;
	snapshots: PortfolioSnapshot[];
	color: string;
}) {
	// snapshots sorted newest first — reverse to get chronological for chart
	const data = [...snapshots]
		.reverse()
		.map((s) => ({
			month: s.yearMonth,
			price: s.positions[symbol]?.price ?? null,
		}))
		.filter((d) => d.price !== null)
		.slice(-6);

	if (data.length < 2) {
		return <span className="text-xs text-gray-400">No history</span>;
	}

	return (
		<ResponsiveContainer width="100%" height={40}>
			<LineChart data={data}>
				<Line
					type="monotone"
					dataKey="price"
					stroke="#3b82f6"
					strokeWidth={1.5}
					dot={false}
					isAnimationActive={false}
				/>
				<Tooltip
					formatter={(v) => [typeof v === 'number' ? v.toFixed(2) : String(v), 'Price']}
					contentStyle={{ fontSize: 11 }}
				/>
			</LineChart>
		</ResponsiveContainer>
	);
}
