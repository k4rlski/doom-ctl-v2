/**
 * doom-ctl — WebSocket Backend
 * Node.js + ws + ssh2
 * Receives tool exec requests, SSHes to correct server, streams output back
 */

'use strict';

const WebSocket = require('ws');
const yaml      = require('js-yaml');
const fs        = require('fs');
const path      = require('path');
const { Client } = require('ssh2');

// ── Config ──────────────────────────────────────────────────────────────────
const CONFIG_FILE = path.join(__dirname, '../config/doom-ctl.yml');
let config;
try {
  config = yaml.load(fs.readFileSync(CONFIG_FILE, 'utf8'));
} catch (e) {
  console.error('[server] Failed to load config:', e.message);
  process.exit(1);
}

const PORT  = config.server?.port  || 3666;
const TOKEN = config.auth?.token   || 'changeme';
const TOOLS = config.tools  || {};
const SERVERS = config.servers || {};

// ── SSH connection pool ──────────────────────────────────────────────────────
const sshPool = {};

function getSSH(serverName) {
  return new Promise((resolve, reject) => {
    const serverCfg = SERVERS[serverName];
    if (!serverCfg) return reject(new Error(`Unknown server: ${serverName}`));

    const conn = new Client();
    conn.on('ready', () => resolve(conn));
    conn.on('error', reject);
    conn.connect({
      host:       serverCfg.host,
      port:       serverCfg.port || 22,
      username:   serverCfg.user || 'root',
      privateKey: fs.readFileSync(
        serverCfg.key.replace('~', process.env.HOME)
      ),
      readyTimeout: 8000,
    });
  });
}

// ── Execute tool command ─────────────────────────────────────────────────────
async function execTool(toolName, userCmd, ws) {
  const toolCfg = TOOLS[toolName];
  if (!toolCfg) {
    sendMsg(ws, { type: 'error', message: `Unknown tool: ${toolName}` });
    return;
  }

  const serverName = toolCfg.server;
  const prefix     = toolCfg.cmd_prefix || toolName;

  // Sanitize: strip shell metacharacters from user input
  const safe = userCmd.replace(/[;&|`$\\<>{}]/g, '');
  const fullCmd = `${prefix} ${safe}`.trim();

  sendMsg(ws, { type: 'stdout', data: `\r\n` });

  let conn;
  try {
    conn = await getSSH(serverName);
  } catch (e) {
    sendMsg(ws, { type: 'stderr', data: `SSH error: ${e.message}\n` });
    sendMsg(ws, { type: 'exit', code: 1 });
    return;
  }

  conn.exec(fullCmd, (err, stream) => {
    if (err) {
      sendMsg(ws, { type: 'stderr', data: `Exec error: ${err.message}\n` });
      sendMsg(ws, { type: 'exit', code: 1 });
      conn.end();
      return;
    }

    stream.on('data', data => {
      sendMsg(ws, { type: 'stdout', data: data.toString() });
    });

    stream.stderr.on('data', data => {
      sendMsg(ws, { type: 'stderr', data: data.toString() });
    });

    stream.on('close', (code) => {
      sendMsg(ws, { type: 'exit', code: code ?? 0 });
      conn.end();
    });
  });
}

// ── WebSocket server ─────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ port: PORT, host: '127.0.0.1' });

wss.on('connection', (ws, req) => {
  // Token auth from query string: ws://localhost:3666/?token=xxx
  const url = new URL(req.url, 'http://localhost');
  const tok = url.searchParams.get('token');
  if (tok !== TOKEN) {
    ws.send(JSON.stringify({ type: 'error', message: 'unauthorized' }));
    ws.close(4001, 'Unauthorized');
    return;
  }

  console.log('[server] client connected');

  ws.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw); }
    catch { return; }

    switch (msg.type) {
      case 'exec':
        console.log(`[server] exec: ${msg.tool} "${msg.cmd}"`);
        execTool(msg.tool, msg.cmd, ws);
        break;

      case 'status':
        // Query MARS for tool health
        queryMarsStatus(msg.tool, ws);
        break;

      case 'ping':
        sendMsg(ws, { type: 'pong' });
        break;

      // Multiplayer: broadcast player position to all other clients
      case 'chat':
        // Relay chat to ALL players including sender (group chat)
        broadcastAll({ type: 'chat', id: msg.id, char: msg.char, text: msg.text });
        break;

      case 'player':
        ws._playerId = msg.id; // remember for disconnect cleanup
        console.log('[mp] player update from', msg.id, 'clients:', wss.clients.size);
        ws._playerChar = msg.char || 'silie';
        broadcastExcept(ws, { type: 'player', id: msg.id, x: msg.x, y: msg.y, z: msg.z, angle: msg.angle, char: msg.char, fo: msg.fo });
        break;

      default:
        console.warn('[server] unknown message type:', msg.type);
    }
  });

  ws.on('close', () => {
    console.log('[server] client disconnected');
    // Notify remaining players this client left
    if (ws._playerId) {
      broadcastExcept(ws, { type: 'player_left', id: ws._playerId });
    }
  });
});

// ── MARS status query ────────────────────────────────────────────────────────
async function queryMarsStatus(toolName, ws) {
  const marsUrl = config.mars?.url;
  if (!marsUrl) return;
  try {
    const resp = await fetch(`${marsUrl}/api/status/${toolName}`);
    const data = await resp.json();
    sendMsg(ws, { type: 'status', tool: toolName, state: data.state, color: data.color });
  } catch(e) {
    sendMsg(ws, { type: 'status', tool: toolName, state: 'unknown', color: 'dark' });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function sendMsg(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

function broadcastExcept(sender, obj) {
  const msg = JSON.stringify(obj);
  wss.clients.forEach(client => {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

function broadcastAll(obj) {
  const msg = JSON.stringify(obj);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

console.log(`[doom-ctl server] listening on ws://127.0.0.1:${PORT}`);
