import type { AccountConfig } from '../../../types/index.js';

export function filterAccounts(accounts: AccountConfig[], liquidOnly: boolean): AccountConfig[] {
	if (!liquidOnly) return accounts;
	return accounts.filter((a) => a.liquid);
}
