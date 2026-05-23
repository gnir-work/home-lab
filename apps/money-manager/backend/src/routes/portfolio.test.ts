import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { Hono } from 'hono';
import { portfolioRoutes } from './portfolio.js';

function makeApp(dataPath: string, targetsPath: string) {
	const app = new Hono();
	app.route('/api/portfolio', portfolioRoutes(dataPath, targetsPath));
	return app;
}

function emptyStores(dir: string): { dataPath: string; targetsPath: string } {
	const dataPath = join(dir, 'portfolio.json');
	const targetsPath = join(dir, 'portfolio-targets.json');
	writeFileSync(dataPath, JSON.stringify({ snapshots: [] }), 'utf-8');
	return { dataPath, targetsPath };
}

const SAMPLE_POSITIONS = {
	VOO: { symbol: 'VOO', shares: 10, price: 500 },
	QQQ: { symbol: 'QQQ', shares: 5, price: 450 },
};

describe('Portfolio snapshot routes', () => {
	let tmpDir: string;
	let dataPath: string;
	let targetsPath: string;
	let app: ReturnType<typeof makeApp>;

	before(() => {
		tmpDir = mkdtempSync(join(tmpdir(), 'money-manager-portfolio-test-'));
		({ dataPath, targetsPath } = emptyStores(tmpDir));
		app = makeApp(dataPath, targetsPath);
	});

	after(() => {
		rmSync(tmpDir, { recursive: true });
	});

	it('GET /api/portfolio returns empty array initially', async () => {
		const res = await app.request('/api/portfolio');
		assert.equal(res.status, 200);
		const body = await res.json();
		assert.deepEqual(body, []);
	});

	it('POST /api/portfolio creates a snapshot', async () => {
		const res = await app.request('/api/portfolio', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ yearMonth: '2026-05', positions: SAMPLE_POSITIONS, usdRate: 3.75 }),
		});
		assert.equal(res.status, 201);
		const body = await res.json();
		assert.equal(body.yearMonth, '2026-05');
		assert.ok(body.id);
		assert.equal(body.positions.VOO.shares, 10);
		assert.equal(body.usdRate, 3.75);
	});

	it('GET /api/portfolio returns the created snapshot', async () => {
		const res = await app.request('/api/portfolio');
		const body = await res.json();
		assert.equal(body.length, 1);
		assert.equal(body[0].yearMonth, '2026-05');
	});

	it('POST /api/portfolio returns 409 for duplicate yearMonth', async () => {
		const res = await app.request('/api/portfolio', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ yearMonth: '2026-05', positions: SAMPLE_POSITIONS }),
		});
		assert.equal(res.status, 409);
	});

	it('PUT /api/portfolio/:yearMonth updates positions and updatedAt', async () => {
		const before = await app.request('/api/portfolio');
		const [original] = await before.json();

		await new Promise((r) => setTimeout(r, 10));

		const updatedPositions = { VOO: { symbol: 'VOO', shares: 15, price: 510 } };
		const res = await app.request('/api/portfolio/2026-05', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ positions: updatedPositions, usdRate: 3.8 }),
		});
		assert.equal(res.status, 200);
		const body = await res.json();
		assert.equal(body.positions.VOO.shares, 15);
		assert.equal(body.usdRate, 3.8);
		assert.notEqual(body.updatedAt, original.updatedAt);
		assert.equal(body.createdAt, original.createdAt);
	});

	it('PUT /api/portfolio/:yearMonth returns 404 for unknown month', async () => {
		const res = await app.request('/api/portfolio/2000-01', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ positions: SAMPLE_POSITIONS }),
		});
		assert.equal(res.status, 404);
	});

	it('DELETE /api/portfolio/:yearMonth removes the snapshot', async () => {
		const res = await app.request('/api/portfolio/2026-05', { method: 'DELETE' });
		assert.equal(res.status, 200);
		const body = await res.json();
		assert.equal(body.deleted, true);

		const listRes = await app.request('/api/portfolio');
		const list = await listRes.json();
		assert.equal(list.length, 0);
	});

	it('DELETE /api/portfolio/:yearMonth returns 404 for unknown month', async () => {
		const res = await app.request('/api/portfolio/2000-01', { method: 'DELETE' });
		assert.equal(res.status, 404);
	});
});

describe('Portfolio targets routes', () => {
	let tmpDir: string;
	let dataPath: string;
	let targetsPath: string;
	let app: ReturnType<typeof makeApp>;

	before(() => {
		tmpDir = mkdtempSync(join(tmpdir(), 'money-manager-targets-test-'));
		({ dataPath, targetsPath } = emptyStores(tmpDir));
		app = makeApp(dataPath, targetsPath);
	});

	after(() => {
		rmSync(tmpDir, { recursive: true });
	});

	it('GET /api/portfolio/targets returns empty targets initially', async () => {
		const res = await app.request('/api/portfolio/targets');
		assert.equal(res.status, 200);
		const body = await res.json();
		assert.deepEqual(body.ils, {});
		assert.deepEqual(body.usd, {});
	});

	it('PUT /api/portfolio/targets saves valid targets', async () => {
		const res = await app.request('/api/portfolio/targets', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ils: { 'TASE.X': 50, 'TASE.Y': 50 }, usd: { VOO: 50, QQQ: 25, IWM: 25 } }),
		});
		assert.equal(res.status, 200);
		const body = await res.json();
		assert.equal(body.ils['TASE.X'], 50);
		assert.equal(body.usd.VOO, 50);
	});

	it('GET /api/portfolio/targets returns saved targets', async () => {
		const res = await app.request('/api/portfolio/targets');
		const body = await res.json();
		assert.equal(body.ils['TASE.X'], 50);
		assert.equal(body.usd.IWM, 25);
	});

	it('PUT /api/portfolio/targets returns 400 when bucket does not sum to 100', async () => {
		const res = await app.request('/api/portfolio/targets', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ ils: { 'TASE.X': 60, 'TASE.Y': 50 }, usd: { VOO: 50 } }),
		});
		assert.equal(res.status, 400);
	});
});
