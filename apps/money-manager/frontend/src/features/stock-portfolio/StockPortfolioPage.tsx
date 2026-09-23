import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs.js';
import { TICKERS } from '../../config/tickers.js';
import { usePortfolio } from '../../hooks/usePortfolio.js';
import { usePortfolioTargets } from '../../hooks/usePortfolioTargets.js';
import { useSnapshots } from '../../hooks/useSnapshots.js';
import type { PortfolioSnapshot } from '../../types/index.js';
import { AllocationTab } from './components/AllocationTab.js';
import { CalculatorTab } from './components/CalculatorTab.js';
import { HistoryTab } from './components/HistoryTab.js';
import { HoldingsTab } from './components/HoldingsTab.js';
import { PortfolioSnapshotModal } from './components/PortfolioSnapshotModal.js';
import { PortfolioSummaryCards } from './components/SummaryCards.js';
import { computeBucketTotals } from './utils/computeBucketTotals.js';
import { computeGrowth } from './utils/computeGrowth.js';

export function StockPortfolioPage() {
	const { snapshots, loading, error, add, update, remove } = usePortfolio();
	const { targets, save: saveTargets } = usePortfolioTargets();
	const { snapshots: netWorthSnapshots } = useSnapshots();

	const [modalOpen, setModalOpen] = useState(false);
	const [editTarget, setEditTarget] = useState<PortfolioSnapshot | null>(null);

	const latestSnapshot = snapshots[0] ?? null;
	const latestNetWorthSnapshot = netWorthSnapshots[0] ?? null;

	const { ilsTotal, usdTotal } = computeBucketTotals(latestSnapshot, TICKERS);
	const usdRate = latestSnapshot?.usdRate ?? 3.7;

	const ilsGrowth = computeGrowth(snapshots, TICKERS, 'ibi_ils');
	const usdGrowth = computeGrowth(snapshots, TICKERS, 'ibi_usd');

	const safeTargets = targets ?? { ils: {}, usd: {}, updatedAt: '' };

	function openNew() {
		setEditTarget(null);
		setModalOpen(true);
	}

	function openEdit(snapshot: PortfolioSnapshot) {
		setEditTarget(snapshot);
		setModalOpen(true);
	}

	async function handleSave(
		yearMonth: string,
		positions: Parameters<typeof add>[1],
		usdRateVal?: number,
	) {
		if (editTarget) {
			await update(yearMonth, positions, usdRateVal);
		} else {
			await add(yearMonth, positions, usdRateVal);
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

	const hasSnapshots = snapshots.length > 0;

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
				{/* Header */}
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold text-gray-900">Stock Portfolio</h1>
					<button
						type="button"
						onClick={openNew}
						className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<Plus className="h-4 w-4" />
						New Holdings Snapshot
					</button>
				</div>

				{/* Summary cards */}
				{hasSnapshots ? (
					<PortfolioSummaryCards
						ilsTotal={ilsTotal}
						usdTotal={usdTotal}
						usdRate={usdRate}
						ilsGrowth={ilsGrowth}
						usdGrowth={usdGrowth}
						lastYearMonth={latestSnapshot?.yearMonth ?? null}
					/>
				) : (
					<div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-500">
						<p className="text-lg font-medium">No holdings yet</p>
						<p className="mt-1 text-sm">
							Click "+ New Holdings Snapshot" to record your first portfolio entry.
						</p>
						<p className="mt-2 text-sm">
							You can set target allocations on the Allocation tab below while waiting.
						</p>
					</div>
				)}

				{/* Tabs */}
				<Tabs defaultValue="holdings">
					<TabsList>
						<TabsTrigger value="holdings">Holdings</TabsTrigger>
						<TabsTrigger value="allocation">Allocation</TabsTrigger>
						<TabsTrigger value="calculator">Calculator</TabsTrigger>
						<TabsTrigger value="history">History</TabsTrigger>
					</TabsList>

					<TabsContent value="holdings">
						<HoldingsTab
							snapshots={snapshots}
							ilsGrowth={ilsGrowth}
							usdGrowth={usdGrowth}
							netWorthSnapshot={latestNetWorthSnapshot}
						/>
					</TabsContent>

					<TabsContent value="allocation">
						<AllocationTab
							snapshot={latestSnapshot}
							targets={safeTargets}
							onSaveTargets={saveTargets}
						/>
					</TabsContent>

					<TabsContent value="calculator">
						<CalculatorTab snapshot={latestSnapshot} targets={safeTargets} />
					</TabsContent>

					<TabsContent value="history">
						<HistoryTab snapshots={snapshots} onEdit={openEdit} onDelete={remove} />
					</TabsContent>
				</Tabs>
			</div>

			<PortfolioSnapshotModal
				open={modalOpen}
				onOpenChange={setModalOpen}
				snapshot={editTarget}
				onSave={handleSave}
			/>
		</div>
	);
}
