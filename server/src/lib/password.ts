import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

// Compared against when the email doesn't exist, so sign-in timing doesn't reveal registered emails.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', SALT_ROUNDS);

export function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string | undefined) {
  return bcrypt.compare(password, hash ?? DUMMY_HASH);
}
