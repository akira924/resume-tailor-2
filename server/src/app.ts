import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { usersRouter } from './routes/users.js';
import { profileRouter } from './routes/profile.js';
import { HttpError } from './lib/http-error.js';
import { errorHandler } from './middleware/error-handler.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/profile', profileRouter);

  app.use(() => {
    throw new HttpError(404, 'Not found');
  });

  app.use(errorHandler);

  return app;
}
