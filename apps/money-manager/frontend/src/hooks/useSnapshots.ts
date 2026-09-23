import { useCallback, useEffect, useState } from 'react';
import * as api from '../api/snapshots.js';
import type { MonthlySnapshot } from '../types/index.js';

interface UseSnapshotsReturn {
	snapshots: MonthlySnapshot[];
	loading: boolean;
	error: string | null;
	add: (yearMonth: string, values: Record<string, number>, usdRate?: number) => Promise<void>;
	update: (yearMonth: string, values: Record<string, number>, usdRate?: number) => Promise<void>;
	remove: (yearMonth: string) => Promise<void>;
	refresh: () => Promise<void>;
}

export function useSnapshots(): UseSnapshotsReturn {
	const [snapshots, setSnapshots] = useState<MonthlySnapshot[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await api.fetchAll();
			setSnapshots(data);
		} catch {
			setError('Failed to load snapshots');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const add = useCallback(
		async (yearMonth: string, values: Record<string, number>, usdRate?: number) => {
			await api.createSnapshot(yearMonth, values, usdRate);
			await refresh();
		},
		[refresh],
	);

	const update = useCallback(
		async (yearMonth: string, values: Record<string, number>, usdRate?: number) => {
			await api.updateSnapshot(yearMonth, values, usdRate);
			await refresh();
		},
		[refresh],
	);

	const remove = useCallback(
		async (yearMonth: string) => {
			await api.deleteSnapshot(yearMonth);
			await refresh();
		},
		[refresh],
	);

	return { snapshots, loading, error, add, update, remove, refresh };
}
