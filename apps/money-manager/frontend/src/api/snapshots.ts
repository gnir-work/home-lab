import type { MonthlySnapshot } from '../types/index.js';

const BASE = '/api/snapshots';

export async function fetchAll(): Promise<MonthlySnapshot[]> {
	const res = await fetch(BASE);
	if (!res.ok) throw new Error('Failed to fetch snapshots');
	return res.json() as Promise<MonthlySnapshot[]>;
}

export async function createSnapshot(
	yearMonth: string,
	values: Record<string, number>,
	usdRate?: number,
): Promise<MonthlySnapshot> {
	const res = await fetch(BASE, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ yearMonth, values, ...(usdRate !== undefined ? { usdRate } : {}) }),
	});
	if (res.status === 409) throw new Error('CONFLICT');
	if (!res.ok) throw new Error('Failed to create snapshot');
	return res.json() as Promise<MonthlySnapshot>;
}

export async function updateSnapshot(
	yearMonth: string,
	values: Record<string, number>,
	usdRate?: number,
): Promise<MonthlySnapshot> {
	const res = await fetch(`${BASE}/${yearMonth}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ values, ...(usdRate !== undefined ? { usdRate } : {}) }),
	});
	if (!res.ok) throw new Error('Failed to update snapshot');
	return res.json() as Promise<MonthlySnapshot>;
}

export async function deleteSnapshot(yearMonth: string): Promise<void> {
	const res = await fetch(`${BASE}/${yearMonth}`, { method: 'DELETE' });
	if (!res.ok) throw new Error('Failed to delete snapshot');
}
