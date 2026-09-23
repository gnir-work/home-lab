import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils.js';

export const Tabs = TabsPrimitive.Root;

export function TabsList({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<TabsPrimitive.List
			className={cn(
				'inline-flex h-10 items-center rounded-lg bg-gray-100 p-1 text-gray-500',
				className,
			)}
		>
			{children}
		</TabsPrimitive.List>
	);
}

export function TabsTrigger({
	value,
	children,
}: {
	value: string;
	children: React.ReactNode;
}) {
	return (
		<TabsPrimitive.Trigger
			value={value}
			className="inline-flex items-center justify-center rounded-md px-4 py-1.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
		>
			{children}
		</TabsPrimitive.Trigger>
	);
}

export function TabsContent({
	value,
	children,
	className,
}: {
	value: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<TabsPrimitive.Content value={value} className={cn('mt-4 focus:outline-none', className)}>
			{children}
		</TabsPrimitive.Content>
	);
}
