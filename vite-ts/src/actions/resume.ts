import type { ResumeSettings } from 'src/sections/resume/resume-settings';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

export type SavedResume = {
  /** The editor's JSON object, exactly as saved. */
  data: Record<string, unknown>;
  settings: Partial<ResumeSettings>;
  updatedAt: string;
};

type ResumeData = {
  resume: SavedResume | null;
};

/**
 * Refetches on every mount and reports loading until that finishes, so the editor never
 * starts from a cached copy that was since changed in another tab or on another device.
 */
export function useGetResume() {
  const { data, isLoading, isValidating, error } = useSWR<ResumeData>(endpoints.resume, fetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const memoizedValue = useMemo(
    () => ({
      resume: data?.resume ?? null,
      resumeLoading: isLoading || isValidating,
      resumeError: error as Error | undefined,
    }),
    [data?.resume, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

/** Replaces the whole resume, then updates the cached copy with what the server saved. */
export async function updateResume(resume: Pick<SavedResume, 'data' | 'settings'>) {
  const res = await axios.put<ResumeData>(endpoints.resume, resume);

  await mutate(endpoints.resume, res.data, { revalidate: false });
}
