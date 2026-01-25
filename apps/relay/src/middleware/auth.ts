import type { Context, Next } from 'hono';

import { verifyToken } from '../services/auth.js';

export type AuthVariables = {
  userId: string;
  email: string;
};

export const authMiddleware = async (c: Context, next: Next): Promise<Response | void> => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }

  const token = authHeader.slice(7);

  try {
    const payload = await verifyToken(token);
    c.set('userId', payload.sub);
    c.set('email', payload.email);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
};
