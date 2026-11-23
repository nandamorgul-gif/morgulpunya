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

test('all hardware photos load locally even with third-party requests blocked', async ({ page }) => {
  await page.route(/^(?!http:\/\/127\.0\.0\.1:3000\/)/, route => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.svo-product')).toHaveCount(46);
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
  for (const model of authored.models) {
    expect(model.fallback).toBe('images/catalog/' + model.id + '.svg');
    if (model.kind === 'reference-photo') expect(model.url).toBe('images/catalog/photos/' + model.id + '.webp');
  }
  const hardwarePhotos = page.locator('.svo-product-media.has-photo img');
  await expect(hardwarePhotos).toHaveCount(43);
  await hardwarePhotos.evaluateAll(images => Promise.all(images.map(image => {
    image.loading = 'eager';
    return image.decode();
  })));
  expect(await hardwarePhotos.evaluateAll(images => images.every(image =>
    image.getAttribute('src').startsWith('images/catalog/photos/') && image.naturalWidth > 0
  ))).toBe(true);
  const builder = page.locator('.component-img').first();
  await builder.scrollIntoViewIfNeeded();
  await expect(builder).toHaveAttribute('src', /^images\/catalog\/photos\/.+\.webp$/);
  await builder.evaluate(image => image.decode());
});
