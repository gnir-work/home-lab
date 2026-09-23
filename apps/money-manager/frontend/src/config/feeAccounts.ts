import { ACCOUNTS } from './accounts.js';

const FEE_ACCOUNT_IDS = new Set([
	'pension_general',
	'pension_additional',
	'keren_hishtalmut',
	'altshuler_shaham',
]);

export const FEE_ACCOUNTS = ACCOUNTS.filter((a) => FEE_ACCOUNT_IDS.has(a.id));
