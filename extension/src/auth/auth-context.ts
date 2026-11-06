import type { User, SignUpParams } from './api';

import { use, createContext } from 'react';

// ----------------------------------------------------------------------

export type Session =
  | { status: 'loading' }
  | { status: 'authenticated'; user: User }
  /** `message` says why a previous session ended, if one did. */
  | { status: 'unauthenticated'; message: string | null }
  /** Has a token, but the server couldn't confirm it. */
  | { status: 'unreachable'; message: string };

export type AuthContextValue = Session & {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const context = use(AuthContext);

  if (!context) throw new Error('useAuth must be used inside AuthProvider');

  return context;
}
