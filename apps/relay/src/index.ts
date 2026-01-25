import { serve } from '@hono/node-server';
import { Hono } from 'hono';

import { runMigrations } from './db/index.js';
import { authRoutes } from './routes/index.js';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));
app.route('/auth', authRoutes);

const port = Number(process.env.PORT) || 3001;

const start = async (): Promise<void> => {
  await runMigrations();
  console.log(`Relay server starting on port ${port}`);
  serve({ fetch: app.fetch, port });
};

start().catch(console.error);

export { app };
