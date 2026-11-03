import type { Request, Response } from 'express';

const HEARTBEAT_MS = 25_000;

/**
 * Starts a Server-Sent Events response. `onClose` runs once, whether the client
 * disconnects or the server calls `close()`.
 */
export function openEventStream(req: Request, res: Response, onClose: () => void) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  });

  // Send headers now, so the client knows the stream is open before the first event.
  res.flushHeaders();

  // Comment lines keep proxies from closing an idle connection.
  const heartbeat = setInterval(() => res.write(': ping\n\n'), HEARTBEAT_MS);

  let closed = false;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    onClose();
  };

  req.on('close', cleanup);

  return {
    send(event: string, data: unknown) {
      if (!closed) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    close() {
      cleanup();
      res.end();
    },
  };
}
