import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import * as store from '../storage/fileStore.js';

export function snapshotRoutes(dataPath: string) {
	const app = new Hono();

	app.get('/', (c) => {
		return c.json(store.getAll(dataPath));
	});

	app.post('/', async (c) => {
		const body = await c.req.json<{
			yearMonth: string;
			values: Record<string, number>;
			usdRate?: number;
		}>();

		if (store.getByYearMonth(dataPath, body.yearMonth)) {
			return c.json({ error: 'Snapshot for this month already exists' }, 409);
		}

		const now = new Date().toISOString();
		const snapshot = {
			id: randomUUID(),
			yearMonth: body.yearMonth,
			values: body.values,
			...(body.usdRate !== undefined ? { usdRate: body.usdRate } : {}),
			createdAt: now,
			updatedAt: now,
		};

		store.insert(dataPath, snapshot);
		return c.json(snapshot, 201);
	});

	app.put('/:yearMonth', async (c) => {
		const yearMonth = c.req.param('yearMonth');
		const existing = store.getByYearMonth(dataPath, yearMonth);
		if (!existing) {
			return c.json({ error: 'Snapshot not found' }, 404);
		}

		const body = await c.req.json<{ values: Record<string, number>; usdRate?: number }>();
		const updated = {
			...existing,
			values: body.values,
			...(body.usdRate !== undefined ? { usdRate: body.usdRate } : {}),
			updatedAt: new Date().toISOString(),
		};

		store.update(dataPath, updated);
		return c.json(updated);
	});

	app.delete('/:yearMonth', (c) => {
		const yearMonth = c.req.param('yearMonth');
		const deleted = store.remove(dataPath, yearMonth);
		if (!deleted) {
			return c.json({ error: 'Snapshot not found' }, 404);
		}
		return c.json({ deleted: true });
	});

	return app;
}
