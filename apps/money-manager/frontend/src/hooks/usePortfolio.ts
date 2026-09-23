import { useCallback, useEffect, useState } from 'react';
import * as api from '../api/portfolio.js';
import type { PortfolioPosition, PortfolioSnapshot } from '../types/index.js';

interface UsePortfolioReturn {
	snapshots: PortfolioSnapshot[];
	loading: boolean;
	error: string | null;
	add: (
		yearMonth: string,
		positions: Record<string, PortfolioPosition>,
		usdRate?: number,
	) => Promise<void>;
	update: (
		yearMonth: string,
		positions: Record<string, PortfolioPosition>,
		usdRate?: number,
	) => Promise<void>;
	remove: (yearMonth: string) => Promise<void>;
	refresh: () => Promise<void>;
}

export function usePortfolio(): UsePortfolioReturn {
	const [snapshots, setSnapshots] = useState<PortfolioSnapshot[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await api.fetchAllPortfolioSnapshots();
			setSnapshots(data);
		} catch {
			setError('Failed to load portfolio snapshots');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const add = useCallback(
		async (yearMonth: string, positions: Record<string, PortfolioPosition>, usdRate?: number) => {
			await api.createPortfolioSnapshot(yearMonth, positions, usdRate);
			await refresh();
		},
		[refresh],
	);

	const update = useCallback(
		async (yearMonth: string, positions: Record<string, PortfolioPosition>, usdRate?: number) => {
			await api.updatePortfolioSnapshot(yearMonth, positions, usdRate);
			await refresh();
		},
		[refresh],
	);

	const remove = useCallback(
		async (yearMonth: string) => {
			await api.deletePortfolioSnapshot(yearMonth);
			await refresh();
		},
		[refresh],
	);

	return { snapshots, loading, error, add, update, remove, refresh };
}
