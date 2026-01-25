import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import { Hono } from 'hono';

import { runMigrations } from './db/index.js';
import { authRoutes, machineRoutes } from './routes/index.js';
import { createAgentHandlers, createClientHandlers } from './ws/index.js';

const app = new Hono();
const nodeWs = createNodeWebSocket({ app });
const { upgradeWebSocket } = nodeWs;

app.get('/health', (c) => c.json({ status: 'ok' }));
app.route('/auth', authRoutes);
app.route('/api/machines', machineRoutes);

app.get(
  '/ws/agent',
  upgradeWebSocket(() => createAgentHandlers()),
);
app.get(
  '/ws/client',
  upgradeWebSocket(() => createClientHandlers()),
);

const port = Number(process.env.PORT) || 3001;

const start = async (): Promise<void> => {
  await runMigrations();
  console.log(`Relay server starting on port ${port}`);
  const server = serve({ fetch: (req, info) => app.fetch(req, info), port });
  nodeWs.injectWebSocket(server);
};

// Only start server if this is the main module (not when imported in tests)
if (process.env.NODE_ENV !== 'test') {
  start().catch(console.error);
}

export { app };
