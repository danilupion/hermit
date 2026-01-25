import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { pool, query } from './pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const runMigrations = async (): Promise<void> => {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = await fs.readdir(migrationsDir);
  const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

  for (const file of sqlFiles) {
    const name = path.basename(file, '.sql');

    const { rows } = await query<{ name: string }>('SELECT name FROM migrations WHERE name = $1', [
      name,
    ]);

    if (rows.length > 0) {
      console.log(`Migration ${name} already applied, skipping`);
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf-8');
    await query(sql);
    await query('INSERT INTO migrations (name) VALUES ($1)', [name]);
    console.log(`Applied migration: ${name}`);
  }
};

export const closePool = (): Promise<void> => pool.end();
