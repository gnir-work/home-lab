import { readFileSync, writeFileSync } from 'node:fs';
import type { PortfolioSnapshot, PortfolioStore } from '../types.js';

export function readPortfolioStore(path: string): PortfolioStore {
	try {
		const raw = readFileSync(path, 'utf-8');
		return JSON.parse(raw) as PortfolioStore;
	} catch {
		return { snapshots: [] };
	}
}

export function writePortfolioStore(path: string, store: PortfolioStore): void {
	writeFileSync(path, JSON.stringify(store, null, 2), 'utf-8');
}

export function getAllPortfolioSnapshots(path: string): PortfolioSnapshot[] {
	const store = readPortfolioStore(path);
	return [...store.snapshots].sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
}

export function getPortfolioSnapshotByYearMonth(
	path: string,
	yearMonth: string,
): PortfolioSnapshot | undefined {
	return readPortfolioStore(path).snapshots.find((s) => s.yearMonth === yearMonth);
}

export function insertPortfolioSnapshot(path: string, snapshot: PortfolioSnapshot): void {
	const store = readPortfolioStore(path);
	store.snapshots.push(snapshot);
	writePortfolioStore(path, store);
}

export function updatePortfolioSnapshot(path: string, snapshot: PortfolioSnapshot): boolean {
	const store = readPortfolioStore(path);
	const idx = store.snapshots.findIndex((s) => s.yearMonth === snapshot.yearMonth);
	if (idx === -1) return false;
	store.snapshots[idx] = snapshot;
	writePortfolioStore(path, store);
	return true;
}

export function removePortfolioSnapshot(path: string, yearMonth: string): boolean {
	const store = readPortfolioStore(path);
	const before = store.snapshots.length;
	store.snapshots = store.snapshots.filter((s) => s.yearMonth !== yearMonth);
	if (store.snapshots.length === before) return false;
	writePortfolioStore(path, store);
	return true;
}
