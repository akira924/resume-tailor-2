import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';

import { HttpError } from '../lib/http-error.js';
import { openEventStream } from '../lib/event-stream.js';
import { notifyUserStatusChanged, userEvents } from '../lib/user-events.js';
import { requireAuth } from '../middleware/require-auth.js';
import { requireAdmin } from '../middleware/require-admin.js';
import { UserModel, UserStatus, toPublicUser } from '../models/user.js';

const updateStatusSchema = z.object({
  isActive: z.union([
    z.literal(UserStatus.Rejected),
    z.literal(UserStatus.Active),
    z.literal(UserStatus.Deactivated),
  ]),
});

/** Status changes an admin may make. Rejected is final. */
const ALLOWED_TRANSITIONS: Record<number, number[]> = {
  [UserStatus.Pending]: [UserStatus.Active, UserStatus.Rejected],
  [UserStatus.Active]: [UserStatus.Deactivated],
  [UserStatus.Deactivated]: [UserStatus.Active],
  [UserStatus.Rejected]: [],
};

export const usersRouter = Router();

usersRouter.use(requireAuth, requireAdmin);

usersRouter.get('/', async (_req, res) => {
  const users = await UserModel.find().sort({ createdAt: -1 });

  res.json({
    users: users.map((user) => ({ ...toPublicUser(user), createdAt: user.createdAt })),
  });
});

usersRouter.patch('/:id/status', async (req, res) => {
  const { isActive } = updateStatusSchema.parse(req.body);

  const user = mongoose.isValidObjectId(req.params.id)
    ? await UserModel.findById(req.params.id)
    : null;

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  if (user.role === 'admin') {
    throw new HttpError(400, "Admin accounts can't be changed");
  }

  if (!ALLOWED_TRANSITIONS[user.isActive]?.includes(isActive)) {
    throw new HttpError(409, 'This status change is not allowed');
  }

  user.isActive = isActive;
  await user.save();

  notifyUserStatusChanged(user.id);

  res.json({ user: { ...toPublicUser(user), createdAt: user.createdAt } });
});

function countPendingUsers() {
  return UserModel.countDocuments({ role: 'user', isActive: UserStatus.Pending });
}

usersRouter.get('/pending-count', async (_req, res) => {
  res.json({ count: await countPendingUsers() });
});

/** Server-Sent Events: pushes `{ pendingCount }` on connect and whenever users change. */
usersRouter.get('/events', async (req, res) => {
  const send = async () => {
    try {
      stream.send('users', { pendingCount: await countPendingUsers() });
    } catch (error) {
      console.error('Failed to send user event:', error);
    }
  };

  const stream = openEventStream(req, res, () => {
    userEvents.off('changed', send);
  });

  userEvents.on('changed', send);

  await send();
});
