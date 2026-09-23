import { Plus } from 'lucide-react';
import { useState } from 'react';
import { FEE_ACCOUNTS } from '../../config/feeAccounts.js';
import { useFees } from '../../hooks/useFees.js';
import { useSnapshots } from '../../hooks/useSnapshots.js';
import type { FeeSnapshot } from '../../types/index.js';
import { CurrentRatesTable } from './components/CurrentRatesTable.js';
import { FeeHistoryTable } from './components/FeeHistoryTable.js';
import { FeeSnapshotModal } from './components/FeeSnapshotModal.js';
import { ImpactSummary } from './components/ImpactSummary.js';
import { computeAllFeeImpacts } from './utils/computeFeeImpact.js';

export function AccountFeesPage() {
	const { feeSnapshots, loading: feesLoading, error: feesError, add, update, remove } = useFees();
	const { snapshots: netWorthSnapshots } = useSnapshots();
	const [modalOpen, setModalOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<FeeSnapshot | null>(null);

	const latestFeeSnapshot = feeSnapshots[0] ?? null;
	const latestNetWorthSnapshot = netWorthSnapshots[0] ?? null;
	const impacts = computeAllFeeImpacts(latestFeeSnapshot, latestNetWorthSnapshot, FEE_ACCOUNTS);
	const hasBalanceData = latestNetWorthSnapshot !== null;

	function openNew() {
		setEditTarget(null);
		setModalOpen(true);
	}

	function openEdit(snapshot: FeeSnapshot) {
		setEditTarget(snapshot);
		setModalOpen(true);
	}

	async function handleSave(date: string, entries: Parameters<typeof add>[1]) {
		if (editTarget) {
			await update(date, entries);
		} else {
			await add(date, entries);
		}
		setModalOpen(false);
	}

	if (feesLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-gray-500">Loading…</p>
			</div>
		);
	}

	if (feesError) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-red-500">{feesError}</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold text-gray-900">Account Fees</h1>
					<button
						type="button"
						onClick={openNew}
						className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<Plus className="h-4 w-4" />
						New Fee Snapshot
					</button>
				</div>

				<CurrentRatesTable latestSnapshot={latestFeeSnapshot} accounts={FEE_ACCOUNTS} />

				{latestFeeSnapshot && (
					<ImpactSummary
						impacts={impacts}
						accounts={FEE_ACCOUNTS}
						hasBalanceData={hasBalanceData}
					/>
				)}

				<FeeHistoryTable
					snapshots={feeSnapshots}
					accounts={FEE_ACCOUNTS}
					onEdit={openEdit}
					onDelete={remove}
				/>
			</div>

			<FeeSnapshotModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				snapshot={editTarget}
				accounts={FEE_ACCOUNTS}
				onSave={handleSave}
			/>
		</div>
	);
}
