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
  for (const entry of ['index.html','site.webmanifest','images/favicon.svg','images/gta-roleplay-scene.svg',
    'js/store.js','css/polish.css','_redirects','_headers','_routes.json','404.html']) {
    assert.ok(fs.existsSync(path.join(root, 'dist', entry)), 'missing public asset ' + entry);
  }
  assert.ok(!fs.existsSync(path.join(root, 'dist/admin.html')), 'admin page must not deploy');
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
  // Descriptions may contain semicolons inside quoted SQL strings.
  // SQLite db.exec below validates the actual statement structure.
  assert.equal((sql.match(/^INSERT OR IGNORE INTO products /gm) || []).length, 1);
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
test('Cloudflare D1 endpoints keep catalogue and quote-only flow while removing admin login', async () => {
  const { send,db } = makeFixture();
  const health = await send('/api/health');
  assert.equal(health.status,200);
  assert.equal(health.data.database,'d1');
  assert.equal(health.data.checkout_enabled,false);
  const list = await send('/api/products');
  assert.equal(list.status,200);
  assert.equal(list.data.products.length,46);
  assert.equal(list.data.pricing.status,'not_configured');
  assert.equal(list.data.pricing.live_products,0);
  assert.ok(list.data.products.every(p=>p.price_live===false));
  const order = await send('/api/orders','POST',{items:[]});
  assert.equal(order.status,503);
  assert.equal((await send('/api/admin/me')).status,404);
  assert.equal((await send('/api/admin/products')).status,404);
  assert.equal((await send('/api/admin/login','POST',{email:'test@example.com',password:'irrelevant'},
    {Origin:'https://semeistvo.test'})).status,404);
  assert.equal((await send('/api/health','GET',undefined,{},{})).status,503);
  db.close();
});
test('Supplier price feed overrides matching SKUs with fresh IDR prices only', async () => {
  const {send,db,env}=makeFixture();
  env.PRICE_FEED_URL='https://supplier.example.test/api/catalog';
  env.PRICE_FEED_TOKEN='testing-token';
  const originalFetch=globalThis.fetch;
  let called=0;
  globalThis.fetch=async (_url,options) => {
    called++;
    assert.equal(options.headers.Authorization,'Bearer testing-token');
    return new Response(JSON.stringify({
      updated_at:new Date().toISOString(),
      currency:'IDR',
      products:[{id:'gpu-rtx5060ti16',price:17000000,stock:6}]
    }),{status:200,headers:{'Content-Type':'application/json'}});
  };
  try {
    const response=await send('/api/products');
    assert.equal(response.status,200);
    assert.equal(response.data.pricing.status,'live');
    assert.equal(response.data.pricing.live_products,1);
    assert.equal(response.data.products.find(p=>p.id==='gpu-rtx5060ti16').price,17000000);
    assert.equal(response.data.products.find(p=>p.id==='gpu-rtx5060ti16').stock,6);
    assert.equal(response.data.products.find(p=>p.id==='gpu-rtx5060ti16').price_live,true);
    assert.equal(response.data.products.find(p=>p.id==='cpu-r5-9600x').price_live,false);
    assert.equal(called,1);
    assert.notEqual(db.prepare('SELECT price FROM products WHERE id = ?').get('gpu-rtx5060ti16').price,17000000);
  } finally {globalThis.fetch=originalFetch;db.close();}
});
