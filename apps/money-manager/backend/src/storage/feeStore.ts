import { readFileSync, writeFileSync } from 'node:fs';
import type { FeeSnapshot, FeeStore } from '../types.js';

export function readFeeStore(path: string): FeeStore {
	try {
		const raw = readFileSync(path, 'utf-8');
		return JSON.parse(raw) as FeeStore;
	} catch {
		return { snapshots: [] };
	}
}

export function writeFeeStore(path: string, store: FeeStore): void {
	writeFileSync(path, JSON.stringify(store, null, 2), 'utf-8');
}

export function getAllFees(path: string): FeeSnapshot[] {
	const store = readFeeStore(path);
	return [...store.snapshots].sort((a, b) => b.date.localeCompare(a.date));
}

export function getFeeByDate(path: string, date: string): FeeSnapshot | undefined {
	return readFeeStore(path).snapshots.find((s) => s.date === date);
}

export function insertFee(path: string, snapshot: FeeSnapshot): void {
	const store = readFeeStore(path);
	store.snapshots.push(snapshot);
	writeFeeStore(path, store);
}

export function updateFee(path: string, snapshot: FeeSnapshot): boolean {
	const store = readFeeStore(path);
	const idx = store.snapshots.findIndex((s) => s.date === snapshot.date);
	if (idx === -1) return false;
	store.snapshots[idx] = snapshot;
	writeFeeStore(path, store);
	return true;
}

export function removeFee(path: string, date: string): boolean {
	const store = readFeeStore(path);
	const before = store.snapshots.length;
	store.snapshots = store.snapshots.filter((s) => s.date !== date);
	if (store.snapshots.length === before) return false;
	writeFeeStore(path, store);
	return true;
}
