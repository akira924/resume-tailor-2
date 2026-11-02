import type { Request, Response, NextFunction } from 'express';

import { HttpError } from '../lib/http-error.js';
import { verifyAccessToken } from '../lib/jwt.js';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Authorization token missing');
  }

  try {
    req.userId = verifyAccessToken(token);
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }

  next();
}
