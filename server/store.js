'use strict';
/**
 * SEMEISTVO TECH — SQLite store.
 * Integer rupiah; authoritative server-side pricing. Zero inventory by default.
 */
const Database = require('better-sqlite3');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');

function openStore(dataDir) {
  fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const db = new Database(path.join(dataDir, 'semeistvo.sqlite'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      price INTEGER NOT NULL CHECK(price >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
      active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0, 1)),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      access_token_hash TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      customer_notes TEXT NOT NULL DEFAULT '',
      subtotal INTEGER NOT NULL,
      shipping INTEGER NOT NULL,
      total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending_payment'
        CHECK (status IN ('pending_payment', 'paid', 'expired', 'cancelled', 'processing', 'shipped', 'completed', 'refunded')),
      payment_url TEXT,
      payment_reference TEXT UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS order_items (
      order_id TEXT NOT NULL REFERENCES orders(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 20),
      unit_price INTEGER NOT NULL CHECK(unit_price >= 0),
      PRIMARY KEY(order_id, product_id)
    );
    CREATE TABLE IF NOT EXISTS admins (
      email TEXT PRIMARY KEY,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash TEXT PRIMARY KEY,
      email TEXT NOT NULL REFERENCES admins(email) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_expiry ON orders(expires_at);
  `);

  const seed = require('../js/data.js');
  const initialStock = Math.max(0, Math.min(3, Number(process.env.SEED_DEMO_STOCK || '0') || 0));
  const insert = db.prepare(`INSERT OR IGNORE INTO products (id, category, name, brand, description, image, price, stock)
    VALUES (@id, @category, @name, @brand, @description, @image, @price, @stock)`);
  db.transaction(() => {
    for (const [category, items] of Object.entries(seed.components)) {
      for (const item of items) {
        insert.run({
          id: item.id, category, name: item.name, brand: item.brand,
          description: item.description || '', image: item.image || '',
          price: Math.max(0, Math.round(item.price)), stock: initialStock
        });
      }
    }
  })();

  const sha = value => crypto.createHash('sha256').update(value).digest('hex');
  const publicProduct = row => ({
    id: row.id, category: row.category, name: row.name, brand: row.brand,
    description: row.description, image: row.image, price: row.price, stock: row.stock
  });
  const listProducts = () => db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY category, name').all().map(publicProduct);
  const createOrder = db.transaction(({ items, customer, shipping, now, orderId, tokenHash }) => {
    const normalised = new Map();
    for (const entry of items) {
      if (!entry || typeof entry.id !== 'string' || !Number.isInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > 20) {
        throw Object.assign(new Error('Jumlah produk tidak valid.'), { statusCode: 400 });
      }
      normalised.set(entry.id, (normalised.get(entry.id) || 0) + entry.quantity);
    }
    if (!normalised.size || normalised.size > 30 || [...normalised.values()].some(v => v > 20)) {
      throw Object.assign(new Error('Keranjang tidak valid.'), { statusCode: 400 });
    }
    const validated = [];
    let subtotal = 0;
    for (const [id, quantity] of normalised) {
      const product = db.prepare('SELECT * FROM products WHERE id = ? AND active = 1').get(id);
      if (!product) throw Object.assign(new Error('Produk tidak tersedia.'), { statusCode: 409 });
      if (product.stock < quantity) throw Object.assign(new Error('Stok tidak mencukupi: ' + product.name), { statusCode: 409 });
      subtotal += product.price * quantity;
      if (!Number.isSafeInteger(subtotal)) throw Object.assign(new Error('Total tidak valid.'), { statusCode: 400 });
      validated.push({ product, quantity });
    }
    const total = subtotal + shipping;
    const expiresAt = now + 30 * 60 * 1000;
    db.prepare(`INSERT INTO orders
      (id, access_token_hash, customer_name, customer_phone, customer_email, shipping_address, customer_notes,
       subtotal, shipping, total, status, expires_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_payment', ?, ?, ?)`)
      .run(orderId, tokenHash, customer.name, customer.phone, customer.email,
        customer.address, customer.notes, subtotal, shipping, total, expiresAt, now, now);
    const insertItem = db.prepare(`INSERT INTO order_items
      (order_id, product_id, product_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)`);
    const reserve = db.prepare('UPDATE products SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND stock >= ?');
    for (const { product, quantity } of validated) {
      if (reserve.run(quantity, product.id, quantity).changes !== 1) {
        throw Object.assign(new Error('Stok berubah, silakan cek keranjang.'), { statusCode: 409 });
      }
      insertItem.run(orderId, product.id, product.name, quantity, product.price);
    }
    return { id: orderId, subtotal, shipping, total, status: 'pending_payment', expires_at: expiresAt };
  });

  const releaseOrder = db.transaction((id, newStatus, now) => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order || order.status !== 'pending_payment') return false;
    db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(newStatus, now, id);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
    const restore = db.prepare('UPDATE products SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    for (const item of items) restore.run(item.quantity, item.product_id);
    return true;
  });
  const markPaid = db.transaction((id, now) => {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order || order.status !== 'pending_payment') return false;
    db.prepare("UPDATE orders SET status = 'paid', updated_at = ? WHERE id = ?").run(now, id);
    return true;
  });
  const getOrder = id => db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  const itemsFor = id => db.prepare('SELECT product_id, product_name, quantity, unit_price FROM order_items WHERE order_id = ?').all(id);
  const orderPublic = order => ({
    id: order.id, subtotal: order.subtotal, shipping: order.shipping, total: order.total,
    status: order.status, expires_at: order.expires_at, created_at: order.created_at,
    items: itemsFor(order.id), payment_url: order.payment_url
  });
  const expired = now => db.prepare("SELECT id FROM orders WHERE status = 'pending_payment' AND expires_at <= ?").all(now);
  const updatePaymentUrl = (id, paymentUrl) => db.prepare("UPDATE orders SET payment_url = ? WHERE id = ? AND status = 'pending_payment'").run(paymentUrl, id);
  const updateProduct = (id, fields) => {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) return null;
    const next = { ...existing, ...fields };
    db.prepare(`UPDATE products SET name = ?, brand = ?, description = ?, image = ?, price = ?, stock = ?, active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(next.name, next.brand, next.description, next.image, next.price, next.stock, next.active, id);
    return db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  };
  return { db, sha, listProducts, createOrder, releaseOrder, markPaid, getOrder, itemsFor, orderPublic, expired, updatePaymentUrl, updateProduct };
}
module.exports = { openStore };
