import { useCallback, useEffect, useState } from 'react';
import * as api from '../api/portfolio.js';
import type { PortfolioTargets } from '../types/index.js';

interface UsePortfolioTargetsReturn {
	targets: PortfolioTargets | null;
	loading: boolean;
	error: string | null;
	save: (ils: Record<string, number>, usd: Record<string, number>) => Promise<void>;
	refresh: () => Promise<void>;
}

export function usePortfolioTargets(): UsePortfolioTargetsReturn {
	const [targets, setTargets] = useState<PortfolioTargets | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);
			const data = await api.fetchPortfolioTargets();
			setTargets(data);
		} catch {
			setError('Failed to load portfolio targets');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	const save = useCallback(async (ils: Record<string, number>, usd: Record<string, number>) => {
		const updated = await api.savePortfolioTargets(ils, usd);
		setTargets(updated);
	}, []);

	return { targets, loading, error, save, refresh };
}
