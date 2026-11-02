import jwt, { type SignOptions } from 'jsonwebtoken';

import { config } from '../config.js';

const ALGORITHM = 'HS256';

export function signAccessToken(userId: string) {
  return jwt.sign({}, config.JWT_SECRET, {
    algorithm: ALGORITHM,
    subject: userId,
    expiresIn: config.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
}

/** Returns the user id from a valid token, or throws if invalid/expired. */
export function verifyAccessToken(token: string) {
  const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: [ALGORITHM] });

  if (typeof payload === 'string' || !payload.sub) {
    throw new Error('Invalid token payload');
  }

  return payload.sub;
}
