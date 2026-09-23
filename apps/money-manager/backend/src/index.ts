import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { feeRoutes } from './routes/fees.js';
import { portfolioRoutes } from './routes/portfolio.js';
import { snapshotRoutes } from './routes/snapshots.js';

const DATA_PATH = process.env.DATA_PATH ?? './data/snapshots.json';
const FEES_PATH = process.env.FEES_PATH ?? './data/fees.json';
const PORTFOLIO_PATH = process.env.PORTFOLIO_PATH ?? './data/portfolio.json';
const PORTFOLIO_TARGETS_PATH =
	process.env.PORTFOLIO_TARGETS_PATH ?? './data/portfolio-targets.json';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));
app.route('/api/snapshots', snapshotRoutes(DATA_PATH));
app.route('/api/fees', feeRoutes(FEES_PATH));
app.route('/api/portfolio', portfolioRoutes(PORTFOLIO_PATH, PORTFOLIO_TARGETS_PATH));

serve({ fetch: app.fetch, port: 3001 }, () => {
	console.log('Backend running on http://localhost:3001');
});
