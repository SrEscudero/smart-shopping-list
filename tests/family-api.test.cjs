/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test'), assert = require('node:assert/strict');
const ts = require('typescript'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, f);
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shopping-family-test-'));
process.env.SHOPPING_DATA_DIR = directory;
const api = require('../app/api/family/route.ts');
test.after(() => fs.rmSync(directory, { recursive: true, force: true }));
const snapshot = { items: [], totalBudget: 50, month: 'Noviembre', currency: 'R$' };
const req = (method, body, token) => new Request('http://localhost/api/family', { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
test('family API persists data, requires invitation and prevents stale writes', async () => {
  assert.equal((await api.GET(req('GET'))).status, 401);
  const created = await api.POST(req('POST', snapshot)); assert.equal(created.status, 201);
  const { token } = await created.json();
  const update = await api.PUT(req('PUT', { revision: 1, snapshot: { ...snapshot, totalBudget: 70 } }, token));
  assert.equal(update.status, 200);
  const stale = await api.PUT(req('PUT', { revision: 1, snapshot }, token)); assert.equal(stale.status, 409);
  const current = await (await api.GET(req('GET', null, token))).json(); assert.equal(current.snapshot.totalBudget, 70);
  assert.equal(current.revision, 2);
  assert.equal((await api.DELETE(req('DELETE', null, token))).status, 200);
  assert.equal((await api.GET(req('GET', null, token))).status, 404); assert.equal(fs.readdirSync(directory).some(f => f.includes(token)), false);
});
test('family API rejects cross-origin writes and oversized bodies', async () => {
  const cross = new Request('http://localhost/api/family', { method: 'POST', headers: { Origin: 'https://other.example' }, body: JSON.stringify(snapshot) });
  assert.equal((await api.POST(cross)).status, 403);
  assert.equal((await api.POST(req('POST', { ...snapshot, month: 'x'.repeat(260000) }))).status, 400);
});

test('family accepts the public Host even when Next uses an internal bind URL', async () => {
  const request = new Request('http://localhost:3102/api/family', { method: 'POST', headers: { Origin: 'http://127.0.0.1:3102', Host: '127.0.0.1:3102' }, body: JSON.stringify(snapshot) });
  assert.equal((await api.POST(request)).status, 201);
});
