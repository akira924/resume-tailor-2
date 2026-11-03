import type { SWRConfiguration } from 'swr';
import type { IUserListItem } from 'src/types/user';

import useSWR, { mutate } from 'swr';
import { useMemo, useState, useEffect } from 'react';

import { subscribeToEvents } from 'src/lib/event-stream';
import axios, { fetcher, endpoints } from 'src/lib/axios';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

type UsersData = {
  users: IUserListItem[];
};

export function useGetUsers() {
  const url = endpoints.users.list;

  const { data, isLoading, error, isValidating } = useSWR<UsersData>(url, fetcher, {
    ...swrOptions,
  });

  const memoizedValue = useMemo(
    () => ({
      users: data?.users || [],
      usersLoading: isLoading,
      usersError: error as Error | undefined,
      usersValidating: isValidating,
      usersEmpty: !isLoading && !isValidating && !data?.users.length,
    }),
    [data?.users, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/** Approve (1), reject (-1), deactivate (2) or reactivate (1) a user, then refresh the list. */
export async function updateUserStatus(id: string, isActive: IUserListItem['isActive']) {
  await axios.patch(endpoints.users.status(id), { isActive });

  await mutate(endpoints.users.list);
}

// ----------------------------------------------------------------------

/**
 * Live count of users waiting for approval, pushed by the server over Server-Sent Events.
 * Only connects for admins. Each update also refreshes the user list.
 */
export function usePendingUsersCount() {
  const { user } = useAuthContext();

  const isAdmin = user?.role === 'admin';

  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) {
      setCount(0);
      return undefined;
    }

    const controller = new AbortController();

    subscribeToEvents(endpoints.users.events, {
      signal: controller.signal,
      onEvent: (event, data) => {
        if (event !== 'users') return;

        try {
          const { pendingCount } = JSON.parse(data) as { pendingCount: number };
          setCount(pendingCount);
          mutate(endpoints.users.list);
        } catch (error) {
          console.error('Invalid user event:', error);
        }
      },
    });

    return () => controller.abort();
  }, [isAdmin]);

  return count;
}
