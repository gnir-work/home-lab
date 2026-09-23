import type { PortfolioPosition, PortfolioSnapshot, PortfolioTargets } from '../types/index.js';

const BASE = `${import.meta.env.BASE_URL}api/portfolio`;

export async function fetchAllPortfolioSnapshots(): Promise<PortfolioSnapshot[]> {
	const res = await fetch(BASE);
	if (!res.ok) throw new Error('Failed to fetch portfolio snapshots');
	return res.json() as Promise<PortfolioSnapshot[]>;
}

export async function createPortfolioSnapshot(
	yearMonth: string,
	positions: Record<string, PortfolioPosition>,
	usdRate?: number,
): Promise<PortfolioSnapshot> {
	const res = await fetch(BASE, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ yearMonth, positions, usdRate }),
	});
	if (res.status === 409) throw new Error('CONFLICT');
	if (!res.ok) throw new Error('Failed to create portfolio snapshot');
	return res.json() as Promise<PortfolioSnapshot>;
}

export async function updatePortfolioSnapshot(
	yearMonth: string,
	positions: Record<string, PortfolioPosition>,
	usdRate?: number,
): Promise<PortfolioSnapshot> {
	const res = await fetch(`${BASE}/${yearMonth}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ positions, usdRate }),
	});
	if (!res.ok) throw new Error('Failed to update portfolio snapshot');
	return res.json() as Promise<PortfolioSnapshot>;
}

export async function deletePortfolioSnapshot(yearMonth: string): Promise<void> {
	const res = await fetch(`${BASE}/${yearMonth}`, { method: 'DELETE' });
	if (!res.ok) throw new Error('Failed to delete portfolio snapshot');
}

export async function fetchPortfolioTargets(): Promise<PortfolioTargets> {
	const res = await fetch(`${BASE}/targets`);
	if (!res.ok) throw new Error('Failed to fetch portfolio targets');
	return res.json() as Promise<PortfolioTargets>;
}

export async function savePortfolioTargets(
	ils: Record<string, number>,
	usd: Record<string, number>,
): Promise<PortfolioTargets> {
	const res = await fetch(`${BASE}/targets`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ils, usd }),
	});
	if (!res.ok) throw new Error('Failed to save portfolio targets');
	return res.json() as Promise<PortfolioTargets>;
}
