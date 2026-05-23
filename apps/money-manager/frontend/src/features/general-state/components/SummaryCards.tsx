import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn, formatILS, formatUSD } from '../../../lib/utils.js';
import type { Summary } from '../utils/computeSummary.js';

function Card({
	title,
	children,
	className,
}: {
	title: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn('rounded-xl border border-gray-200 bg-white p-5 shadow-sm', className)}>
			<p className="text-sm font-medium text-gray-500">{title}</p>
			<div className="mt-1">{children}</div>
		</div>
	);
}

function DeltaRow({
	delta,
	formatter,
}: {
	delta: number | null;
	formatter: (v: number) => string;
}) {
	if (delta === null) return <p className="text-sm text-gray-400">Need 2+ snapshots</p>;
	return (
		<div className="flex items-center gap-1">
			{delta >= 0 ? (
				<TrendingUp className="h-5 w-5 text-green-500" />
			) : (
				<TrendingDown className="h-5 w-5 text-red-500" />
			)}
			<p className={cn('text-xl font-semibold', delta >= 0 ? 'text-green-600' : 'text-red-600')}>
				{delta >= 0 ? '+' : ''}
				{formatter(delta)}
			</p>
		</div>
	);
}

export function SummaryCards({
	summary,
	liquidOnly,
}: {
	summary: Summary;
	liquidOnly: boolean;
}) {
	if (summary.mode === 'ils') {
		const { totalNetWorth, liquidTotal, momDelta, bestAccount } = summary;
		return (
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<Card title={liquidOnly ? 'Total (Liquid View)' : 'Total Net Worth'} className="col-span-1">
					<p className="text-2xl font-bold text-gray-900">{formatILS(totalNetWorth)}</p>
				</Card>

				<Card title="Liquid Assets">
					<p className="text-2xl font-bold text-blue-600">{formatILS(liquidTotal)}</p>
				</Card>

				<Card title="Month-over-Month">
					<DeltaRow delta={momDelta} formatter={formatILS} />
				</Card>

				<Card title="Best This Month">
					{bestAccount === null ? (
						<p className="text-sm text-gray-400">Need 2+ snapshots</p>
					) : (
						<div>
							<p className="text-base font-semibold text-gray-800">{bestAccount.account.label}</p>
							<p className="text-sm text-green-600">+{formatILS(bestAccount.delta)}</p>
						</div>
					)}
				</Card>
			</div>
		);
	}

	// native mode
	const {
		totalNetWorthILS,
		totalNetWorthUSD,
		liquidILS,
		liquidUSD,
		momDeltaILS,
		momDeltaUSD,
		bestILS,
		bestUSD,
	} = summary;

	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<Card title={liquidOnly ? 'Total (Liquid View)' : 'Total Net Worth'} className="col-span-1">
				<p className="text-xl font-bold text-gray-900">{formatILS(totalNetWorthILS)}</p>
				<p className="text-xl font-bold text-gray-600">{formatUSD(totalNetWorthUSD)}</p>
			</Card>

			<Card title="Liquid Assets">
				<p className="text-xl font-bold text-blue-600">{formatILS(liquidILS)}</p>
				<p className="text-xl font-bold text-blue-400">{formatUSD(liquidUSD)}</p>
			</Card>

			<Card title="Month-over-Month">
				<DeltaRow delta={momDeltaILS} formatter={formatILS} />
				<DeltaRow delta={momDeltaUSD} formatter={formatUSD} />
			</Card>

			<Card title="Best This Month">
				{bestILS === null && bestUSD === null ? (
					<p className="text-sm text-gray-400">Need 2+ snapshots</p>
				) : (
					<div className="space-y-1">
						{bestILS && (
							<div>
								<p className="text-sm font-semibold text-gray-800">{bestILS.account.label}</p>
								<p className="text-xs text-green-600">+{formatILS(bestILS.delta)}</p>
							</div>
						)}
						{bestUSD && (
							<div>
								<p className="text-sm font-semibold text-gray-800">{bestUSD.account.label}</p>
								<p className="text-xs text-green-600">+{formatUSD(bestUSD.delta)}</p>
							</div>
						)}
					</div>
				)}
			</Card>
		</div>
	);
}
