import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog.js';
import { ILS_TICKERS, USD_TICKERS } from '../../../config/tickers.js';
import type { PortfolioTargets } from '../../../types/index.js';

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	bucket: 'ils' | 'usd';
	targets: PortfolioTargets;
	onSave: (ils: Record<string, number>, usd: Record<string, number>) => Promise<void>;
}

export function EditTargetsModal({ open, onOpenChange, bucket, targets, onSave }: Props) {
	const tickers = bucket === 'ils' ? ILS_TICKERS : USD_TICKERS;
	const [fields, setFields] = useState<Record<string, string>>({});
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;
		const init: Record<string, string> = {};
		for (const t of tickers) {
			init[t.symbol] = (targets[bucket][t.symbol] ?? '').toString();
		}
		setFields(init);
		setError(null);
	}, [open, bucket, targets, tickers]);

	const sum = Object.values(fields).reduce((s, v) => s + (Number(v) || 0), 0);
	const valid = Math.abs(sum - 100) < 0.01;

	async function handleSave() {
		if (!valid) {
			setError('Percentages must sum to 100.');
			return;
		}
		setSaving(true);
		setError(null);
		try {
			const newBucket: Record<string, number> = {};
			for (const t of tickers) {
				newBucket[t.symbol] = Number(fields[t.symbol]) || 0;
			}
			const ils = bucket === 'ils' ? newBucket : { ...targets.ils };
			const usd = bucket === 'usd' ? newBucket : { ...targets.usd };
			await onSave(ils, usd);
			onOpenChange(false);
		} finally {
			setSaving(false);
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Target Allocation — {bucket.toUpperCase()} Bucket</DialogTitle>
				</DialogHeader>

				<div className="space-y-3">
					{tickers.map((t) => (
						<div key={t.symbol} className="flex items-center gap-3">
							<span
								className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
								style={{ backgroundColor: t.color }}
							/>
							<span className="w-20 font-medium text-sm text-gray-800">{t.symbol}</span>
							<div className="relative flex-1">
								<input
									type="number"
									step="1"
									min="0"
									max="100"
									value={fields[t.symbol] ?? ''}
									onChange={(e) => setFields((prev) => ({ ...prev, [t.symbol]: e.target.value }))}
									className="w-full rounded-md border border-gray-300 py-1.5 pl-3 pr-7 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
									%
								</span>
							</div>
						</div>
					))}
				</div>

				<div className="mt-3 flex items-center justify-between">
					<span className={`text-sm ${valid ? 'text-green-600' : 'text-orange-500'}`}>
						Sum: {sum.toFixed(0)}% {valid ? '✓' : '(need 100%)'}
					</span>
				</div>

				{error && <p className="text-sm text-red-600">{error}</p>}

				<div className="mt-4 flex justify-end gap-3">
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
						disabled={!valid || saving}
						className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{saving ? 'Saving…' : 'Save Targets'}
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
