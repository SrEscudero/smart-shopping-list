/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
require.extensions['.ts'] = (m, f) => m._compile(ts.transpileModule(fs.readFileSync(f, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, f);
const { unitPrice, planMonth, budgetForecast, priceChange } = require('../utils/planning.ts');
const item = (extra = {}) => ({ id: 'a', name: 'Arroz', category: 'Despensa', quantity: 2, estimatedPrice: 10, store: 'Mercado', isPurchased: false, addedAt: 1, ...extra });
test('compare 500 g and 1 kg using price per kg; unknown packages are not compared', () => {
  assert.equal(unitPrice(item({ unit: 'paquete', packSize: 500, packUnit: 'g' })).price, 20);
  assert.equal(unitPrice(item({ unit: 'paquete', packSize: 1, packUnit: 'kg', estimatedPrice: 16 })).price, 16);
  assert.equal(unitPrice(item({ unit: 'paquete' })), null);
});
test('planning subtracts stock once across repeated rows and respects unit dimensions', () => {
  const source = [item({ unit: 'kg' }), item({ id: 'b', unit: 'kg' }), item({ id: 'c', unit: 'l' })];
  const plan = planMonth(source, [{ name: 'arroz', quantity: 3, unit: 'kg' }]);
  assert.deepEqual(plan.map(p => [p.id, p.quantity]), [['b', 1], ['c', 2]]);
});
test('planning rounds packages up and allows fractional loose quantities', () => {
  assert.equal(planMonth([item({ unit: 'paquete', packSize: 500, packUnit: 'g' })], [{ name: 'Arroz', quantity: .25, unit: 'kg' }])[0].quantity, 2);
  assert.equal(planMonth([item({ unit: 'kg', quantity: 1 })], [{ name: 'Arroz', quantity: .25, unit: 'kg' }])[0].quantity, .75);
});
test('forecast uses paid prices plus pending estimates, only pending optional products can be cut', () => {
  const data = budgetForecast([item({ isPurchased: true, finalPrice: 15 }), item({ id: 'b', isOptional: true }), item({ id: 'c', estimatedPrice: 0 })], 40);
  assert.equal(data.projected, 50); assert.equal(data.excess, 10); assert.equal(data.optional.length, 1); assert.equal(data.unpriced, 1);
});
test('price comparisons never mix currencies, dimensions or the same purchase', () => {
  const entries = [{ productId: 'old', name: 'Arroz', price: 8, unit: 'ud', currency: 'R$', recordedAt: 1 }];
  assert.equal(priceChange(item(), entries, 'R$').percent, 25);
  assert.equal(priceChange(item(), entries, '$'), null);
  assert.equal(priceChange(item({ unit: 'kg' }), entries, 'R$'), null);
});

const { mergeFamily, validFamilySnapshot } = require('../utils/family.ts');
const snapshot = (items) => ({ items, totalBudget: 100, month: 'Noviembre', currency: 'R$' });
test('family merge keeps independent additions and changes to different fields', () => {
  const base = snapshot([item()]);
  const local = snapshot([item({ name: 'Arroz integral' }), item({ id: 'b', name: 'Leche' })]);
  const remote = snapshot([item({ quantity: 4 }), item({ id: 'c', name: 'Pan' })]);
  const merged = mergeFamily(base, local, remote);
  assert.equal(merged.items.length, 3);
  assert.equal(merged.items.find(p => p.id === 'a').name, 'Arroz integral');
  assert.equal(merged.items.find(p => p.id === 'a').quantity, 4);
});
test('family conflicts never silently overwrite simultaneous edits or delete/edit pairs', () => {
  const base = snapshot([item()]);
  assert.equal(mergeFamily(base, snapshot([item({ quantity: 3 })]), snapshot([item({ quantity: 4 })])), null);
  assert.equal(mergeFamily(base, snapshot([]), snapshot([item({ quantity: 4 })])), null);
  assert.deepEqual(mergeFamily(base, snapshot([]), base).items, []);
});
test('family payload rejects malformed products and unsupported currency', () => {
  assert.equal(validFamilySnapshot(snapshot([item()])), true);
  assert.equal(validFamilySnapshot({ ...snapshot([item()]), currency: 'unknown' }), false);
  assert.equal(validFamilySnapshot(snapshot([item({ unit: 'bad' })])), false);
});
