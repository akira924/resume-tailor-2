import { Router } from 'express';

import { requireAuth } from '../middleware/require-auth.js';
import { requireAdmin } from '../middleware/require-admin.js';
import { UserModel, toPublicUser } from '../models/user.js';

export const usersRouter = Router();

usersRouter.use(requireAuth, requireAdmin);

usersRouter.get('/', async (_req, res) => {
  const users = await UserModel.find().sort({ createdAt: -1 });

  res.json({
    users: users.map((user) => ({ ...toPublicUser(user), createdAt: user.createdAt })),
  });
});
