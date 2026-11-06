import type { Session, AuthContextValue } from './auth-context';

import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import * as api from './api';
import { AuthContext } from './auth-context';
import { getToken, setToken, clearToken, subscribeToToken } from './token-storage';

// ----------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>({ status: 'loading' });

  const latestCheck = useRef(0);

  // The stored token is the single source of truth: signing in or out only changes the token,
  // and every open panel reacts to that here.
  const checkSession = useCallback(async () => {
    latestCheck.current += 1;
    const check = latestCheck.current;

    // Drops the answer if the token changed again while waiting for it.
    const settle = (next: Session) => {
      if (check === latestCheck.current) setSession(next);
    };

    const token = await getToken();

    if (!token) {
      // Keeps the reason when this runs because a rejected token was just cleared below.
      setSession((current) =>
        current.status === 'unauthenticated'
          ? current
          : { status: 'unauthenticated', message: null }
      );
      return;
    }

    try {
      const { user } = await api.getMe(token);

      settle({ status: 'authenticated', user });
    } catch (error) {
      const { message, status } = error as api.ApiError;

      if (status === 401) {
        // Expired, or an admin has blocked this account since it signed in.
        settle({ status: 'unauthenticated', message });
        await clearToken();
      } else {
        settle({ status: 'unreachable', message });
      }
    }
  }, []);

  useEffect(() => {
    checkSession();

    return subscribeToToken(checkSession);
  }, [checkSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...session,
      signIn: async (email, password) => {
        const { accessToken } = await api.signIn(email, password);

        await setToken(accessToken);
      },
      signUp: async (params) => {
        await api.signUp(params);
      },
      signOut: clearToken,
      retry: checkSession,
    }),
    [session, checkSession]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
