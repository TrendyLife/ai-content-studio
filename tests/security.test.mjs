// Run: node --test tests/security.test.mjs
// Uses Node built-ins only; no API keys, network requests, or paid services.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../api/generate.js', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const sandbox = { module: { exports: {} } };
vm.runInNewContext(source.replace('export default function handler', 'module.exports.handler = function handler'), sandbox);
const handler = sandbox.module.exports.handler;
function request(method) {
  const headers = {};
  let status = 200;
  let payload;
  const res = {
    setHeader(k, v) { headers[k] = v; },
    status(n) { status = n; return this; },
    json(obj) { payload = obj; return this; }
  };
  handler({ method, body: { topic: 'Example product' } }, res);
  return { status, payload, headers };
}

test('AI endpoint always fails closed on POST', () => {
  const r = request('POST');
  assert.equal(r.status, 503);
  assert.match(r.payload.error, /not available/i);
  assert.equal(r.headers['Cache-Control'], 'no-store');
});

test('AI endpoint rejects non-POST requests', () => {
  const r = request('GET');
  assert.equal(r.status, 405);
  assert.equal(r.headers.Allow, 'POST');
});

test('UI describes free planning, not paid video rendering', () => {
  assert.match(ui, /Product Video Studio/);
  assert.match(ui, /does not render an MP4/);
  assert.match(ui, /No paid rendering or charges/);
});

test('Both beginner video modes exist', () => {
  assert.match(ui, /value="choose">Choose a video type/);
  assert.match(ui, /value="describe">Describe my own idea/);
});

test('Auth is not enabled without Supabase public configuration', () => {
  assert.match(ui, /Account registration is not enabled yet/);
  assert.match(ui, /auth-signup'\)\.disabled=true/);
});


test('inline browser JavaScript parses without syntax errors', () => {
  const scripts = [...ui.matchAll(/<script\\b[^>]*>([\\s\\S]*?)<\\/script>/gi)]
    .map(match => match[1]).filter(code => code.trim());
  assert.ok(scripts.length > 0, 'Expected an inline application script');
  for (const script of scripts) assert.doesNotThrow(() => new vm.Script(script));
});

test('video planning keeps both input modes and does not call a paid renderer', () => {
  assert.match(ui, /id="video-method"/);
  assert.match(ui, /id="video-photo"/);
  assert.match(ui, /id="video-output"/);
  assert.match(ui, /does not generate an MP4/);
});
