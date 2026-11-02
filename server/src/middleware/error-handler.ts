import type { Request, Response, NextFunction } from 'express';

import { ZodError } from 'zod';

import { HttpError } from '../lib/http-error.js';

// The frontend axios interceptor reads `error.response.data.message`.
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({ message: err.issues[0]?.message ?? 'Invalid request' });
    return;
  }

  // Malformed JSON body from express.json()
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ message: 'Invalid JSON body' });
    return;
  }

  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
}
