import type { AuthState } from '../../types';

import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import { paths } from 'src/routes/paths';

import axios, { endpoints } from 'src/lib/axios';
import { subscribeToEvents } from 'src/lib/event-stream';

import { AuthContext } from '../auth-context';
import { setSession, isValidToken } from './utils';
import { JWT_STORAGE_KEY, SESSION_ENDED_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

/**
 * NOTE:
 * We only build demo at basic level.
 * Customer will need to do some extra handling yourself if you want to extend the logic and other features...
 */

type Props = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: Props) {
  const { state, setState } = useSetState<AuthState>({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = sessionStorage.getItem(JWT_STORAGE_KEY);

      if (accessToken && isValidToken(accessToken)) {
        setSession(accessToken);

        const res = await axios.get(endpoints.auth.me);

        const { user } = res.data;

        setState({ user: { ...user, accessToken }, loading: false });
      } else {
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isRegularUser = state.user?.role === 'user';

  // Signs a regular user out as soon as an admin deactivates them. Admins can't be blocked.
  useEffect(() => {
    if (!isRegularUser) return undefined;

    const controller = new AbortController();

    const endSession = (message = 'Your session has ended. Please sign in again.') => {
      controller.abort();
      sessionStorage.setItem(SESSION_ENDED_STORAGE_KEY, message);
      setSession(null);
      // Full reload, so no state from the old session survives.
      window.location.href = paths.auth.jwt.signIn;
    };

    subscribeToEvents(endpoints.auth.events, {
      signal: controller.signal,
      onEvent: (event, data) => {
        if (event !== 'session-ended') return;

        try {
          endSession((JSON.parse(data) as { message?: string }).message);
        } catch {
          endSession();
        }
      },
      onRejected: (status, message) => endSession(message),
    });

    return () => controller.abort();
  }, [isRegularUser]);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user ? { ...state.user, role: state.user?.role ?? 'admin' } : null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext value={memoizedValue}>{children}</AuthContext>;
}
