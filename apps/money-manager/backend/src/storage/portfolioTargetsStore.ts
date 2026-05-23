import { readFileSync, writeFileSync } from 'node:fs';
import type { PortfolioTargets } from '../types.js';

export function readPortfolioTargets(path: string): PortfolioTargets | null {
	try {
		const raw = readFileSync(path, 'utf-8');
		return JSON.parse(raw) as PortfolioTargets;
	} catch {
		return null;
	}
}

export function writePortfolioTargets(path: string, targets: PortfolioTargets): void {
	writeFileSync(path, JSON.stringify(targets, null, 2), 'utf-8');
}
