import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import type { AuthVariables } from '../middleware/auth.js';

import { authMiddleware } from '../middleware/auth.js';
import {
  createMachine,
  findMachineByUserAndName,
  findMachinesByUserId,
} from '../repositories/machines.js';
import { generateMachineToken } from '../services/auth.js';

const createMachineSchema = z.object({
  name: z.string().min(1).max(64),
});

export const machineRoutes = new Hono<{ Variables: AuthVariables }>()
  .use('*', authMiddleware)
  .get('/', async (c) => {
    const userId = c.get('userId');
    const machines = await findMachinesByUserId(userId);
    return c.json({ machines });
  })
  .post('/', zValidator('json', createMachineSchema), async (c) => {
    const userId = c.get('userId');
    const { name } = c.req.valid('json');

    const existing = await findMachineByUserAndName(userId, name);
    if (existing) {
      return c.json({ error: 'Machine with this name already exists' }, 400);
    }

    const token = generateMachineToken();
    const machine = await createMachine(userId, name, token);

    return c.json({
      machine,
      token,
    });
  });
