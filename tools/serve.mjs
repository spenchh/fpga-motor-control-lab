/* ===========================================================================
   serve.mjs — local dev server

   Serves the static site and, if AI_GATEWAY_API_KEY is set, runs api/chat.js
   at /api/chat so the assistant behaves locally exactly as it does on Vercel.
   Without a key it returns 503, which is the same signal the client uses to
   fall back to its offline answers — so both paths are testable here.

   Run:  node tools/serve.mjs [port]
   =========================================================================== */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.argv[2] || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

let chatHandler = null;
try {
  chatHandler = (await import('../api/chat.js')).default;
} catch (err) {
  console.warn('api/chat.js did not load, /api/chat will 503:', err.message);
}

/* Node's IncomingMessage -> Web Request, so the same handler runs here and
   on Vercel without a second code path. */
async function toWebRequest(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  return new Request(`http://localhost:${PORT}${req.url}`, {
    method: req.method,
    headers: Object.entries(req.headers).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]),
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
  });
}

async function sendWebResponse(res, webRes) {
  res.writeHead(webRes.status, Object.fromEntries(webRes.headers));
  if (!webRes.body) { res.end(); return; }
  const reader = webRes.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(Buffer.from(value));
  }
  res.end();
}

createServer(async (req, res) => {
  try {
    if (req.url.split('?')[0] === '/api/chat') {
      if (!chatHandler) { res.writeHead(503).end('{"error":"no_handler"}'); return; }
      const webRes = await chatHandler(await toWebRequest(req));
      await sendWebResponse(res, webRes);
      return;
    }

    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const file = resolve(join(ROOT, p));
    if (!file.startsWith(resolve(ROOT))) { res.writeHead(403).end('forbidden'); return; }

    const buf = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(buf);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found');
  }
}).listen(PORT, '127.0.0.1', () => {
  const hasKey = !!(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
  console.log(`\n  http://localhost:${PORT}\n`);
  console.log(`  assistant: ${hasKey ? 'live model via AI Gateway' : 'offline mode (no AI_GATEWAY_API_KEY set)'}\n`);
});
