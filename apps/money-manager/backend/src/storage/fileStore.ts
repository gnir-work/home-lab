import { readFileSync, writeFileSync } from 'node:fs';
import type { MonthlySnapshot, SnapshotStore } from '../types.js';

const DEFAULT_STORE: SnapshotStore = { snapshots: [] };

export function readStore(path: string): SnapshotStore {
	try {
		const raw = readFileSync(path, 'utf-8');
		return JSON.parse(raw) as SnapshotStore;
	} catch {
		return { ...DEFAULT_STORE };
	}
}

// Write atomically by serializing synchronously — single-user app, no concurrency concern.
export function writeStore(path: string, store: SnapshotStore): void {
	writeFileSync(path, JSON.stringify(store, null, 2), 'utf-8');
}

export function getAll(path: string): MonthlySnapshot[] {
	const store = readStore(path);
	return [...store.snapshots].sort((a, b) => b.yearMonth.localeCompare(a.yearMonth));
}

export function getByYearMonth(path: string, yearMonth: string): MonthlySnapshot | undefined {
	return readStore(path).snapshots.find((s) => s.yearMonth === yearMonth);
}

export function insert(path: string, snapshot: MonthlySnapshot): void {
	const store = readStore(path);
	store.snapshots.push(snapshot);
	writeStore(path, store);
}

export function update(path: string, snapshot: MonthlySnapshot): boolean {
	const store = readStore(path);
	const idx = store.snapshots.findIndex((s) => s.yearMonth === snapshot.yearMonth);
	if (idx === -1) return false;
	store.snapshots[idx] = snapshot;
	writeStore(path, store);
	return true;
}

export function remove(path: string, yearMonth: string): boolean {
	const store = readStore(path);
	const before = store.snapshots.length;
	store.snapshots = store.snapshots.filter((s) => s.yearMonth !== yearMonth);
	if (store.snapshots.length === before) return false;
	writeStore(path, store);
	return true;
}
