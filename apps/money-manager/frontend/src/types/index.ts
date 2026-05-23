export enum Currency {
	ILS = 'ILS',
	USD = 'USD',
}

export interface AccountConfig {
	id: string;
	label: string;
	liquid: boolean;
	color: string;
	order: number;
	currency: Currency;
}

export interface TickerConfig {
	symbol: string;
	name: string;
	bucket: 'ibi_ils' | 'ibi_usd';
	currency: Currency;
	color: string;
	order: number;
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

export interface PortfolioTargets {
	ils: Record<string, number>;
	usd: Record<string, number>;
	updatedAt: string;
}

export interface MonthlySnapshot {
	id: string;
	yearMonth: string; // "2026-05"
	values: Record<string, number>; // keyed by AccountConfig.id
	usdRate?: number;
	createdAt: string;
	updatedAt: string;
}

export interface FeeEntry {
	accountId: string;
	depositFeePct: number;
	managementFeePct: number;
	monthlyDeposit: number;
}

export interface FeeSnapshot {
	id: string;
	date: string; // "YYYY-MM"
	entries: Record<string, FeeEntry>; // keyed by accountId
	createdAt: string;
	updatedAt: string;
}
