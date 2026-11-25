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
  const scripts = [...ui.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
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


test('saved drafts safely handle invalid browser storage shapes', () => {
  const match = ui.match(/function saved\(\)\{[\s\S]*?\}\}/);
  assert.ok(match, 'saved() helper exists');
  for (const [raw, expected] of [
    ['null', 0], ['{}', 0], ['not json', 0],
    ['[null,3,{"type":"Draft","text":"ok"},{"type":"Bad"}]', 1]
  ]) {
    const sandbox = { localStorage: { getItem: () => raw } };
    vm.runInNewContext(match[0] + ';result=saved()', sandbox);
    assert.equal(sandbox.result.length, expected);
  }
});


test('account controls stay disabled until real Supabase initialization', () => {
  assert.match(ui, /id="auth-login" type="button" disabled/);
  assert.match(ui, /id="auth-signup" type="button" disabled/);
  assert.match(ui, /authClient\.auth\.onAuthStateChange\([\s\S]*?\$\('auth-login'\)\.disabled=false;\$\('auth-signup'\)\.disabled=false/);
  assert.match(ui, /if\(!AUTH_CONFIG\.url\|\|!AUTH_CONFIG\.anonKey\)/);
});

test('public configuration rejects privileged keys and invalid project URLs', () => {
  const configSource = readFileSync(new URL('../api/public-config.js', import.meta.url), 'utf8');
  const jwt = role => 'header.' + Buffer.from(JSON.stringify({role})).toString('base64url') + '.signature';
  const run = (url, key, method = 'GET') => {
    const ctx = { module: {exports:{}}, Buffer, process: {env:{SUPABASE_URL:url,SUPABASE_PUBLISHABLE_KEY:key}} };
    vm.runInNewContext(configSource.replace('export default function handler', 'module.exports.handler = function handler'), ctx);
    let status, payload;
    const headers = {};
    ctx.module.exports.handler({method}, {setHeader(k,v){headers[k]=v},status(n){status=n;return this},json(v){payload=v}});
    return {status,payload,headers};
  };
  const url = 'https://example.supabase.co';
  for (const key of ['sb_secret_example', jwt('service_role'), 'unknown', '']) {
    const r = run(url,key);
    assert.equal(r.payload.supabasePublishableKey,'');
    assert.equal(r.payload.supabaseUrl,'');
  }
  for (const badUrl of ['http://example.supabase.co','https://example.supabase.co.evil.test','https://example.supabase.co/path']) {
    assert.equal(run(badUrl,'sb_publishable_example').payload.supabaseUrl,'');
  }
  for (const key of ['sb_publishable_example',jwt('anon')]) {
    const r = run(url,key);
    assert.equal(r.status,200);
    assert.equal(r.payload.supabasePublishableKey,key);
    assert.equal(r.headers['Cache-Control'],'no-store');
  }
  assert.equal(run(url,'sb_publishable_example','POST').status,405);
});
