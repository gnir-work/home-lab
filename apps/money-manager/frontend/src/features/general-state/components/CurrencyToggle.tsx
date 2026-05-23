import { cn } from '../../../lib/utils.js';

export function CurrencyToggle({
	value,
	onChange,
}: {
	value: boolean;
	onChange: (v: boolean) => void;
}) {
	return (
		<div className="flex items-center gap-1 rounded-lg bg-gray-100 p-1 text-sm font-medium">
			<button
				type="button"
				onClick={() => onChange(false)}
				className={cn(
					'rounded-md px-3 py-1.5 transition-all',
					!value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
				)}
			>
				All in ₪
			</button>
			<button
				type="button"
				onClick={() => onChange(true)}
				className={cn(
					'rounded-md px-3 py-1.5 transition-all',
					value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
				)}
			>
				Native ($/ ₪)
			</button>
		</div>
	);
}
