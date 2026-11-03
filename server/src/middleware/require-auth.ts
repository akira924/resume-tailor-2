import type { Request, Response, NextFunction } from 'express';

import { HttpError } from '../lib/http-error.js';
import { verifyAccessToken } from '../lib/jwt.js';
import { UserModel, getBlockedMessage } from '../models/user.js';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

/**
 * Checks the token, then the user's status in the database, so deactivating
 * a user ends their session on their next request instead of when the token expires.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Authorization token missing');
  }

  let userId: string;
  try {
    userId = verifyAccessToken(token);
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }

  const user = await UserModel.findById(userId).select('role isActive');

  if (!user) {
    throw new HttpError(401, 'User no longer exists');
  }

  const blockedMessage = getBlockedMessage(user);
  if (blockedMessage) {
    throw new HttpError(401, blockedMessage);
  }

  req.userId = userId;

  next();
}
