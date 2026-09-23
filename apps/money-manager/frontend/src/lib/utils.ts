import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatILS(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'ILS',
		maximumFractionDigits: 0,
	}).format(value);
}

export function formatUSD(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0,
	}).format(value);
}

export function formatCurrency(value: number, currency: string): string {
	return currency === 'USD' ? formatUSD(value) : formatILS(value);
}

export function formatYearMonth(yearMonth: string): string {
	const [year, month] = yearMonth.split('-');
	return new Date(Number(year), Number(month) - 1).toLocaleDateString('en-US', {
		month: 'long',
		year: 'numeric',
	});
}

export function currentYearMonth(): string {
	const now = new Date();
	return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
