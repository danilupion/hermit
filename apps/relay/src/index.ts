import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));

const port = Number(process.env.PORT) || 3001;

console.log(`Relay server starting on port ${port}`);

serve({ fetch: app.fetch, port });

export { app };
