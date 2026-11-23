const { test, expect } = require('@playwright/test');

test('PC Builder selection and replacement synchronize with the one header cart', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.select-part-btn[data-id="cpu-r5-9600x"]').click();
  await expect(page.locator('#svoShopCartCount')).toHaveText('1');
  await expect(page.locator('#svoBuilderCartCount')).toHaveText('1');
  await page.locator('#svoBuilderViewCart').click();
  await expect(page.locator('#svoCartLayer')).toHaveClass(/is-open/);
  await expect(page.locator('#svoCartItems')).toContainText('Ryzen 5 9600X');
  await expect(page.locator('#svoCartItems')).toContainText('Dari PC Builder');
  await page.locator('#svoCloseCart').click();

  // Swapping one CPU should replace the old CPU, not duplicate it.
  await page.locator('.select-part-btn[data-id="cpu-r7-9700x"]').click();
  await expect(page.locator('#svoShopCartCount')).toHaveText('1');
  await page.locator('#svoShopCartButton').click();
  await expect(page.locator('#svoCartItems')).toContainText('Ryzen 7 9700X');
  await expect(page.locator('#svoCartItems')).not.toContainText('Ryzen 5 9600X');

  // Removing in the top cart must clear the builder summary as well.
  await page.locator('#svoCartItems [data-svo-remove="cpu-r7-9700x"]').click();
  await expect(page.locator('#svoShopCartCount')).toHaveText('0');
  await expect(page.locator('#summaryParts')).toContainText('Belum ada komponen');
});

test('manually added catalogue items remain in cart when PC Builder changes', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#svoProductCategory').selectOption('accessories');
  await page.locator('[data-svo-add="acc-bracket"]').click();
  await expect(page.locator('#svoShopCartCount')).toHaveText('1');
  await page.locator('.select-part-btn[data-id="cpu-r5-9600x"]').click();
  await expect(page.locator('#svoShopCartCount')).toHaveText('2');
  await page.locator('.select-part-btn[data-id="cpu-r7-9700x"]').click();
  await expect(page.locator('#svoShopCartCount')).toHaveText('2');
  await page.locator('#svoShopCartButton').click();
  await expect(page.locator('#svoCartItems')).toContainText('GPU Support Bracket');
  await expect(page.locator('#svoCartItems')).toContainText('Ryzen 7 9700X');
  await page.locator('#svoCartItems [data-svo-remove="cpu-r7-9700x"]').click();
  await expect(page.locator('#svoShopCartCount')).toHaveText('1');
  await expect(page.locator('#svoCartItems')).toContainText('GPU Support Bracket');
});

test('loading and clearing the Mini-ITX preset updates header cart quantity', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('.load-preset-btn[data-preset="compact-white-itx"]').click();
  await expect(page.locator('#svoShopCartCount')).toHaveText('8');
  await expect(page.locator('#svoBuilderCartCount')).toHaveText('8');
  await page.locator('#svoShopCartButton').click();
  await expect(page.locator('#svoCartItems .svo-cart-item')).toHaveCount(8);
  await page.locator('#svoCloseCart').click();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('#resetBuildBtn').click();
  await expect(page.locator('#svoShopCartCount')).toHaveText('0');
});

test('all catalogue SKUs have genuine-photo references, with a separate label for service photos', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.svo-product')).toHaveCount(46);
  // The external image host may block hotlinking in CI; verify the authored
  // sources and explicit fallback chain rather than requiring network success.
  const authored = await page.evaluate(() => ({
    refs: Object.keys(window.SVO_PHOTOS || {}).length,
    models: Object.values(window.PC_DATA.components).flat().map(p => ({
      id: p.id, url: p.image, fallback: p.fallbackImage, kind: p.imageType
    }))
  }));
  expect(authored.refs).toBe(46);
  expect(authored.models.length).toBe(46);
  expect(authored.models.filter(p => p.kind === 'reference-photo').length).toBe(43);
  expect(authored.models.filter(p => p.kind === 'service-photo').length).toBe(3);
  expect(authored.models.every(p => p.url.startsWith('https://') && p.fallback === 'images/catalog/' + p.id + '.svg')).toBeTruthy();
  const cards = page.locator('.svo-product-image');
  await expect(cards).toHaveCount(46);
  await expect(cards.first()).toHaveAttribute('data-svo-fallback', /images\/catalog\//);
});
