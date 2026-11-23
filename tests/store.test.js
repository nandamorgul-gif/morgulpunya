'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { openStore } = require('../server/store');

function fixture(stock = 3) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'svo-test-'));
  process.env.SEED_DEMO_STOCK = String(stock);
  const store = openStore(dir);
  const dispose = () => {
    store.db.close();
    fs.rmSync(dir, { force: true, recursive: true });
  };
  return { store, dispose };
}
function create(store, entries = [{ id: 'cpu-r5-9600x', quantity: 2 }], id = 'SVO-TEST-1') {
  const now = Date.now();
  return store.createOrder({
    items: entries, orderId: id, tokenHash: store.sha(crypto.randomBytes(32).toString('hex')),
    now, shipping: 20000, customer: { name:'Test Customer', phone:'081234567890',
    email:'test@example.com', address:'Jl. Pengujian No. 1', notes:'' }
  });
}

test('seeded products default to known catalogue values', () => {
  const { store, dispose } = fixture(0);
  try {
    const product = store.listProducts().find(p => p.id === 'cpu-r5-9600x');
    assert.ok(product);
    assert.equal(product.stock, 0);
    assert.ok(Number.isInteger(product.price));
  } finally { dispose(); }
});

test('order reserves stock and computes authoritative total', () => {
  const { store, dispose } = fixture(3);
  try {
    const cpu = store.listProducts().find(p => p.id === 'cpu-r5-9600x');
    const order = create(store);
    assert.equal(order.subtotal, cpu.price * 2);
    assert.equal(order.total, cpu.price * 2 + 20000);
    assert.equal(store.listProducts().find(p => p.id === 'cpu-r5-9600x').stock, 1);
    assert.equal(store.itemsFor(order.id)[0].quantity, 2);
  } finally { dispose(); }
});

test('rejects overselling without changing stock', () => {
  const { store, dispose } = fixture(3);
  try {
    assert.throws(() => create(store, [{ id:'cpu-r5-9600x', quantity:4 }]), /Stok tidak mencukupi/);
    assert.equal(store.listProducts().find(p => p.id === 'cpu-r5-9600x').stock, 3);
  } finally { dispose(); }
});

test('rejects duplicate quantity overflow atomically', () => {
  const { store, dispose } = fixture(3);
  try {
    assert.throws(() => create(store, [{ id:'cpu-r5-9600x', quantity:2 }, { id:'cpu-r5-9600x', quantity:2 }]), /Stok tidak mencukupi/);
    assert.equal(store.listProducts().find(p => p.id === 'cpu-r5-9600x').stock, 3);
  } finally { dispose(); }
});

test('canceling an unpaid order restores stock exactly once', () => {
  const { store, dispose } = fixture(3);
  try {
    const order = create(store);
    assert.equal(store.releaseOrder(order.id, 'cancelled', Date.now()), true);
    assert.equal(store.releaseOrder(order.id, 'cancelled', Date.now()), false);
    assert.equal(store.listProducts().find(p => p.id === 'cpu-r5-9600x').stock, 3);
  } finally { dispose(); }
});

test('payment transition is idempotent and cannot be released after paid', () => {
  const { store, dispose } = fixture(3);
  try {
    const order = create(store);
    assert.equal(store.markPaid(order.id, Date.now()), true);
    assert.equal(store.markPaid(order.id, Date.now()), false);
    assert.equal(store.releaseOrder(order.id, 'expired', Date.now()), false);
    assert.equal(store.getOrder(order.id).status, 'paid');
    assert.equal(store.listProducts().find(p => p.id === 'cpu-r5-9600x').stock, 1);
  } finally { dispose(); }
});
