import { EventEmitter } from 'node:events';

/**
 * In-process notifications for changes to the users collection made through this API.
 * Only reaches clients connected to the same server process, and does not see edits
 * made directly in MongoDB.
 *
 * - `changed`: any user was added or updated.
 * - `statusChanged` (userId): that user's `isActive` changed.
 */
export const userEvents = new EventEmitter();

// One listener per open event stream.
userEvents.setMaxListeners(0);

export function notifyUsersChanged() {
  userEvents.emit('changed');
}

export function notifyUserStatusChanged(userId: string) {
  userEvents.emit('statusChanged', userId);
  userEvents.emit('changed');
}
