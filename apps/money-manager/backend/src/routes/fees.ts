import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import * as store from '../storage/feeStore.js';
import type { FeeEntry } from '../types.js';

export function feeRoutes(dataPath: string) {
	const app = new Hono();

	app.get('/', (c) => {
		return c.json(store.getAllFees(dataPath));
	});

	app.post('/', async (c) => {
		const body = await c.req.json<{ date: string; entries: Record<string, FeeEntry> }>();

		if (store.getFeeByDate(dataPath, body.date)) {
			return c.json({ error: 'Fee snapshot for this date already exists' }, 409);
		}

		const now = new Date().toISOString();
		const snapshot = {
			id: randomUUID(),
			date: body.date,
			entries: body.entries,
			createdAt: now,
			updatedAt: now,
		};

		store.insertFee(dataPath, snapshot);
		return c.json(snapshot, 201);
	});

	app.put('/:date', async (c) => {
		const date = c.req.param('date');
		const existing = store.getFeeByDate(dataPath, date);
		if (!existing) {
			return c.json({ error: 'Fee snapshot not found' }, 404);
		}

		const body = await c.req.json<{ entries: Record<string, FeeEntry> }>();
		const updated = {
			...existing,
			entries: body.entries,
			updatedAt: new Date().toISOString(),
		};

		store.updateFee(dataPath, updated);
		return c.json(updated);
	});

	app.delete('/:date', (c) => {
		const date = c.req.param('date');
		const deleted = store.removeFee(dataPath, date);
		if (!deleted) {
			return c.json({ error: 'Fee snapshot not found' }, 404);
		}
		return c.json({ deleted: true });
	});

	return app;
}
