import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';

/** Values stored in `isActive`. */
export const UserStatus = {
  Rejected: -1,
  Pending: 0,
  Active: 1,
  Deactivated: 2,
} as const;

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    isActive: {
      type: Number,
      required: true,
      enum: Object.values(UserStatus),
      default: UserStatus.Pending,
    },
  },
  { timestamps: true }
);

export type User = InferSchemaType<typeof userSchema>;
export type UserDocument = HydratedDocument<User>;

export const UserModel = model('User', userSchema);

const BLOCKED_MESSAGES: Partial<Record<number, string>> = {
  [UserStatus.Pending]: 'Your account has not been approved yet',
  [UserStatus.Rejected]: 'Your account request has been rejected',
  [UserStatus.Deactivated]: 'Your account has been deactivated',
};

/** Why this user may not use the app, or undefined if they may. Admins are never blocked. */
export function getBlockedMessage(user: Pick<User, 'role' | 'isActive'>) {
  return user.role === 'admin' ? undefined : BLOCKED_MESSAGES[user.isActive];
}

/** Shape returned to the frontend (matches the fields Minimal UI reads from `user`). */
export function toPublicUser(user: UserDocument) {
  return {
    id: user.id as string,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: `${user.firstName} ${user.lastName}`,
    role: user.role,
    isActive: user.isActive,
  };
}
