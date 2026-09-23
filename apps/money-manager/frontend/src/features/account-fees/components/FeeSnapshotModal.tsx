import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog.js';
import { cn, currentYearMonth, formatYearMonth } from '../../../lib/utils.js';
import type { AccountConfig, FeeEntry, FeeSnapshot } from '../../../types/index.js';

interface FieldState {
	depositFeePct: string;
	managementFeePct: string;
	monthlyDeposit: string;
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	snapshot: FeeSnapshot | null;
	accounts: AccountConfig[];
	onSave: (date: string, entries: Record<string, FeeEntry>) => Promise<void>;
}

function emptyFields(): FieldState {
	return { depositFeePct: '', managementFeePct: '', monthlyDeposit: '' };
}

export function FeeSnapshotModal({ open, onOpenChange, snapshot, accounts, onSave }: Props) {
	const [date, setDate] = useState(currentYearMonth());
	const [fields, setFields] = useState<Record<string, FieldState>>({});
	const [saving, setSaving] = useState(false);
	const [conflictError, setConflictError] = useState(false);

	useEffect(() => {
		if (!open) return;
		setConflictError(false);
		if (snapshot) {
			setDate(snapshot.date);
			const init: Record<string, FieldState> = {};
			for (const a of accounts) {
				const entry = snapshot.entries[a.id];
				init[a.id] = entry
					? {
							depositFeePct: entry.depositFeePct.toString(),
							managementFeePct: entry.managementFeePct.toString(),
							monthlyDeposit: entry.monthlyDeposit.toString(),
						}
					: emptyFields();
			}
			setFields(init);
		} else {
			setDate(currentYearMonth());
			setFields({});
		}
	}, [open, snapshot, accounts]);

	function setField(accountId: string, key: keyof FieldState, value: string) {
		setFields((prev) => ({
			...prev,
			[accountId]: { ...(prev[accountId] ?? emptyFields()), [key]: value },
		}));
	}

	const hasAnyValue = Object.values(fields).some(
		(f) => f.depositFeePct.trim() || f.managementFeePct.trim() || f.monthlyDeposit.trim(),
	);

	const title = snapshot
		? `Edit Fee Snapshot — ${formatYearMonth(snapshot.date)}`
		: `New Fee Snapshot — ${formatYearMonth(date)}`;

	async function handleSave() {
		const entries: Record<string, FeeEntry> = {};
		for (const a of accounts) {
			const f = fields[a.id];
			if (!f) continue;
			const hasSomething =
				f.depositFeePct.trim() || f.managementFeePct.trim() || f.monthlyDeposit.trim();
			if (!hasSomething) continue;
			entries[a.id] = {
				accountId: a.id,
				depositFeePct: Number(f.depositFeePct) || 0,
				managementFeePct: Number(f.managementFeePct) || 0,
				monthlyDeposit: Number(f.monthlyDeposit) || 0,
			};
		}

		setSaving(true);
		setConflictError(false);
		try {
			await onSave(date, entries);
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

				{!snapshot && (
					<div className="mb-4">
						<label htmlFor="fee-date" className="mb-1 block text-sm font-medium text-gray-700">
							Month
						</label>
						<input
							id="fee-date"
							type="month"
							value={date}
							onChange={(e) => {
								setDate(e.target.value);
								setConflictError(false);
							}}
							className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				)}

				{conflictError && (
					<p className="mb-3 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
						A fee snapshot for this month already exists. Choose a different month or edit the
						existing one.
					</p>
				)}

				<div className="space-y-5">
					{accounts.map((account) => {
						const f = fields[account.id] ?? emptyFields();
						return (
							<div key={account.id} className="rounded-lg border border-gray-200 p-4">
								<div className="mb-3 flex items-center gap-2">
									<span
										className="inline-block h-3 w-3 shrink-0 rounded-full"
										style={{ backgroundColor: account.color }}
									/>
									<span className="font-medium text-gray-800">{account.label}</span>
								</div>
								<div className="grid grid-cols-3 gap-3">
									<div>
										<label
											htmlFor={`${account.id}-dep`}
											className="mb-1 block text-xs text-gray-500"
										>
											Deposit Fee %
										</label>
										<div className="relative">
											<input
												id={`${account.id}-dep`}
												type="number"
												step="0.01"
												min="0"
												value={f.depositFeePct}
												onChange={(e) => setField(account.id, 'depositFeePct', e.target.value)}
												placeholder="0.50"
												className={cn(
													'w-full rounded-md border border-gray-300 py-1.5 pl-3 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500',
												)}
											/>
											<span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
												%
											</span>
										</div>
									</div>
									<div>
										<label
											htmlFor={`${account.id}-mgmt`}
											className="mb-1 block text-xs text-gray-500"
										>
											Management Fee %
										</label>
										<div className="relative">
											<input
												id={`${account.id}-mgmt`}
												type="number"
												step="0.01"
												min="0"
												value={f.managementFeePct}
												onChange={(e) => setField(account.id, 'managementFeePct', e.target.value)}
												placeholder="1.20"
												className="w-full rounded-md border border-gray-300 py-1.5 pl-3 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
											<span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
												%
											</span>
										</div>
									</div>
									<div>
										<label
											htmlFor={`${account.id}-deposit`}
											className="mb-1 block text-xs text-gray-500"
										>
											Monthly Deposit
										</label>
										<div className="relative">
											<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
												₪
											</span>
											<input
												id={`${account.id}-deposit`}
												type="number"
												min="0"
												value={f.monthlyDeposit}
												onChange={(e) => setField(account.id, 'monthlyDeposit', e.target.value)}
												placeholder="2000"
												className="w-full rounded-md border border-gray-300 py-1.5 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>

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
						{saving ? 'Saving…' : 'Save'}
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
