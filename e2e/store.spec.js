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
    await expect(page.locator('img.svo-product-image').first()).toBeVisible();
    if (width <= 1024) {
      await page.locator('#mobileMenuBtn').click();
      await expect(page.locator('#svoPrimaryNav')).toHaveClass(/open/);
      await page.locator('#svoPrimaryNav a[href="#svo-shop"]').click();
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
  await img.evaluate(el => { el.src = '/images/this-file-does-not-exist.jpg'; });
  await expect(img).toHaveAttribute('src', /images\/catalog\/gpu-rtx5060ti16\.svg/);
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
  await page.goto('/admin', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#loginSection')).toBeVisible();
  await expect(page.locator('.svo-admin-brand img')).toBeVisible();
});
