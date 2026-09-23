import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import * as portfolioStore from '../storage/portfolioStore.js';
import * as targetsStore from '../storage/portfolioTargetsStore.js';
import type { PortfolioPosition, PortfolioTargets } from '../types.js';

export function portfolioRoutes(dataPath: string, targetsPath: string) {
	const app = new Hono();

	// --- Targets (must come before /:yearMonth to avoid route shadowing) ---

	app.get('/targets', (c) => {
		const targets = targetsStore.readPortfolioTargets(targetsPath);
		return c.json(targets ?? { ils: {}, usd: {}, updatedAt: '' });
	});

	app.put('/targets', async (c) => {
		const body = await c.req.json<{ ils: Record<string, number>; usd: Record<string, number> }>();

		const ilsSum = Object.values(body.ils).reduce((a, b) => a + b, 0);
		const usdSum = Object.values(body.usd).reduce((a, b) => a + b, 0);

		const ilsValid = Object.keys(body.ils).length === 0 || Math.abs(ilsSum - 100) < 0.01;
		const usdValid = Object.keys(body.usd).length === 0 || Math.abs(usdSum - 100) < 0.01;

		if (!ilsValid || !usdValid) {
			return c.json({ error: 'Target percentages must sum to 100 per bucket' }, 400);
		}

		const targets: PortfolioTargets = {
			ils: body.ils,
			usd: body.usd,
			updatedAt: new Date().toISOString(),
		};

		targetsStore.writePortfolioTargets(targetsPath, targets);
		return c.json(targets);
	});

	// --- Snapshots ---

	app.get('/', (c) => {
		return c.json(portfolioStore.getAllPortfolioSnapshots(dataPath));
	});

	app.post('/', async (c) => {
		const body = await c.req.json<{
			yearMonth: string;
			positions: Record<string, PortfolioPosition>;
			usdRate?: number;
		}>();

		if (portfolioStore.getPortfolioSnapshotByYearMonth(dataPath, body.yearMonth)) {
			return c.json({ error: 'Portfolio snapshot for this month already exists' }, 409);
		}

		const now = new Date().toISOString();
		const snapshot = {
			id: randomUUID(),
			yearMonth: body.yearMonth,
			positions: body.positions,
			usdRate: body.usdRate,
			createdAt: now,
			updatedAt: now,
		};

		portfolioStore.insertPortfolioSnapshot(dataPath, snapshot);
		return c.json(snapshot, 201);
	});

	app.put('/:yearMonth', async (c) => {
		const yearMonth = c.req.param('yearMonth');
		const existing = portfolioStore.getPortfolioSnapshotByYearMonth(dataPath, yearMonth);
		if (!existing) {
			return c.json({ error: 'Portfolio snapshot not found' }, 404);
		}

		const body = await c.req.json<{
			positions: Record<string, PortfolioPosition>;
			usdRate?: number;
		}>();
		const updated = {
			...existing,
			positions: body.positions,
			usdRate: body.usdRate ?? existing.usdRate,
			updatedAt: new Date().toISOString(),
		};

		portfolioStore.updatePortfolioSnapshot(dataPath, updated);
		return c.json(updated);
	});

	app.delete('/:yearMonth', (c) => {
		const yearMonth = c.req.param('yearMonth');
		const deleted = portfolioStore.removePortfolioSnapshot(dataPath, yearMonth);
		if (!deleted) {
			return c.json({ error: 'Portfolio snapshot not found' }, 404);
		}
		return c.json({ deleted: true });
	});

	return app;
}
