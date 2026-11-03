import { CONFIG } from 'src/global-config';

import { JWT_STORAGE_KEY } from 'src/auth/context/jwt/constant';

// ----------------------------------------------------------------------

const RECONNECT_DELAY_MS = 5000;

type SubscribeOptions = {
  signal: AbortSignal;
  onEvent: (event: string, data: string) => void;
  /** The server refused the stream (401/403). It is not retried. */
  onRejected?: (status: number, message?: string) => void;
};

/**
 * Reads a Server-Sent Events stream and reconnects when it drops, until `signal` aborts.
 * Uses fetch rather than EventSource so the JWT goes in the Authorization header
 * instead of the URL.
 */
export async function subscribeToEvents(
  path: string,
  { signal, onEvent, onRejected }: SubscribeOptions
) {
  const handleEvent = (rawEvent: string) => {
    const lines = rawEvent.split('\n');
    const field = (name: string) =>
      lines
        .find((line) => line.startsWith(`${name}:`))
        ?.slice(name.length + 1)
        .trim();

    const data = field('data');
    if (data) onEvent(field('event') ?? 'message', data);
  };

  while (!signal.aborted) {
    try {
      const res = await fetch(`${CONFIG.serverUrl}${path}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem(JWT_STORAGE_KEY)}` },
        signal,
      });

      // Retrying won't help.
      if (res.status === 401 || res.status === 403) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        onRejected?.(res.status, body?.message);
        return;
      }

      if (!res.ok || !res.body) {
        throw new Error(`Event stream request failed with status ${res.status}`);
      }

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = '';

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value.replace(/\r\n/g, '\n');

        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          handleEvent(buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf('\n\n');
        }
      }
    } catch (error) {
      if (signal.aborted) return;
      console.error(error);
    }

    // Server restarted or the connection dropped: try again shortly.
    await new Promise((resolve) => {
      const timer = setTimeout(resolve, RECONNECT_DELAY_MS);
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          resolve(undefined);
        },
        { once: true }
      );
    });
  }
}
