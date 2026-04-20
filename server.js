import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { randomUUID } from 'crypto';

const WS_PORT = process.env.WS_PORT || process.env.PORT || 3001; // Render auto-assign karta hai PORT
// const HTTP_PORT = process.env.HTTP_PORT || 8080;

const pending = new Map(); // reqId → { res, timer }
const tunnels = new Set(); // connected tunnel clients

// ── HTTP Server ───────────────────────────────────────────────────────────────
// Note: Render pe ek hi port hota hai, isliye WS aur HTTP dono ek hi server pe
const httpServer = http.createServer((req, res) => {
  const ws = [...tunnels].find(t => t.readyState === WebSocket.OPEN);

  if (!ws) {
    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('502 — No tunnel client connected');
    return;
  }

  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const id = randomUUID();

    const timer = setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        res.writeHead(504, { 'content-type': 'text/plain' });
        res.end('504 — Tunnel timeout');
      }
    }, 30_000);

    pending.set(id, { res, timer });

    ws.send(JSON.stringify({
      id,
      method: req.method,
      path: req.url,
      headers: req.headers,
      body: Buffer.concat(chunks).toString('base64'),
    }));
  });
});

// Render ke liye: WS aur HTTP ek hi port pe
httpServer.listen(WS_PORT, () =>
  console.log(`[server] Listening on :${WS_PORT}`)
);

httpServer.on("request", (req, res) => {
  console.log("HTTP HIT:", req.url);

  res.writeHead(200, { "content-type": "text/plain" });
  res.end("Server is running");
});

// WS ko httpServer pe attach karo
const wss2 = new WebSocketServer({ server: httpServer });

wss2.on('connection', (ws) => {
  tunnels.add(ws);
  console.log(`[+] Tunnel connected  (active: ${tunnels.size})`);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    const entry = pending.get(msg.id);
    if (!entry) return;

    clearTimeout(entry.timer);
    pending.delete(msg.id);

    const body = Buffer.from(msg.body ?? '', 'base64');
    entry.res.writeHead(msg.status ?? 200, msg.headers ?? {});
    entry.res.end(body);
  });

  ws.on('close', () => {
    tunnels.delete(ws);
    console.log(`[-] Tunnel disconnected (active: ${tunnels.size})`);
  });
});