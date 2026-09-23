import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog.js';
import { cn, currentYearMonth, formatCurrency, formatYearMonth } from '../../../lib/utils.js';
import { Currency } from '../../../types/index.js';
import type { AccountConfig, MonthlySnapshot } from '../../../types/index.js';

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	snapshot: MonthlySnapshot | null; // null = new snapshot
	accounts: AccountConfig[];
	previousSnapshot: MonthlySnapshot | null;
	onSave: (yearMonth: string, values: Record<string, number>, usdRate?: number) => Promise<void>;
}

async function fetchLiveUsdRate(): Promise<number | null> {
	try {
		const res = await fetch('https://api.frankfurter.dev/v1/latest?from=USD&to=ILS');
		if (!res.ok) return null;
		const data = (await res.json()) as { rates?: { ILS?: number } };
		return data.rates?.ILS ?? null;
	} catch {
		return null;
	}
}

export function SnapshotModal({
	open,
	onOpenChange,
	snapshot,
	accounts,
	previousSnapshot,
	onSave,
}: Props) {
	const [yearMonth, setYearMonth] = useState(currentYearMonth());
	const [values, setValues] = useState<Record<string, string>>({});
	const [usdRate, setUsdRate] = useState('');
	const [saving, setSaving] = useState(false);
	const [conflictError, setConflictError] = useState(false);
	const [rateError, setRateError] = useState(false);

	// Reset form when modal opens
	useEffect(() => {
		if (!open) return;
		setConflictError(false);
		setRateError(false);
		if (snapshot) {
			setYearMonth(snapshot.yearMonth);
			const init: Record<string, string> = {};
			for (const a of accounts) {
				init[a.id] = snapshot.values[a.id]?.toString() ?? '';
			}
			setValues(init);
			setUsdRate(snapshot.usdRate?.toString() ?? '');
		} else {
			setYearMonth(currentYearMonth());
			setValues({});
			setUsdRate(previousSnapshot?.usdRate?.toString() ?? '');
		}
	}, [open, snapshot, accounts, previousSnapshot]);

	// Fetch live rate once when opening a new snapshot, overrides the fallback above
	useEffect(() => {
		if (!open || snapshot) return;
		let cancelled = false;
		void fetchLiveUsdRate().then((rate) => {
			if (!cancelled && rate !== null) setUsdRate(rate.toFixed(2));
		});
		return () => {
			cancelled = true;
		};
	}, [open, snapshot]);

	const hasAnyValue = Object.values(values).some((v) => v.trim() !== '');
	const hasUsdValue = accounts.some(
		(a) => a.currency === Currency.USD && (values[a.id] ?? '').trim() !== '',
	);

	const title = snapshot
		? `Edit Snapshot — ${formatYearMonth(snapshot.yearMonth)}`
		: `New Snapshot — ${formatYearMonth(yearMonth)}`;

	async function handleSave() {
		if (hasUsdValue && !usdRate.trim()) {
			setRateError(true);
			return;
		}

		const numericValues: Record<string, number> = {};
		for (const a of accounts) {
			const raw = values[a.id]?.trim();
			if (raw && raw !== '') {
				numericValues[a.id] = Number(raw);
			}
		}

		const numericRate = hasUsdValue ? Number(usdRate) : undefined;

		setSaving(true);
		setConflictError(false);
		setRateError(false);
		try {
			await onSave(yearMonth, numericValues, numericRate);
		} catch (e) {
			if (e instanceof Error && e.message === 'CONFLICT') {
				setConflictError(true);
			}
		} finally {
			setSaving(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>

				{/* Month picker — only shown for new snapshots */}
				{!snapshot && (
					<div className="mb-4">
						<label
							htmlFor="snapshot-month"
							className="mb-1 block text-sm font-medium text-gray-700"
						>
							Month
						</label>
						<input
							id="snapshot-month"
							type="month"
							value={yearMonth}
							onChange={(e) => {
								setYearMonth(e.target.value);
								setConflictError(false);
							}}
							className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				)}

				{conflictError && (
					<p className="mb-3 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
						A snapshot for this month already exists. Please choose a different month or edit the
						existing one.
					</p>
				)}

				{/* USD/ILS rate — shown whenever there are USD accounts */}
				{accounts.some((a) => a.currency === Currency.USD) && (
					<div className="mb-4">
						<label htmlFor="usd-rate" className="mb-1 block text-sm font-medium text-gray-700">
							USD / ILS Rate
						</label>
						<div className="relative w-40">
							<input
								id="usd-rate"
								type="number"
								step="0.01"
								min="0"
								value={usdRate}
								onChange={(e) => {
									setUsdRate(e.target.value);
									setRateError(false);
								}}
								placeholder="e.g. 3.65"
								className={cn(
									'w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
									rateError ? 'border-red-400' : 'border-gray-300',
								)}
							/>
						</div>
						{rateError && (
							<p className="mt-1 text-xs text-red-600">Enter the USD/ILS rate to save</p>
						)}
						<p className="mt-1 text-xs text-gray-400">
							Auto-filled from live rate — adjust if needed
						</p>
					</div>
				)}

				{/* Account fields */}
				<div className="space-y-3">
					{accounts.map((account) => {
						const prev = previousSnapshot?.values[account.id];
						const currency = account.currency;
						const placeholder =
							prev !== undefined ? formatCurrency(prev, currency) : 'Enter amount';
						const prefix = currency === Currency.USD ? '$' : '₪';
						return (
							<div key={account.id} className="flex items-center gap-3">
								<div
									className="h-3 w-3 shrink-0 rounded-full"
									style={{ backgroundColor: account.color }}
								/>
								<label
									htmlFor={`account-${account.id}`}
									className="w-40 shrink-0 text-sm font-medium text-gray-700"
								>
									{account.label}
								</label>
								<div className="relative flex-1">
									<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
										{prefix}
									</span>
									<input
										id={`account-${account.id}`}
										type="number"
										value={values[account.id] ?? ''}
										onChange={(e) =>
											setValues((prev) => ({ ...prev, [account.id]: e.target.value }))
										}
										placeholder={placeholder}
										className={cn(
											'w-full rounded-md border border-gray-300 py-1.5 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
											values[account.id] && Number(values[account.id]) < 0 ? 'text-red-600' : '',
										)}
									/>
								</div>
							</div>
						);
					})}
				</div>

				{/* Actions */}
				<div className="mt-6 flex justify-end gap-3">
					<button
						type="button"
						onClick={() => onOpenChange(false)}
						className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleSave}
						disabled={!hasAnyValue || saving}
						className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{saving ? 'Saving…' : 'Save Snapshot'}
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
