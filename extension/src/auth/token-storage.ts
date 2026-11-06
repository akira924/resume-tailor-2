const TOKEN_KEY = 'accessToken';

// ----------------------------------------------------------------------

// chrome.storage.local rather than sessionStorage: the panel's page is destroyed each time it is
// closed and the token has to survive that. It is also shared by the panels of all windows.
export async function getToken(): Promise<string | null> {
  const stored = await chrome.storage.local.get(TOKEN_KEY);

  return (stored[TOKEN_KEY] as string | undefined) ?? null;
}

export const setToken = (token: string) => chrome.storage.local.set({ [TOKEN_KEY]: token });

export const clearToken = () => chrome.storage.local.remove(TOKEN_KEY);

export function subscribeToToken(listener: () => void) {
  const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area === 'local' && TOKEN_KEY in changes) listener();
  };

  chrome.storage.onChanged.addListener(onChanged);

  return () => chrome.storage.onChanged.removeListener(onChanged);
}
