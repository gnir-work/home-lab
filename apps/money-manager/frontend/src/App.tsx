import { useState } from 'react';
import { AccountFeesPage } from './features/account-fees/AccountFeesPage.js';
import { GeneralStatePage } from './features/general-state/GeneralStatePage.js';
import { StockPortfolioPage } from './features/stock-portfolio/StockPortfolioPage.js';
import { cn } from './lib/utils.js';

type Page = 'general-state' | 'account-fees' | 'stock-portfolio';

function NavButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				'rounded-md px-4 py-2 text-sm font-medium transition-all',
				active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
			)}
		>
			{children}
		</button>
	);
}

export function App() {
	const [page, setPage] = useState<Page>('general-state');

	return (
		<div>
			<nav className="sticky top-0 z-20 border-b border-gray-200 bg-white">
				<div className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-2">
					<NavButton active={page === 'general-state'} onClick={() => setPage('general-state')}>
						Net Worth
					</NavButton>
					<NavButton active={page === 'account-fees'} onClick={() => setPage('account-fees')}>
						Account Fees
					</NavButton>
					<NavButton active={page === 'stock-portfolio'} onClick={() => setPage('stock-portfolio')}>
						Stock Portfolio
					</NavButton>
				</div>
			</nav>
			{page === 'general-state' && <GeneralStatePage />}
			{page === 'account-fees' && <AccountFeesPage />}
			{page === 'stock-portfolio' && <StockPortfolioPage />}
		</div>
	);
}
