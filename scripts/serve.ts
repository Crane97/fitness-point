/** Serves the exported web build: `npx tsx scripts/serve.ts [port]` (used by Playwright E2E). */
import { serveDist } from './static-server';

const port = Number(process.argv[2] ?? 4174);
void serveDist('dist', port).then(() => console.log(`Serving dist/ on http://127.0.0.1:${port}`));
