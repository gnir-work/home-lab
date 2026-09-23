import { Currency } from '../types/index.js';
import type { AccountConfig } from '../types/index.js';

export const ACCOUNTS: AccountConfig[] = [
	{ id: 'bank', label: 'Bank', liquid: true, currency: Currency.ILS, color: '#3b82f6', order: 1 },
	{
		id: 'pension_general',
		label: 'General Pension (Harel)',
		liquid: false,
		currency: Currency.ILS,
		color: '#8b5cf6',
		order: 2,
	},
	{
		id: 'pension_additional',
		label: 'Additional Pension (Harel)',
		liquid: false,
		currency: Currency.ILS,
		color: '#a78bfa',
		order: 3,
	},
	{
		id: 'keren_hishtalmut',
		label: 'Keren Hishtalmut',
		liquid: false,
		currency: Currency.ILS,
		color: '#f59e0b',
		order: 4,
	},
	{
		id: 'altshuler_shaham',
		label: 'Altshuler Shaham Investment',
		liquid: true,
		currency: Currency.ILS,
		color: '#10b981',
		order: 5,
	},
	{
		id: 'apartment_deposit',
		label: 'Apartment Security Deposit',
		liquid: false,
		currency: Currency.ILS,
		color: '#f97316',
		order: 6,
	},
	{
		id: 'ibi_ils',
		label: 'IBI Stock Market (ILS)',
		liquid: true,
		currency: Currency.ILS,
		color: '#ef4444',
		order: 7,
	},
	{
		id: 'ibi_usd',
		label: 'IBI Stock Market (USD)',
		liquid: true,
		currency: Currency.USD,
		color: '#dc2626',
		order: 8,
	},
];
