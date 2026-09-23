import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { Hono } from 'hono';
import { feeRoutes } from './fees.js';

function makeApp(dataPath: string) {
	const app = new Hono();
	app.route('/api/fees', feeRoutes(dataPath));
	return app;
}

function emptyStore(dir: string): string {
	const path = join(dir, 'fees.json');
	writeFileSync(path, JSON.stringify({ snapshots: [] }), 'utf-8');
	return path;
}

const SAMPLE_ENTRIES = {
	pension_general: {
		accountId: 'pension_general',
		depositFeePct: 0.5,
		managementFeePct: 1.2,
		monthlyDeposit: 2000,
	},
};

describe('Fee routes', () => {
	let tmpDir: string;
	let dataPath: string;
	let app: ReturnType<typeof makeApp>;

	before(() => {
		tmpDir = mkdtempSync(join(tmpdir(), 'money-manager-fees-test-'));
		dataPath = emptyStore(tmpDir);
		app = makeApp(dataPath);
	});

	after(() => {
		rmSync(tmpDir, { recursive: true });
	});

	it('GET /api/fees returns empty array initially', async () => {
		const res = await app.request('/api/fees');
		assert.equal(res.status, 200);
		const body = await res.json();
		assert.deepEqual(body, []);
	});

	it('POST /api/fees creates a fee snapshot', async () => {
		const res = await app.request('/api/fees', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ date: '2026-05', entries: SAMPLE_ENTRIES }),
		});
		assert.equal(res.status, 201);
		const body = await res.json();
		assert.equal(body.date, '2026-05');
		assert.ok(body.id, 'should have an id');
		assert.equal(body.entries.pension_general.depositFeePct, 0.5);
	});

	it('GET /api/fees returns the created fee snapshot', async () => {
		const res = await app.request('/api/fees');
		const body = await res.json();
		assert.equal(body.length, 1);
		assert.equal(body[0].date, '2026-05');
	});

	it('POST /api/fees returns 409 for duplicate date', async () => {
		const res = await app.request('/api/fees', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ date: '2026-05', entries: SAMPLE_ENTRIES }),
		});
		assert.equal(res.status, 409);
	});

	it('PUT /api/fees/:date updates entries and updatedAt', async () => {
		const before = await app.request('/api/fees');
		const [original] = await before.json();

		await new Promise((r) => setTimeout(r, 10));

		const updatedEntries = {
			pension_general: { ...SAMPLE_ENTRIES.pension_general, depositFeePct: 0.3 },
		};
		const res = await app.request('/api/fees/2026-05', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ entries: updatedEntries }),
		});
		assert.equal(res.status, 200);
		const body = await res.json();
		assert.equal(body.entries.pension_general.depositFeePct, 0.3);
		assert.notEqual(body.updatedAt, original.updatedAt, 'updatedAt should change');
		assert.equal(body.createdAt, original.createdAt, 'createdAt should not change');
	});

	it('PUT /api/fees/:date returns 404 for unknown date', async () => {
		const res = await app.request('/api/fees/2000-01', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ entries: SAMPLE_ENTRIES }),
		});
		assert.equal(res.status, 404);
	});

	it('DELETE /api/fees/:date removes the fee snapshot', async () => {
		const res = await app.request('/api/fees/2026-05', { method: 'DELETE' });
		assert.equal(res.status, 200);
		const body = await res.json();
		assert.equal(body.deleted, true);

		const listRes = await app.request('/api/fees');
		const list = await listRes.json();
		assert.equal(list.length, 0);
	});

	it('DELETE /api/fees/:date returns 404 for unknown date', async () => {
		const res = await app.request('/api/fees/2000-01', { method: 'DELETE' });
		assert.equal(res.status, 404);
	});
});
