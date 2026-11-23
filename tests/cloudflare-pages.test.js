'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto').webcrypto;
const Database = require('better-sqlite3');
const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

test('Pages public build includes all website assets and excludes server/database material', () => {
  const built = cp.spawnSync(process.execPath, ['scripts/build-pages.cjs'], {
    cwd: root, encoding: 'utf8'
  });
  assert.equal(built.status, 0, built.stderr || built.stdout);
  for (const entry of ['index.html','admin.html','site.webmanifest','images/favicon.svg',
    'js/store.js','css/polish.css','_redirects','_headers','_routes.json','404.html']) {
    assert.ok(fs.existsSync(path.join(root, 'dist', entry)), 'missing public asset ' + entry);
  }
  for (const privateEntry of ['server','db','migrations','functions','runtime-data',
    '.env','.git','package.json','package-lock.json','node_modules','scripts']) {
    assert.ok(!fs.existsSync(path.join(root, 'dist', privateEntry)), 'private asset leaked: ' + privateEntry);
  }
  assert.deepEqual(JSON.parse(read('dist/_routes.json')), {
    version: 1, include: ['/api/*'], exclude: []
  });
});
test('D1 schema and catalogue seed initialize valid SQLite without fictitious stock', () => {
  const db = new Database(':memory:');
  db.exec(read('migrations/0001_schema.sql'));
  db.exec(read('db/seed.sql'));
  assert.equal(db.prepare('SELECT count(*) AS n FROM products').get().n, 46);
  assert.equal(db.prepare('SELECT sum(stock) AS n FROM products').get().n, 0);
  assert.equal(db.prepare('SELECT count(*) AS n FROM admin_sessions').get().n, 0);
  // The seed must be idempotent and must never overwrite a manually changed price.
  db.prepare('UPDATE products SET price = 123 WHERE id = ?').run('gpu-rtx5060ti16');
  db.exec(read('db/seed.sql'));
  assert.equal(db.prepare('SELECT count(*) AS n FROM products').get().n, 46);
  assert.equal(db.prepare('SELECT price FROM products WHERE id = ?').get('gpu-rtx5060ti16').price, 123);
  db.close();
});
test('single-statement dashboard import inserts all 46 rows and is idempotent', () => {
  const sql = read('db/seed-console-one-statement.sql');
  // All 46 tuples must be importable as a single D1 Console query.
  const statements = sql.split('\n').filter(line => !line.trim().startsWith('--')).join('\n')
    .split(';').filter(part => part.trim());
  assert.equal(statements.length, 1);
  assert.ok(sql.length < 100000);
  const db = new Database(':memory:');
  db.exec(read('migrations/0001_schema.sql'));
  db.exec(sql);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM products').get().total, 46);
  assert.equal(db.prepare('SELECT COALESCE(SUM(stock),0) AS total FROM products').get().total, 0);
  db.exec(sql);
  assert.equal(db.prepare('SELECT COUNT(*) AS total FROM products').get().total, 46);
  db.close();
});
function makeFixture() {
  const db = new Database(':memory:');
  db.exec(read('migrations/0001_schema.sql'));
  db.exec(read('db/seed.sql'));
  const DB = {
    prepare(statement) {
      const sql = db.prepare(statement);
      let values = [];
      const obj = {
        bind(...input) { values = input; return obj; },
        async first() { return sql.get(...values) || null; },
        async all() { return { results: sql.all(...values) }; },
        async run() { const result = sql.run(...values); return { success: true, meta: { changes: result.changes } }; }
      };
      return obj;
    }
  };
  const source = read('functions/api/[[path]].js')
    .replace('export async function onRequest', 'async function onRequest');
  const onRequest = new Function('crypto', 'Response', 'TextEncoder', source + '\nreturn onRequest;')(
    crypto, Response, TextEncoder
  );
  const env = { DB, ADMIN_EMAIL: 'admin@example.com', ADMIN_PASSWORD: 'testing-only-very-long-secret-123' };
  const url = path => 'https://semeistvo.test' + path;
  const send = async (path, method = 'GET', body, extraHeaders = {}, overrideEnv = env) => {
    const headers = { ...extraHeaders };
    const options = { method, headers };
    if (body !== undefined) {
      options.body = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
    }
    const request = new Request(url(path), options);
    const response = await onRequest({ request, env: overrideEnv });
    const data = await response.json();
    return { status: response.status, response, data };
  };
  return { send, db, env };
}
test('Cloudflare D1 endpoints: live catalogue, safe checkout, protected admin', async () => {
  const { send, db } = makeFixture();
  const health = await send('/api/health');
  assert.equal(health.status, 200);
  assert.equal(health.data.database, 'd1');
  assert.equal(health.data.checkout_enabled, false);
  const products = await send('/api/products');
  assert.equal(products.status, 200);
  assert.equal(products.data.products.length, 46);
  assert.equal(products.data.checkout_enabled, false);
  assert.equal(products.data.products.every(p => p.stock === 0), true);
  const payment = await send('/api/orders', 'POST', { customer: { name: 'Test' }, items: [] });
  assert.equal(payment.status, 503);
  assert.equal((await send('/api/admin/products')).status, 401);
  assert.equal((await send('/api/admin/me')).status, 401);
  assert.equal((await send('/api/health', 'GET', undefined, {}, {})).status, 503);

  const origin = { Origin: 'https://semeistvo.test' };
  const login = await send('/api/admin/login', 'POST', {
    email: 'admin@example.com', password: 'testing-only-very-long-secret-123'
  }, origin);
  assert.equal(login.status, 200, JSON.stringify(login.data));
  const cookie = login.response.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly; Secure; SameSite=Strict/);
  const cookieHeader = cookie.split(';')[0];
  const me = await send('/api/admin/me', 'GET', undefined, { Cookie: cookieHeader });
  assert.equal(me.data.email, 'admin@example.com');
  const admin = await send('/api/admin/products', 'GET', undefined, { Cookie: cookieHeader });
  assert.equal(admin.data.products.length, 46);
  const productId = 'gpu-rtx5060ti16';
  const updated = await send('/api/admin/products/' + productId, 'PATCH', {
    price: 12345678, stock: 3
  }, { ...origin, Cookie: cookieHeader });
  assert.equal(updated.status, 200, JSON.stringify(updated.data));
  assert.equal(updated.data.product.price, 12345678);
  const live = await send('/api/products');
  assert.equal(live.data.products.find(p => p.id === productId).stock, 3);
  const invalid = await send('/api/admin/products/' + productId, 'PATCH', {
    image: 'javascript:alert(1)'
  }, { ...origin, Cookie: cookieHeader });
  assert.equal(invalid.status, 400);
  const csrf = await send('/api/admin/products/' + productId, 'PATCH', {
    price: 1
  }, { Origin: 'https://evil.invalid', Cookie: cookieHeader });
  assert.equal(csrf.status, 403);
  assert.equal(db.prepare('SELECT price FROM products WHERE id = ?').get(productId).price, 12345678);
  const orders = await send('/api/admin/orders', 'GET', undefined, { Cookie: cookieHeader });
  assert.deepEqual(orders.data.orders, []);
  const logout = await send('/api/admin/logout', 'POST', undefined, { ...origin, Cookie: cookieHeader });
  assert.equal(logout.status, 200);
  assert.equal((await send('/api/admin/me','GET',undefined,{ Cookie: cookieHeader })).status, 401);
  db.close();
});
test('Cloudflare admin login limits repeated failed attempts', async () => {
  const { send, db } = makeFixture();
  let last;
  for (let i=0;i<9;i++) {
    last = await send('/api/admin/login','POST',{ email:'admin@example.com',password:'wrong' },
      { Origin:'https://semeistvo.test' });
  }
  assert.equal(last.status, 429);
  db.close();
});
