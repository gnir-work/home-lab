export enum Currency {
	ILS = 'ILS',
	USD = 'USD',
}

export interface PortfolioPosition {
	symbol: string;
	shares: number;
	price: number;
}

export interface PortfolioSnapshot {
	id: string;
	yearMonth: string;
	positions: Record<string, PortfolioPosition>;
	usdRate?: number;
	createdAt: string;
	updatedAt: string;
}

export interface PortfolioStore {
	snapshots: PortfolioSnapshot[];
}

export interface PortfolioTargets {
	ils: Record<string, number>;
	usd: Record<string, number>;
	updatedAt: string;
}

export interface MonthlySnapshot {
	id: string;
	yearMonth: string; // "2026-05" — unique, lexicographically sortable
	values: Record<string, number>; // keyed by AccountConfig.id
	usdRate?: number; // USD→ILS exchange rate at snapshot time
	createdAt: string;
	updatedAt: string;
}

export interface SnapshotStore {
	snapshots: MonthlySnapshot[];
}

export interface FeeEntry {
	accountId: string;
	depositFeePct: number;
	managementFeePct: number;
	monthlyDeposit: number;
}

export interface FeeSnapshot {
	id: string;
	date: string; // "YYYY-MM" — when these rates took effect
	entries: Record<string, FeeEntry>; // keyed by accountId
	createdAt: string;
	updatedAt: string;
}

export interface FeeStore {
	snapshots: FeeSnapshot[];
}
