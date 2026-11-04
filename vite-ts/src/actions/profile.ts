import type { SWRConfiguration } from 'swr';
import type { IProfile } from 'src/types/profile';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

type ProfileData = {
  profile: IProfile;
};

export function useGetProfile() {
  const url = endpoints.profile;

  const { data, isLoading, error } = useSWR<ProfileData>(url, fetcher, { ...swrOptions });

  const memoizedValue = useMemo(
    () => ({
      profile: data?.profile,
      profileLoading: isLoading,
      profileError: error as Error | undefined,
    }),
    [data?.profile, error, isLoading]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/** Replaces the whole profile, then updates the cached copy with what the server saved. */
export async function updateProfile(profile: Omit<IProfile, 'updatedAt'>) {
  const res = await axios.put<ProfileData>(endpoints.profile, profile);

  await mutate(endpoints.profile, res.data, { revalidate: false });

  return res.data.profile;
}
