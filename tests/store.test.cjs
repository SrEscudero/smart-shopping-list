/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
// Compile the existing TypeScript store in memory; no generated sources.
require.extensions['.ts'] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, filename);
};
const storage = new Map();
global.localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) };
global.window = { localStorage: global.localStorage };
const { useShoppingStore: store } = require('../store/useShoppingStore.ts');
const initial = store.getInitialState();
const item = (name = 'Arroz') => ({ name, estimatedPrice: 10, quantity: 2, category: 'Despensa', store: 'Mercado' });
test.beforeEach(() => { storage.clear(); store.setState(initial, true); });

test('main and secondary lists retain products and budgets across switches and reload', async () => {
  store.getState().addProduct(item()); store.getState().setBudget(200);
  store.getState().createList('Verduras');
  const id = store.getState().lists[0].id;
  store.getState().switchList(id);
  assert.equal(store.getState().items.length, 0);
  store.getState().addProduct(item('Tomate')); store.getState().setBudget(50);
  store.getState().switchList(id); // selecting an active list must not restore its stale snapshot
  assert.equal(store.getState().items[0].name, 'Tomate');
  await store.persist.rehydrate();
  store.getState().switchList('');
  assert.equal(store.getState().items[0].name, 'Arroz');
  assert.equal(store.getState().totalBudget, 200);
  store.getState().switchList(id);
  assert.equal(store.getState().items[0].name, 'Tomate');
  assert.equal(store.getState().totalBudget, 50);
});
test('deleting the active list restores main without retaining deleted products', () => {
  store.getState().addProduct(item()); store.getState().createList('Otra');
  const id = store.getState().lists[0].id; store.getState().switchList(id);
  store.getState().addProduct(item('Leche')); store.getState().deleteList(id);
  assert.equal(store.getState().activeListId, null);
  assert.equal(store.getState().items[0].name, 'Arroz');
});
test('closing a month records only purchased goods, respects free products and carries recurring ones', () => {
  store.getState().addProduct({ ...item(), isRecurring: true });
  store.getState().toggleProduct(store.getState().items[0].id, 0);
  store.getState().addProduct(item('Pendiente'));
  store.getState().addProduct(item('Comprado'));
  store.getState().toggleProduct(store.getState().items[2].id, 3);
  assert.equal(store.getState().getStats().totalSpent, 6);
  store.getState().closeMonth();
  assert.equal(store.getState().history[0].totalSpent, 6);
  assert.equal(store.getState().items.length, 1);
  assert.equal(store.getState().items[0].isPurchased, false);
  assert.equal(store.getState().items[0].finalPrice, undefined);
});
test('backup round trip preserves the active list and the main list', () => {
  store.getState().addProduct(item()); store.getState().createList('Otra');
  const id = store.getState().lists[0].id; store.getState().switchList(id);
  store.getState().addProduct(item('Leche'));
  const backup = store.getState().exportBackup(); store.setState(initial, true);
  assert.equal(store.getState().importBackup(backup).success, true);
  assert.equal(store.getState().activeListId, id);
  assert.equal(store.getState().items[0].name, 'Leche');
  store.getState().switchList(''); assert.equal(store.getState().items[0].name, 'Arroz');
});
test('malformed backups fail atomically instead of corrupting stored data', () => {
  store.getState().addProduct(item());
  const good = JSON.parse(store.getState().exportBackup());
  for (const bad of [null, { items: [null] }, { ...good, totalBudget: -10 },
    { ...good, items: [{ ...good.items[0], quantity: -1 }] },
    { ...good, history: [{}] }, { ...good, lists: [{}] }, { ...good, theme: 'wrong' },
    { ...good, activeListId: 'missing' }, { ...good, items: [good.items[0], good.items[0]] }]) {
    assert.equal(store.getState().importBackup(JSON.stringify(bad)).success, false);
    assert.equal(store.getState().items[0].name, 'Arroz');
  }
});
test('legacy v4 backups remain readable', () => {
  store.getState().addProduct(item());
  const backup = JSON.parse(store.getState().exportBackup()); backup.version = 4;
  delete backup.mainList; delete backup.activeListId;
  assert.equal(store.getState().importBackup(JSON.stringify(backup)).success, true);
});
test('undo and redo remain scoped to the selected list', () => {
  store.getState().addProduct(item()); store.getState().clearAll(); store.getState().undo();
  assert.equal(store.getState().items.length, 1);
  store.getState().redo(); assert.equal(store.getState().items.length, 0);
  store.getState().createList('Otra'); store.getState().switchList(store.getState().lists[0].id);
  store.getState().undo(); assert.equal(store.getState().items.length, 0);
});

const { csvToProducts } = require('../utils/csv.ts');
const { decodeSharedProducts } = require('../utils/share.ts');
test('CSV and shared links reject negative and infinite values', () => {
  assert.equal(csvToProducts('Nombre,Categoria,Precio,Cantidad\nArroz,Despensa,-5,1\nPan,Panadería,Infinity,1').length, 0);
  const encoded = btoa(encodeURIComponent(JSON.stringify([null, { n: 'Pan', p: -5, q: 1 }, { n: 'Arroz', p: 0, q: 2 }])));
  const products = decodeSharedProducts(encoded);
  assert.equal(products.length, 1); assert.equal(products[0].estimatedPrice, 0);
});

test('scanner returns a configuration error instead of fabricated groceries', async () => {
  const { POST } = require('../app/api/scan/route.ts');
  const savedKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  try {
    const response = await POST(new Request('http://localhost/api/scan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageData: 'YWJj' }),
    }));
    assert.equal(response.status, 503);
    const body = await response.json();
    assert.equal(body.products, undefined);
    assert.match(body.error, /no está configurado/);
  } finally {
    if (savedKey !== undefined) process.env.GOOGLE_GENERATIVE_AI_API_KEY = savedKey;
  }
});

test('receipt confirmation updates expenses, stock and prices atomically, supports partial purchases and undo', () => {
  store.getState().addProduct({ ...item(), quantity: 2, unit: 'kg' });
  const targetId = store.getState().items[0].id;
  const lines = [{ name: 'Arroz', category: 'Despensa', quantity: .5, price: 8, unit: 'kg', targetId }];
  assert.equal(store.getState().confirmReceipt('receipt-1', 'Tienda A', lines), true);
  assert.equal(store.getState().getStats().totalSpent, 4);
  assert.equal(store.getState().pantry[0].quantity, .5);
  assert.equal(store.getState().items.find(p => !p.isPurchased).quantity, 1.5);
  assert.equal(store.getState().priceHistory[0].price, 8);
  assert.equal(store.getState().confirmReceipt('receipt-1', 'Tienda A', lines), false);
  store.getState().undo();
  assert.equal(store.getState().pantry.length, 0); assert.equal(store.getState().priceHistory.length, 0);
  assert.equal(store.getState().receipts.length, 0); assert.equal(store.getState().items[0].quantity, 2);
  store.getState().redo(); assert.equal(store.getState().receipts.length, 1);
});
test('invalid receipt does not partially write stock or purchases', () => {
  const before = store.getState().exportBackup();
  assert.equal(store.getState().confirmReceipt('bad', 'Tienda', [{ name: 'Arroz', category: 'Despensa', quantity: -1, price: 5 }]), false);
  assert.deepEqual(JSON.parse(store.getState().exportBackup()).items, JSON.parse(before).items);
  assert.equal(store.getState().receipts.length, 0);
});
test('new planning data survives export/import without sharing invitation secrets', () => {
  store.getState().setPantryItem({ name: 'Arroz', quantity: 1.5, unit: 'kg' });
  store.getState().confirmReceipt('r', 'Mercado', [{ name: 'Leche', category: 'Lácteos y Huevos', quantity: 1, price: 4, unit: 'l' }]);
  store.getState().setFamily({ token: 'secret', listId: null, revision: 1, baseline: {} });
  const backup = store.getState().exportBackup(); assert.equal(backup.includes('secret'), false);
  store.setState(initial, true); assert.equal(store.getState().importBackup(backup).success, true);
  assert.equal(store.getState().pantry.length, 2); assert.equal(store.getState().priceHistory.length, 1);
  assert.equal(store.getState().receipts[0].id, 'r'); assert.equal(store.getState().family, null);
});
test('creating a monthly plan preserves the prior list and stock', () => {
  store.getState().addProduct(item()); store.getState().setPantryItem({ name: 'Arroz', unit: 'ud', quantity: 1 });
  const products = store.getState().items;
  store.getState().createPlannedList('Diciembre', products.map(p => ({ ...p, quantity: 1 })), 100);
  assert.equal(store.getState().items[0].quantity, 1); assert.equal(store.getState().totalBudget, 100);
  assert.equal(store.getState().pantry[0].quantity, 1);
  store.getState().switchList(''); assert.equal(store.getState().items[0].quantity, 2);
});

test('CSV and snapshot links retain fractional units, package sizes and optional flags', () => {
  const { productsToCsv } = require('../utils/csv.ts');
  const { encodeSharedProducts } = require('../utils/share.ts');
  const source = [{ ...item(), id: 'pack', unit: 'paquete', packSize: 500, packUnit: 'g', isOptional: true, isRecurring: true, isPurchased: false, addedAt: 1 }, { ...item('Tomate'), id: 'loose', unit: 'kg', quantity: .5, isPurchased: false, addedAt: 1 }];
  const csv = csvToProducts(productsToCsv(source));
  assert.equal(csv.find(p => p.name === 'Tomate').quantity, .5);
  assert.equal(csv.find(p => p.name === 'Arroz').packSize, 500);
  const link = decodeSharedProducts(encodeSharedProducts(source));
  assert.equal(link[0].isOptional, true); assert.equal(link[0].packUnit, 'g'); assert.equal(link[1].quantity, .5);
});
test('receipt cannot silently replace a product with incompatible units', () => {
  store.getState().addProduct({ ...item(), unit: 'kg' });
  const targetId = store.getState().items[0].id;
  assert.equal(store.getState().confirmReceipt('mismatch', 'Tienda', [{ name: 'Arroz', quantity: 1, price: 5, category: 'Despensa', unit: 'l', targetId }]), false);
  assert.equal(store.getState().items[0].isPurchased, false);
});
