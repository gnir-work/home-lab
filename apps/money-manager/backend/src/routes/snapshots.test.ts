import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { Hono } from 'hono';
import { snapshotRoutes } from './snapshots.js';

function makeApp(dataPath: string) {
	const app = new Hono();
	app.route('/api/snapshots', snapshotRoutes(dataPath));
	return app;
}

function emptyStore(dir: string): string {
	const path = join(dir, 'snapshots.json');
	writeFileSync(path, JSON.stringify({ snapshots: [] }), 'utf-8');
	return path;
}

describe('Snapshot routes', () => {
	let tmpDir: string;
	let dataPath: string;
	let app: ReturnType<typeof makeApp>;

	before(() => {
		tmpDir = mkdtempSync(join(tmpdir(), 'money-manager-test-'));
		dataPath = emptyStore(tmpDir);
		app = makeApp(dataPath);
	});

	after(() => {
		rmSync(tmpDir, { recursive: true });
	});

	it('GET /api/snapshots returns empty array initially', async () => {
		const res = await app.request('/api/snapshots');
		assert.equal(res.status, 200);
		const body = await res.json();
		assert.deepEqual(body, []);
	});

	it('POST /api/snapshots creates a snapshot', async () => {
		const res = await app.request('/api/snapshots', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ yearMonth: '2026-05', values: { bank: 120000, pension_a: 340000 } }),
		});
		assert.equal(res.status, 201);
		const body = await res.json();
		assert.equal(body.yearMonth, '2026-05');
		assert.equal(body.values.bank, 120000);
		assert.ok(body.id, 'should have an id');
	});

	it('GET /api/snapshots returns the created snapshot', async () => {
		const res = await app.request('/api/snapshots');
		const body = await res.json();
		assert.equal(body.length, 1);
		assert.equal(body[0].yearMonth, '2026-05');
	});

	it('POST /api/snapshots returns 409 for duplicate yearMonth', async () => {
		const res = await app.request('/api/snapshots', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ yearMonth: '2026-05', values: { bank: 999 } }),
		});
		assert.equal(res.status, 409);
	});

	it('PUT /api/snapshots/:yearMonth updates values and updatedAt', async () => {
		const before = await app.request('/api/snapshots');
		const [original] = await before.json();

		await new Promise((r) => setTimeout(r, 10)); // ensure updatedAt differs

		const res = await app.request('/api/snapshots/2026-05', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ values: { bank: 150000, pension_a: 360000 } }),
		});
		assert.equal(res.status, 200);
		const body = await res.json();
		assert.equal(body.values.bank, 150000);
		assert.notEqual(body.updatedAt, original.updatedAt, 'updatedAt should change');
		assert.equal(body.createdAt, original.createdAt, 'createdAt should not change');
	});

	it('PUT /api/snapshots/:yearMonth returns 404 for unknown month', async () => {
		const res = await app.request('/api/snapshots/2000-01', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ values: { bank: 0 } }),
		});
		assert.equal(res.status, 404);
	});

	it('DELETE /api/snapshots/:yearMonth removes the snapshot', async () => {
		const res = await app.request('/api/snapshots/2026-05', { method: 'DELETE' });
		assert.equal(res.status, 200);
		const body = await res.json();
		assert.equal(body.deleted, true);

		const listRes = await app.request('/api/snapshots');
		const list = await listRes.json();
		assert.equal(list.length, 0);
	});

	it('DELETE /api/snapshots/:yearMonth returns 404 for unknown month', async () => {
		const res = await app.request('/api/snapshots/2000-01', { method: 'DELETE' });
		assert.equal(res.status, 404);
	});
});
