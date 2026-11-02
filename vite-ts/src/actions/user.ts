import type { SWRConfiguration } from 'swr';
import type { IUserListItem } from 'src/types/user';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

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
  const url = endpoints.users;

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
