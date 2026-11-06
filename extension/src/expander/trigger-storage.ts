import type { TriggerStorageKey } from './types';

// ----------------------------------------------------------------------

const STORAGE_KEY: TriggerStorageKey = 'promptTrigger';

export const DEFAULT_TRIGGER = __DEFAULT_PROMPT_TRIGGER__;

/** At least 2 characters, or it would fire constantly. Without spaces, so it can follow a space. */
export const isValidTrigger = (trigger: string) => /^\S{2,20}$/.test(trigger);

export async function getTrigger() {
  const stored = await chrome.storage.sync.get(STORAGE_KEY);

  return (stored[STORAGE_KEY] as string | undefined) ?? DEFAULT_TRIGGER;
}

export const setTrigger = (trigger: string) => chrome.storage.sync.set({ [STORAGE_KEY]: trigger });
