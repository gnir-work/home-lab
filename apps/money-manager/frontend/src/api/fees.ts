import type { FeeEntry, FeeSnapshot } from '../types/index.js';

const BASE = '/api/fees';

export async function fetchAllFees(): Promise<FeeSnapshot[]> {
	const res = await fetch(BASE);
	if (!res.ok) throw new Error('Failed to fetch fee snapshots');
	return res.json() as Promise<FeeSnapshot[]>;
}

export async function createFeeSnapshot(
	date: string,
	entries: Record<string, FeeEntry>,
): Promise<FeeSnapshot> {
	const res = await fetch(BASE, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ date, entries }),
	});
	if (res.status === 409) throw new Error('CONFLICT');
	if (!res.ok) throw new Error('Failed to create fee snapshot');
	return res.json() as Promise<FeeSnapshot>;
}

export async function updateFeeSnapshot(
	date: string,
	entries: Record<string, FeeEntry>,
): Promise<FeeSnapshot> {
	const res = await fetch(`${BASE}/${date}`, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ entries }),
	});
	if (!res.ok) throw new Error('Failed to update fee snapshot');
	return res.json() as Promise<FeeSnapshot>;
}

export async function deleteFeeSnapshot(date: string): Promise<void> {
	const res = await fetch(`${BASE}/${date}`, { method: 'DELETE' });
	if (!res.ok) throw new Error('Failed to delete fee snapshot');
}
