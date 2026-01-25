import type { UserId, UserInfo } from '@hermit/protocol/types.js';

import { query } from '../db/index.js';
import { hashPassword } from '../services/auth.js';

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
};

export const createUser = async (email: string, password: string): Promise<UserInfo> => {
  const passwordHash = await hashPassword(password);

  const { rows } = await query<UserRow>(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
    [email, passwordHash],
  );

  return { id: rows[0].id, email: rows[0].email };
};

export const findUserByEmail = async (email: string): Promise<UserRow | null> => {
  const { rows } = await query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);

  return rows[0] || null;
};

export const findUserById = async (id: UserId): Promise<UserInfo | null> => {
  const { rows } = await query<UserRow>('SELECT id, email FROM users WHERE id = $1', [id]);

  if (!rows[0]) return null;

  return { id: rows[0].id, email: rows[0].email };
};
