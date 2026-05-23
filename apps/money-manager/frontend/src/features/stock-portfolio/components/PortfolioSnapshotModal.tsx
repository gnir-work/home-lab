import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog.js';
import { ILS_TICKERS, TICKERS, USD_TICKERS } from '../../../config/tickers.js';
import { currentYearMonth, formatYearMonth } from '../../../lib/utils.js';
import type { PortfolioPosition, PortfolioSnapshot } from '../../../types/index.js';

interface PositionFields {
	shares: string;
	price: string;
}

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	snapshot: PortfolioSnapshot | null;
	onSave: (
		yearMonth: string,
		positions: Record<string, PortfolioPosition>,
		usdRate?: number,
	) => Promise<void>;
}

function emptyFields(): PositionFields {
	return { shares: '', price: '' };
}

export function PortfolioSnapshotModal({ open, onOpenChange, snapshot, onSave }: Props) {
	const [yearMonth, setYearMonth] = useState(currentYearMonth());
	const [fields, setFields] = useState<Record<string, PositionFields>>({});
	const [usdRate, setUsdRate] = useState('');
	const [saving, setSaving] = useState(false);
	const [conflictError, setConflictError] = useState(false);

	useEffect(() => {
		if (!open) return;
		setConflictError(false);
		if (snapshot) {
			setYearMonth(snapshot.yearMonth);
			setUsdRate(snapshot.usdRate?.toString() ?? '');
			const init: Record<string, PositionFields> = {};
			for (const t of TICKERS) {
				const pos = snapshot.positions[t.symbol];
				init[t.symbol] = pos
					? { shares: pos.shares.toString(), price: pos.price.toString() }
					: emptyFields();
			}
			setFields(init);
		} else {
			setYearMonth(currentYearMonth());
			setUsdRate('');
			setFields({});
		}
	}, [open, snapshot]);

	function setField(symbol: string, key: keyof PositionFields, value: string) {
		setFields((prev) => ({
			...prev,
			[symbol]: { ...(prev[symbol] ?? emptyFields()), [key]: value },
		}));
	}

	const hasAnyPosition = Object.values(fields).some((f) => f.shares.trim() && f.price.trim());

	const title = snapshot
		? `Edit Holdings — ${formatYearMonth(snapshot.yearMonth)}`
		: `New Holdings Snapshot — ${formatYearMonth(yearMonth)}`;

	async function handleSave() {
		const positions: Record<string, PortfolioPosition> = {};
		for (const t of TICKERS) {
			const f = fields[t.symbol];
			if (!f || !f.shares.trim() || !f.price.trim()) continue;
			positions[t.symbol] = {
				symbol: t.symbol,
				shares: Number(f.shares),
				price: Number(f.price),
			};
		}

		setSaving(true);
		setConflictError(false);
		try {
			await onSave(yearMonth, positions, usdRate ? Number(usdRate) : undefined);
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

				<div className="mb-4 flex gap-4">
					{!snapshot && (
						<div className="flex-1">
							<label
								htmlFor="portfolio-month"
								className="mb-1 block text-sm font-medium text-gray-700"
							>
								Month
							</label>
							<input
								id="portfolio-month"
								type="month"
								value={yearMonth}
								onChange={(e) => {
									setYearMonth(e.target.value);
									setConflictError(false);
								}}
								className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>
					)}
					<div className="w-36">
						<label
							htmlFor="portfolio-usd-rate"
							className="mb-1 block text-sm font-medium text-gray-700"
						>
							USD Rate (₪/$)
						</label>
						<input
							id="portfolio-usd-rate"
							type="number"
							step="0.01"
							min="0"
							value={usdRate}
							onChange={(e) => setUsdRate(e.target.value)}
							placeholder="3.75"
							className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				{conflictError && (
					<p className="mb-3 rounded-md bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
						A snapshot for this month already exists. Choose a different month or edit the existing
						one.
					</p>
				)}

				{/* ILS Bucket */}
				<div className="mb-4">
					<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
						ILS Bucket (IBI ILS)
					</p>
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-gray-200">
								<th className="pb-1.5 text-left text-xs font-medium text-gray-500">Stock</th>
								<th className="pb-1.5 pl-3 text-left text-xs font-medium text-gray-500 w-28">Shares</th>
								<th className="pb-1.5 pl-3 text-left text-xs font-medium text-gray-500 w-32">Price (₪)</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
						{ILS_TICKERS.map((ticker) => {
							const f = fields[ticker.symbol] ?? emptyFields();
							const prev = snapshot?.positions[ticker.symbol];
							return (
								<tr key={ticker.symbol}>
									<td className="py-2 pr-3">
										<div className="flex items-center gap-2">
											<span
												className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
												style={{ backgroundColor: ticker.color }}
											/>
											<div className="min-w-0">
												<div className="text-sm font-medium text-gray-800">{ticker.name}</div>
												<div className="text-xs text-gray-400">{ticker.symbol}</div>
											</div>
										</div>
									</td>
									<td className="py-2 pl-3">
										<input
											id={`${ticker.symbol}-shares`}
											type="number"
											min="0"
											value={f.shares}
											onChange={(e) => setField(ticker.symbol, 'shares', e.target.value)}
											placeholder={prev ? prev.shares.toString() : '0'}
											className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</td>
									<td className="py-2 pl-3">
										<div className="relative">
											<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₪</span>
											<input
												id={`${ticker.symbol}-price`}
												type="number"
												step="0.01"
												min="0"
												value={f.price}
												onChange={(e) => setField(ticker.symbol, 'price', e.target.value)}
												placeholder={prev ? prev.price.toString() : '0.00'}
												className="w-full rounded-md border border-gray-300 py-1.5 pl-6 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
									</td>
								</tr>
							);
						})}
						</tbody>
					</table>
				</div>

				{/* USD Bucket */}
				<div className="mb-4">
					<p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
						USD Bucket (IBI USD)
					</p>
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-gray-200">
								<th className="pb-1.5 text-left text-xs font-medium text-gray-500">Stock</th>
								<th className="pb-1.5 pl-3 text-left text-xs font-medium text-gray-500 w-28">Shares</th>
								<th className="pb-1.5 pl-3 text-left text-xs font-medium text-gray-500 w-32">Price ($)</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-100">
						{USD_TICKERS.map((ticker) => {
							const f = fields[ticker.symbol] ?? emptyFields();
							const prev = snapshot?.positions[ticker.symbol];
							return (
								<tr key={ticker.symbol}>
									<td className="py-2 pr-3">
										<div className="flex items-center gap-2">
											<span
												className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
												style={{ backgroundColor: ticker.color }}
											/>
											<div className="min-w-0">
												<div className="text-sm font-medium text-gray-800">{ticker.name}</div>
												<div className="text-xs text-gray-400">{ticker.symbol}</div>
											</div>
										</div>
									</td>
									<td className="py-2 pl-3">
										<input
											id={`${ticker.symbol}-shares`}
											type="number"
											min="0"
											value={f.shares}
											onChange={(e) => setField(ticker.symbol, 'shares', e.target.value)}
											placeholder={prev ? prev.shares.toString() : '0'}
											className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</td>
									<td className="py-2 pl-3">
										<div className="relative">
											<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
											<input
												id={`${ticker.symbol}-price`}
												type="number"
												step="0.01"
												min="0"
												value={f.price}
												onChange={(e) => setField(ticker.symbol, 'price', e.target.value)}
												placeholder={prev ? prev.price.toString() : '0.00'}
												className="w-full rounded-md border border-gray-300 py-1.5 pl-6 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
											/>
										</div>
									</td>
								</tr>
							);
						})}
						</tbody>
					</table>
				</div>

				<div className="flex justify-end gap-3">
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
						disabled={!hasAnyPosition || saving}
						className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{saving ? 'Saving…' : 'Save Snapshot'}
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
