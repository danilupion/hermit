import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import * as schema from './schema.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://hermit:hermit@localhost:5490/hermit',
});

export const db = drizzle(pool, { schema });

// Legacy query function for any raw SQL needs
export const query = <T extends pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> => pool.query<T>(text, params);
