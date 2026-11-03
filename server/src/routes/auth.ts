import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { config } from '../config.js';
import { HttpError } from '../lib/http-error.js';
import { signAccessToken } from '../lib/jwt.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { openEventStream } from '../lib/event-stream.js';
import { notifyUsersChanged, userEvents } from '../lib/user-events.js';
import { requireAuth } from '../middleware/require-auth.js';
import { UserModel, getBlockedMessage, toPublicUser } from '../models/user.js';

const email = z.string().trim().toLowerCase().pipe(z.email('Email must be a valid email address'));

const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

const signUpSchema = z.object({
  email,
  // bcrypt only uses the first 72 bytes
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
  firstName: z.string().trim().min(1, 'First name is required').max(50),
  lastName: z.string().trim().min(1, 'Last name is required').max(50),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => config.NODE_ENV === 'test',
  message: { message: 'Too many attempts, please try again later' },
});

export const authRouter = Router();

authRouter.post('/sign-in', authLimiter, async (req, res) => {
  const { email, password } = signInSchema.parse(req.body);

  const user = await UserModel.findOne({ email }).select('+passwordHash');
  const valid = await verifyPassword(password, user?.passwordHash);

  if (!user || !valid) {
    throw new HttpError(401, 'Invalid email or password');
  }

  // Checked only after the password matches, so this doesn't reveal which emails exist.
  const blockedMessage = getBlockedMessage(user);
  if (blockedMessage) {
    throw new HttpError(403, blockedMessage);
  }

  res.json({ accessToken: signAccessToken(user.id), user: toPublicUser(user) });
});

authRouter.post('/sign-up', authLimiter, async (req, res) => {
  const { email, password, firstName, lastName } = signUpSchema.parse(req.body);

  if (await UserModel.exists({ email })) {
    throw new HttpError(409, 'An account with this email already exists');
  }

  try {
    const user = await UserModel.create({
      email,
      firstName,
      lastName,
      passwordHash: await hashPassword(password),
    });

    notifyUsersChanged();

    // No token here: the user must sign in after registering.
    res.status(201).json({ user: toPublicUser(user) });
  } catch (error) {
    // Unique index race: two sign-ups with the same email at once.
    if ((error as { code?: number }).code === 11000) {
      throw new HttpError(409, 'An account with this email already exists');
    }
    throw error;
  }
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const user = await UserModel.findById(req.userId);

  if (!user) {
    throw new HttpError(401, 'User no longer exists');
  }

  res.json({ user: toPublicUser(user) });
});

/**
 * Server-Sent Events for the signed-in user. Sends `session-ended` and closes the stream
 * as soon as an admin blocks this account, so the client can sign out straight away.
 */
authRouter.get('/events', requireAuth, (req, res) => {
  const onStatusChanged = async (userId: string) => {
    if (userId !== req.userId) return;

    try {
      const user = await UserModel.findById(userId).select('role isActive');
      const message = user ? getBlockedMessage(user) : 'User no longer exists';

      if (message) {
        stream.send('session-ended', { message });
        stream.close();
      }
    } catch (error) {
      console.error('Failed to check user status:', error);
    }
  };

  const stream = openEventStream(req, res, () => {
    userEvents.off('statusChanged', onStatusChanged);
  });

  userEvents.on('statusChanged', onStatusChanged);
});
