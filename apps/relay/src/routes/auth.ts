import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { createUser, findUserByEmail } from '../repositories/users.js';
import { generateAccessToken, generateRefreshToken, verifyPassword } from '../services/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const authRoutes = new Hono()
  .post('/register', zValidator('json', registerSchema), async (c) => {
    const { email, password } = c.req.valid('json');

    const existing = await findUserByEmail(email);
    if (existing) {
      return c.json({ error: 'Email already registered' }, 400);
    }

    const user = await createUser(email, password);
    const accessToken = await generateAccessToken(user.id, user.email);
    const refreshToken = await generateRefreshToken(user.id);

    return c.json({
      user,
      accessToken,
      refreshToken,
    });
  })
  .post('/login', zValidator('json', loginSchema), async (c) => {
    const { email, password } = c.req.valid('json');

    const user = await findUserByEmail(email);
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const accessToken = await generateAccessToken(user.id, user.email);
    const refreshToken = await generateRefreshToken(user.id);

    return c.json({
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
    });
  });
