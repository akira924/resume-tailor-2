import type { Request, Response, NextFunction } from 'express';

import { HttpError } from '../lib/http-error.js';
import { UserModel } from '../models/user.js';

/** Use after `requireAuth`. Checks the role in the database, not the token, so demotions apply immediately. */
export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const user = await UserModel.findById(req.userId).select('role');

  if (!user) {
    throw new HttpError(401, 'User no longer exists');
  }

  if (user.role !== 'admin') {
    throw new HttpError(403, 'Admin access required');
  }

  next();
}
