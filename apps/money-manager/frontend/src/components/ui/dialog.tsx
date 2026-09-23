import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogOverlay({ className }: { className?: string }) {
	return (
		<DialogPrimitive.Overlay
			className={cn(
				'fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
				className,
			)}
		/>
	);
}

export function DialogContent({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<DialogPrimitive.Portal>
			<DialogOverlay />
			<DialogPrimitive.Content
				className={cn(
					// Mobile: bottom sheet
					'fixed bottom-0 left-0 right-0 z-50 w-full rounded-t-2xl bg-white p-6 shadow-xl focus:outline-none',
					'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
					// Desktop: centered modal
					'sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg',
					'sm:data-[state=closed]:slide-out-to-bottom-0 sm:data-[state=open]:slide-in-from-bottom-0',
					'sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95',
					className,
				)}
			>
				{children}
				<DialogPrimitive.Close className="absolute right-4 top-4 rounded p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400">
					<X className="h-4 w-4" />
					<span className="sr-only">Close</span>
				</DialogPrimitive.Close>
			</DialogPrimitive.Content>
		</DialogPrimitive.Portal>
	);
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
	return <div className="mb-4 flex flex-col gap-1">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
	return (
		<DialogPrimitive.Title className="text-lg font-semibold text-gray-900">
			{children}
		</DialogPrimitive.Title>
	);
}
