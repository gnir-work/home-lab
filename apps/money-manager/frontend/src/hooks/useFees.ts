import { useCallback, useEffect, useState } from 'react';
import * as api from '../api/fees.js';
import type { FeeEntry, FeeSnapshot } from '../types/index.js';

interface UseFeesReturn {
	feeSnapshots: FeeSnapshot[];
	loading: boolean;
	error: string | null;
	add: (date: string, entries: Record<string, FeeEntry>) => Promise<void>;
	update: (date: string, entries: Record<string, FeeEntry>) => Promise<void>;
	remove: (date: string) => Promise<void>;
	refresh: () => Promise<void>;
}

export function useFees(): UseFeesReturn {
	const [feeSnapshots, setFeeSnapshots] = useState<FeeSnapshot[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await api.fetchAllFees();
			setFeeSnapshots(data);
		} catch {
			setError('Failed to load fee snapshots');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const add = useCallback(
		async (date: string, entries: Record<string, FeeEntry>) => {
			await api.createFeeSnapshot(date, entries);
			await refresh();
		},
		[refresh],
	);

	const update = useCallback(
		async (date: string, entries: Record<string, FeeEntry>) => {
			await api.updateFeeSnapshot(date, entries);
			await refresh();
		},
		[refresh],
	);

	const remove = useCallback(
		async (date: string) => {
			await api.deleteFeeSnapshot(date);
			await refresh();
		},
		[refresh],
	);

	return { feeSnapshots, loading, error, add, update, remove, refresh };
}
