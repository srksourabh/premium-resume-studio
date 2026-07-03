#!/usr/bin/env node
// Zero-dependency HTTP render service — wraps build_resume.js so any HTTP client
// (Google Apps Script, n8n/Zapier/Make, a serverless function, another backend)
// can POST a profile and get back the designed PDF + editable DOCX/ODT + the
// Model Council score. Uses only Node built-ins; deploy on Cloud Run, Render,
// Fly, a VM, or run locally.
//
//   node server/render-server.js                 # listens on :8787
//   PORT=3000 RENDER_TOKEN=secret node server/render-server.js
//
//   POST /render   { "profile": {...}, "formats": ["pdf","docx","odt","ats"],
//                    "theme": "royal-emerald", "archetype": "executive",
//                    "threshold": 85, "maxPages": 2, "fit": true }
//     → { pdf_base64, docx_base64, odt_base64, ats, cover, classification, council, pages }
//   GET  /health   → { ok: true }
//
// Auth: if RENDER_TOKEN is set, requests must send  Authorization: Bearer <token>.

'use strict';

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

const PORT = process.env.PORT || 8787;
const TOKEN = process.env.RENDER_TOKEN || '';
const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'scripts', 'build_resume.js');
const MAX_BODY = 2 * 1024 * 1024; // 2 MB

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '', size = 0;
    req.on('data', (c) => { size += c.length; if (size > MAX_BODY) { reject(new Error('body too large')); req.destroy(); } else data += c; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function run(args) {
  return new Promise((resolve) => {
    const p = spawn('node', [BUILD, ...args], { cwd: ROOT });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => resolve({ code, out, err }));
  });
}

async function render(body) {
  const profile = body.profile;
  if (!profile || !profile.identity || !profile.identity.name) throw new Error('profile.identity.name is required');
  const formats = new Set((body.formats || ['pdf', 'docx', 'odt', 'ats']).map((s) => String(s).toLowerCase()));

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'prs-'));
  const base = path.join(dir, 'resume');
  const profPath = base + '.json';
  const outPdf = base + '.pdf';
  fs.writeFileSync(profPath, JSON.stringify(profile));

  const args = ['--profile', profPath, '--out', outPdf, '--json'];
  if (formats.has('docx')) args.push('--docx');
  if (formats.has('odt')) args.push('--odt');
  if (formats.has('ats')) args.push('--ats');
  if (body.cover) args.push('--cover');
  if (body.theme) args.push('--theme', String(body.theme));
  if (body.archetype) args.push('--archetype', String(body.archetype));
  if (body.threshold) args.push('--threshold', String(body.threshold));
  if (body.maxPages) args.push('--max-pages', String(body.maxPages));
  if (body.fit === false) args.push('--no-fit');
  if (!formats.has('pdf')) args.push('--score-only'); // skip Chromium if no PDF wanted

  const { code, out, err } = await run(args);

  let meta = {};
  try { meta = JSON.parse(out.slice(out.indexOf('{'))); } catch (_) { /* banner text precedes JSON only w/o --json edge cases */ }

  const b64 = (f) => (fs.existsSync(f) ? fs.readFileSync(f).toString('base64') : null);
  const txt = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null);
  const result = {
    ok: code === 0 || (meta.council && !meta.council.passed), // non-pass is still a valid render
    classification: meta.classification || null,
    council: meta.council || null,
    pages: meta.pages || null,
    theme: meta.theme || null,
    pdf_base64: formats.has('pdf') ? b64(outPdf) : null,
    docx_base64: formats.has('docx') ? b64(base + '.docx') : null,
    odt_base64: formats.has('odt') ? b64(base + '.odt') : null,
    ats: formats.has('ats') ? txt(base + '.ats.txt') : null,
    cover: body.cover ? txt(base + '.cover.txt') : null,
    stderr: code !== 0 ? err.slice(0, 500) : undefined,
  };

  fs.rmSync(dir, { recursive: true, force: true });
  return result;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, service: 'premium-resume-studio' }));
  }

  if (req.method === 'POST' && req.url === '/render') {
    if (TOKEN) {
      const auth = Buffer.from(req.headers.authorization || '');
      const want = Buffer.from(`Bearer ${TOKEN}`);
      const ok = auth.length === want.length && crypto.timingSafeEqual(auth, want);
      if (!ok) { res.writeHead(401, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ error: 'unauthorized' })); }
    }
    try {
      const body = JSON.parse((await readBody(req)) || '{}');
      const result = await render(body);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: String(e.message || e) }));
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found', try: 'POST /render or GET /health' }));
});

server.listen(PORT, () => console.log(`Premium Resume Studio render service on :${PORT}  (auth: ${TOKEN ? 'on' : 'off'})`));
