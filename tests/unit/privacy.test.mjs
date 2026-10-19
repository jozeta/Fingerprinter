// Local-only data handling: static scan of the shipped source for network APIs, dynamic code execution and third-party URLs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('../../', import.meta.url).pathname;
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const jsFiles = walk(path.join(root, 'js')).filter((f) => f.endsWith('.js'));
const read = (f) => fs.readFileSync(f, 'utf8');

test('no network APIs except same-origin catalogue loading in main.js', () => {
  for (const f of jsFiles) {
    const src = read(f);
    for (const pat of [/XMLHttpRequest/, /sendBeacon/, /new WebSocket/, /EventSource/, /\.src\s*=\s*['"`]https?:/, /importScripts/]) assert.doesNotMatch(src, pat, `${f}: ${pat}`);
    const fetches = src.match(/\bfetch\(/g) || [];
    if (path.basename(f) === 'main.js') assert.equal(fetches.length, 1, 'main.js should fetch only via loadJSON');
    else assert.equal(fetches.length, 0, `${f} must not call fetch`);
  }
  assert.match(read(path.join(root, 'js/main.js')), /loadJSON\('data\/sources\.json'\), loadJSON\('data\/entities\.json'\)/);
});

test('no STUN/TURN servers or third-party endpoints in code', () => {
  for (const f of jsFiles) {
    const src = read(f);
    assert.doesNotMatch(src, /stun:|turn:/i, f);
    assert.doesNotMatch(src.replace(/https?:\/\/[^\s'"`]*/g, (u) => (u.startsWith('http') ? 'URL' : u)), /ipwho|ipify|ipinfo/i, f);
  }
  const rtc = read(path.join(root, 'js/tests/apis.js'));
  assert.match(rtc, /iceServers: \[\]/);
});

test('no eval or dynamic code execution', () => {
  for (const f of jsFiles) assert.doesNotMatch(read(f), /\beval\s*\(|new Function\s*\(|setTimeout\(\s*['"`]/, f);
});

test('index.html loads only self-hosted assets and declares a restrictive CSP', () => {
  const html = read(path.join(root, 'index.html'));
  assert.doesNotMatch(html.replace(/<!--[\s\S]*?-->/g, ''), /(src|href)="https?:/);
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /connect-src 'self'/);
  assert.match(html, /script-src 'self'/);
  assert.doesNotMatch(html, /script-src[^;]*unsafe-inline/);
});

test('localStorage is touched only by store.js, the storage probe and the learning exercise cleanup', () => {
  const allowed = ['store.js', 'storage.js', 'learn.js'];
  for (const f of jsFiles) if (/localStorage\.setItem/.test(read(f))) assert.ok(allowed.includes(path.basename(f)), f);
  const probe = read(path.join(root, 'js/tests/storage.js'));
  assert.match(probe, /removeItem\(TEMP_KEY\)/); assert.match(probe, /deleteDatabase\(TEMP_DB\)/); assert.match(probe, /caches\.delete\(TEMP_CACHE\)/);
});

test('served file names avoid content-blocker filter patterns', () => {
  // Filter lists (EasyPrivacy etc.) block URLs like /fingerprint.js; a blocked module breaks the whole app (ERR_BLOCKED_BY_CLIENT).
  const served = [...walk(path.join(root, 'js')), ...walk(path.join(root, 'css')), ...walk(path.join(root, 'data'))].map((f) => path.relative(root, f));
  for (const f of served) assert.doesNotMatch(f, /fingerprint|track|analytic|telemetry|beacon|pixel|metric|banner|\bads?\b|adserv|collect/i, f);
});

test('behavioral listeners exist only in the Learning Center lab widgets', () => {
  for (const f of jsFiles) {
    const src = read(f);
    if (/addEventListener\(['"](pointermove|mousemove|keydown|keyup)/.test(src)) assert.equal(path.basename(f), 'learn.js', f);
  }
});
