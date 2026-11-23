'use strict';
/**
 * Safe manual catalogue migration.
 * Default: dry run. Explicit --apply required. Existing prices and stock on
 * curated rows are preserved; obsolete SKUs become inactive but order history
 * remains intact. Back up the SQLite database before applying.
 */
require('dotenv').config();
const path = require('node:path');
const fs = require('node:fs');
const { openStore } = require('../server/store');
const catalogue = require('../js/data.js');
const apply = process.argv.includes('--apply');
const dataDir = path.resolve(process.env.DATA_DIR || './runtime-data');
const dbPath = path.join(dataDir, 'semeistvo.sqlite');
if (!fs.existsSync(dbPath)) {
  console.error('Database does not exist yet. Start the server first for initial seeding.');
  process.exitCode = 1;
} else {
  const store = openStore(dataDir);
  const db = store.db;
  try {
    const items = Object.entries(catalogue.components)
      .flatMap(([category, rows]) => rows.map(row => ({ ...row, category })));
    const ids = new Set(items.map(item => item.id));
    const existing = db.prepare('SELECT id, active FROM products').all();
    const legacy = existing.filter(p => !ids.has(p.id) && p.active).map(p => p.id);
    const added = items.filter(item => !existing.some(p => p.id === item.id));
    console.log('SEMEISTVO catalogue edition:', catalogue.catalogEdition);
    console.log('New products to insert:', added.length);
    console.log('Existing curated products with price and stock preserved:', items.length - added.length);
    console.log('Old active products to deactivate:', legacy.length);
    if (!apply) console.log('DRY RUN: no changes made. To apply: npm run catalog:sync -- --apply');
    else {
      const insert = db.prepare(`INSERT OR IGNORE INTO products (id, category, name, brand, description, image, price, stock, active)
        VALUES (@id, @category, @name, @brand, @description, @image, @price, 0, 1)`);
      const refresh = db.prepare(`UPDATE products SET category=@category, name=@name, brand=@brand, description=@description,
        image=@image, updated_at=CURRENT_TIMESTAMP WHERE id=@id`);
      const inactive = db.prepare('UPDATE products SET active=0, updated_at=CURRENT_TIMESTAMP WHERE id=?');
      db.transaction(() => {
        for (const item of items) {
          const values = {
            id:item.id,category:item.category,name:item.name,brand:item.brand,
            description:item.description,image:item.image,price:item.price
          };
          insert.run(values);
          refresh.run(values);
        }
        for (const id of legacy) inactive.run(id);
      })();
      console.log('Catalogue synced. Configure correct retail prices and stock in /admin before accepting payments.');
    }
  } finally { db.close(); }
}
