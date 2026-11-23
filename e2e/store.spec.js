const { test, expect } = require('@playwright/test');

const widths = [360, 390, 430, 768, 1024, 1440];

for (const width of widths) {
  test('responsive layout at ' + width + 'px', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.svo-product')).toHaveCount(46);
    await expect(page.locator('#svoMusicPlayer')).toHaveClass(/is-collapsed/);
    const appWidth = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: innerWidth }));
    expect(appWidth.body).toBeLessThanOrEqual(appWidth.viewport + 3);
    // Remote photo hosts may block hotlinks. Product text/cart must remain usable.
    await expect(page.locator('.svo-product-name').first()).toBeVisible();
    if (width <= 1024) {
      await page.locator('#mobileMenuBtn').click();
      await expect(page.locator('#svoPrimaryNav')).toHaveClass(/open/);
      await page.locator('#svoPrimaryNav a[href="#layanan"]').click();
      await expect(page.locator('#svoPrimaryNav')).not.toHaveClass(/open/);
    } else {
      await expect(page.locator('#svoPrimaryNav')).toBeVisible();
    }
    await context.close();
  });
}

test('quick categories filter 2026 catalogue and card images recover', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.svo-product')).toHaveCount(46);
  await page.locator('[data-svo-category-link="gpu"]').click();
  await expect(page.locator('#svoProductCategory')).toHaveValue('gpu');
  await expect(page.locator('.svo-product')).toHaveCount(8);
  await page.locator('#svoProductSearch').fill('5060 Ti');
  await expect(page.locator('.svo-product')).toHaveCount(1);
  const img = page.locator('.svo-product-image').first();
  await img.evaluate(el => { el.dataset.svoFallbackStage = ''; el.src = '/images/this-file-does-not-exist.jpg'; });
  // A missing photo falls back to the corresponding local SKU artwork.
  await expect(img).toHaveAttribute('src', /images\/catalog\/.+\.svg/);
  await expect(page.locator('.svo-product-name').first()).toBeVisible();
  await expect(page.locator('.svo-product').first().locator('[data-svo-add]')).toBeVisible();
});

test('logo, hidden music, admin and no private file leak', async ({ page, request }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.svo-brand')).toBeVisible();
  await expect(page.locator('#svoMusicPlayer')).toHaveClass(/is-collapsed/);
  await page.locator('#svoMusicCollapse').click();
  await expect(page.locator('#svoMusicContent')).toBeVisible();
  await expect(page.locator('#svoMusicMute')).toBeVisible();
  const hidden = await request.get('/.env');
  expect(hidden.status()).toBe(404);
  await expect(page.locator('.svo-admin-entry, .svo-admin-nav')).toHaveCount(0);
  const artwork = await request.get('/images/gta-roleplay-night.jpg');
  expect(artwork.ok()).toBe(true);
});
