import type { AccountConfig, FeeSnapshot, MonthlySnapshot } from '../../../types/index.js';

export interface FeeImpact {
	accountId: string;
	currentBalance: number;
	depositCostAnnual: number;
	managementCostAnnual: number;
	totalCostAnnual: number;
}

export function computeAllFeeImpacts(
	latestFeeSnapshot: FeeSnapshot | null,
	latestMonthlySnapshot: MonthlySnapshot | null,
	accounts: AccountConfig[],
): FeeImpact[] {
	return accounts.map((account) => {
		const entry = latestFeeSnapshot?.entries[account.id];
		const balance = latestMonthlySnapshot?.values[account.id] ?? 0;

		if (!entry) {
			return {
				accountId: account.id,
				currentBalance: balance,
				depositCostAnnual: 0,
				managementCostAnnual: 0,
				totalCostAnnual: 0,
			};
		}

		const depositCostAnnual = ((entry.monthlyDeposit * entry.depositFeePct) / 100) * 12;
		const managementCostAnnual = (balance * entry.managementFeePct) / 100;
		return {
			accountId: account.id,
			currentBalance: balance,
			depositCostAnnual,
			managementCostAnnual,
			totalCostAnnual: depositCostAnnual + managementCostAnnual,
		};
	});
}
