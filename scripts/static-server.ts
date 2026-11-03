/** Minimal static server with SPA fallback for the exported web build (dist/). */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.wav': 'audio/wav',
  '.map': 'application/json',
};

export function serveDist(dir: string, port: number): Promise<Server> {
  const root = resolve(dir);
  const server = createServer((req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      // Prevent path traversal: only files strictly inside root are served.
      const target = normalize(join(root, decodeURIComponent(url.pathname)));
      const inside = target === root || target.startsWith(root + sep);
      const file =
        inside && existsSync(target) && statSync(target).isFile()
          ? target
          : join(root, 'index.html');
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
      createReadStream(file).pipe(res);
    } catch {
      res.writeHead(400);
      res.end('Bad request');
    }
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => ok(server)));
}
