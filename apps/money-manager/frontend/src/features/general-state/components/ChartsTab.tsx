import type { AccountConfig, MonthlySnapshot } from '../../../types/index.js';
import { BreakdownDonut } from './charts/BreakdownDonut.js';
import { NetWorthLineChart } from './charts/NetWorthLineChart.js';
import { AccountSparklines } from './charts/Sparkline.js';

export function ChartsTab({
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
	if (snapshots.length === 0) {
		return (
			<p className="py-12 text-center text-sm text-gray-400">
				No snapshots yet. Add one to see charts.
			</p>
		);
	}

	return (
		<div className="space-y-8">
			<NetWorthLineChart
				snapshots={snapshots}
				accounts={accounts}
				liquidOnly={liquidOnly}
				showNative={showNative}
			/>
			<BreakdownDonut
				snapshots={snapshots}
				accounts={accounts}
				liquidOnly={liquidOnly}
				showNative={showNative}
			/>
			<AccountSparklines
				snapshots={snapshots}
				accounts={accounts}
				liquidOnly={liquidOnly}
				showNative={showNative}
			/>
		</div>
	);
}
