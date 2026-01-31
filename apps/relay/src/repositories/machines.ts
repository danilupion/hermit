import type { MachineId, MachineInfo, UserId } from '@hermit/protocol/types.js';

import { query } from '../db/index.js';
import { hashMachineToken } from '../services/auth.js';

export type MachineRow = {
  id: string;
  user_id: string;
  name: string;
  token_hash: string;
  last_seen: Date | null;
  created_at: Date;
};

export const createMachine = async (
  userId: UserId,
  name: string,
  token: string,
): Promise<MachineInfo> => {
  const tokenHash = await hashMachineToken(token);

  const { rows } = await query<MachineRow>(
    'INSERT INTO machines (user_id, name, token_hash) VALUES ($1, $2, $3) RETURNING id, name, last_seen, created_at',
    [userId, name, tokenHash],
  );

  return {
    id: rows[0].id,
    name: rows[0].name,
    online: false,
    lastSeen: rows[0].last_seen?.toISOString() || rows[0].created_at.toISOString(),
    sessionCount: 0,
  };
};

export const findMachinesByUserId = async (userId: UserId): Promise<MachineInfo[]> => {
  const { rows } = await query<MachineRow>(
    'SELECT id, name, last_seen, created_at FROM machines WHERE user_id = $1 ORDER BY name',
    [userId],
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    online: false,
    lastSeen: row.last_seen?.toISOString() || row.created_at.toISOString(),
    sessionCount: 0,
  }));
};

export const findMachineById = async (id: MachineId): Promise<MachineRow | null> => {
  const { rows } = await query<MachineRow>('SELECT * FROM machines WHERE id = $1', [id]);

  return rows[0] || null;
};

export const findMachineByUserAndName = async (
  userId: UserId,
  name: string,
): Promise<MachineRow | null> => {
  const { rows } = await query<MachineRow>(
    'SELECT * FROM machines WHERE user_id = $1 AND name = $2',
    [userId, name],
  );

  return rows[0] || null;
};

export const updateMachineLastSeen = async (id: MachineId): Promise<void> => {
  await query('UPDATE machines SET last_seen = now() WHERE id = $1', [id]);
};

export const findAllMachines = async (): Promise<MachineRow[]> => {
  const { rows } = await query<MachineRow>('SELECT * FROM machines');
  return rows;
};
