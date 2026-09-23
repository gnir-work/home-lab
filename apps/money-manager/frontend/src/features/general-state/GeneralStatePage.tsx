import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs.js';
import { ACCOUNTS } from '../../config/accounts.js';
import { useSnapshots } from '../../hooks/useSnapshots.js';
import type { MonthlySnapshot } from '../../types/index.js';
import { ChartsTab } from './components/ChartsTab.js';
import { CurrencyToggle } from './components/CurrencyToggle.js';
import { HistoryTab } from './components/HistoryTab.js';
import { LiquidityToggle } from './components/LiquidityToggle.js';
import { SnapshotModal } from './components/SnapshotModal.js';
import { SummaryCards } from './components/SummaryCards.js';
import { computeSummary } from './utils/computeSummary.js';

export function GeneralStatePage() {
	const { snapshots, loading, error, add, update, remove } = useSnapshots();
	const [liquidOnly, setLiquidOnly] = useState(false);
	const [showNative, setShowNative] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<MonthlySnapshot | null>(null);

	const summary = computeSummary(snapshots, ACCOUNTS, liquidOnly, showNative);

	function openNew() {
		setEditTarget(null);
		setModalOpen(true);
	}

	function openEdit(snapshot: MonthlySnapshot) {
		setEditTarget(snapshot);
		setModalOpen(true);
	}

	async function handleSave(yearMonth: string, values: Record<string, number>, usdRate?: number) {
		if (editTarget) {
			await update(yearMonth, values, usdRate);
		} else {
			await add(yearMonth, values, usdRate);
		}
		setModalOpen(false);
	}

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-gray-500">Loading…</p>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-red-500">{error}</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-6xl px-4 py-8">
				{/* Header */}
				<div className="mb-6 flex items-center justify-between">
					<h1 className="text-2xl font-bold text-gray-900">Net Worth Overview</h1>
					<button
						type="button"
						onClick={openNew}
						className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<Plus className="h-4 w-4" />
						New Snapshot
					</button>
				</div>

				{/* Empty state */}
				{snapshots.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-24 text-center">
						<p className="mb-2 text-lg font-medium text-gray-700">No data yet</p>
						<p className="mb-6 text-sm text-gray-400">Add your first snapshot to get started.</p>
						<button
							type="button"
							onClick={openNew}
							className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
						>
							<Plus className="h-4 w-4" />
							New Snapshot
						</button>
					</div>
				) : (
					<>
						{/* Summary cards */}
						<SummaryCards summary={summary} liquidOnly={liquidOnly} />

						{/* Toggles */}
						<div className="my-4 flex flex-wrap items-center gap-3">
							<LiquidityToggle value={liquidOnly} onChange={setLiquidOnly} />
							<CurrencyToggle value={showNative} onChange={setShowNative} />
						</div>

						{/* Tabs */}
						<Tabs defaultValue="charts">
							<TabsList>
								<TabsTrigger value="charts">Charts</TabsTrigger>
								<TabsTrigger value="history">History</TabsTrigger>
							</TabsList>

							<TabsContent value="charts">
								<ChartsTab
									snapshots={snapshots}
									accounts={ACCOUNTS}
									liquidOnly={liquidOnly}
									showNative={showNative}
								/>
							</TabsContent>

							<TabsContent value="history">
								<HistoryTab
									snapshots={snapshots}
									accounts={ACCOUNTS}
									liquidOnly={liquidOnly}
									showNative={showNative}
									onEdit={openEdit}
									onDelete={remove}
								/>
							</TabsContent>
						</Tabs>
					</>
				)}
			</div>

			<SnapshotModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				snapshot={editTarget}
				accounts={ACCOUNTS}
				previousSnapshot={snapshots[0] ?? null}
				onSave={handleSave}
			/>
		</div>
	);
}
