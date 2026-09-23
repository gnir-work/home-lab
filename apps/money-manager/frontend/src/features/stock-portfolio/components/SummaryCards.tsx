import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn, formatILS, formatUSD, formatYearMonth } from '../../../lib/utils.js';
import type { BucketGrowth } from '../utils/computeGrowth.js';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
			<p className="text-sm font-medium text-gray-500">{title}</p>
			<div className="mt-1">{children}</div>
		</div>
	);
}

function MomLine({
	absolute,
	pct,
	formatter,
}: {
	absolute: number | null;
	pct: number | null;
	formatter: (v: number) => string;
}) {
	if (absolute === null || pct === null) return null;
	const up = absolute >= 0;
	return (
		<div className={cn('flex items-center gap-1 text-sm', up ? 'text-green-600' : 'text-red-600')}>
			{up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
			<span>
				{up ? '+' : ''}
				{formatter(absolute)} ({up ? '+' : ''}
				{pct.toFixed(1)}%) MoM
			</span>
		</div>
	);
}

export function PortfolioSummaryCards({
	ilsTotal,
	usdTotal,
	usdRate,
	ilsGrowth,
	usdGrowth,
	lastYearMonth,
}: {
	ilsTotal: number;
	usdTotal: number;
	usdRate: number;
	ilsGrowth: BucketGrowth;
	usdGrowth: BucketGrowth;
	lastYearMonth: string | null;
}) {
	const totalILS = ilsTotal + usdTotal * usdRate;

	// Total MoM in ILS: sum both bucket MoM absolutes (converting USD bucket)
	const totalMomAbsolute =
		ilsGrowth.totalMomAbsolute !== null && usdGrowth.totalMomAbsolute !== null
			? ilsGrowth.totalMomAbsolute + usdGrowth.totalMomAbsolute * usdRate
			: null;
	const totalMomPct =
		totalMomAbsolute !== null && totalILS - totalMomAbsolute !== 0
			? (totalMomAbsolute / (totalILS - totalMomAbsolute)) * 100
			: null;

	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<Card title="Total Portfolio Value">
				<p className="text-2xl font-bold text-gray-900">{formatILS(totalILS)}</p>
				<MomLine absolute={totalMomAbsolute} pct={totalMomPct} formatter={formatILS} />
			</Card>

			<Card title="ILS Bucket">
				<p className="text-2xl font-bold text-gray-900">{formatILS(ilsTotal)}</p>
				<MomLine
					absolute={ilsGrowth.totalMomAbsolute}
					pct={ilsGrowth.totalMomPct}
					formatter={formatILS}
				/>
			</Card>

			<Card title="USD Bucket">
				<p className="text-2xl font-bold text-gray-900">{formatUSD(usdTotal)}</p>
				<MomLine
					absolute={usdGrowth.totalMomAbsolute}
					pct={usdGrowth.totalMomPct}
					formatter={formatUSD}
				/>
			</Card>

			<Card title="Last Snapshot">
				<p className="text-lg font-semibold text-gray-700">
					{lastYearMonth ? formatYearMonth(lastYearMonth) : 'No data yet'}
				</p>
			</Card>
		</div>
	);
}
