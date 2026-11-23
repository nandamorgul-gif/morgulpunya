const { test, expect } = require('@playwright/test');

const viewports = [360, 390, 430, 768, 1024, 1280, 1440, 1920];

for (const width of viewports) {
  test('polished layout has no horizontal overflow at ' + width + 'px', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#presetsContainer .preset-card')).toHaveCount(5);
    await expect(page.locator('.svo-services-grid .svo-offer')).toHaveCount(7);
    await expect(page.locator('#pembayaran .svo-payment-method')).toHaveCount(5);
    await expect(page.locator('#svoMusicPlayer')).toHaveClass(/is-collapsed/);
    const dimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      bodyWidth: document.body.scrollWidth,
      innerWidth
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth + 3);
    expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.innerWidth + 3);
    const heroHeading = await page.locator('h1').boundingBox();
    expect(heroHeading.width).toBeGreaterThan(190);
    expect(heroHeading.x).toBeGreaterThanOrEqual(5);
    expect(heroHeading.x + heroHeading.width).toBeLessThanOrEqual(width + 3);
    await context.close();
  });
}

test('desktop service card composition fills balanced rows', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const layout = await page.locator('.svo-services-grid').evaluate(node => ({
    cols: getComputedStyle(node).gridTemplateColumns.split(' ').length,
    first: getComputedStyle(node.firstElementChild).gridColumnEnd,
    count: node.children.length
  }));
  expect(layout.cols).toBe(4);
  expect(layout.first).toBe('span 2');
  expect(layout.count).toBe(7);
  const preset = page.locator('#preset');
  const builder = page.locator('#rakit-pc');
  expect(await preset.evaluate((node, builderId) =>
    !!(node.compareDocumentPosition(document.getElementById(builderId)) & Node.DOCUMENT_POSITION_FOLLOWING), 'rakit-pc'
  )).toBeTruthy();
  await expect(builder.locator('#svoBuilderViewCart')).toBeVisible();
});

test('payment logos show readable text when remote image requests fail', async ({ page }) => {
  await page.route('**/commons.wikimedia.org/**', route => route.abort('failed'));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#pembayaran').scrollIntoViewIfNeeded();
  const frames = page.locator('#pembayaran .svo-payment-logo-frame');
  await expect(frames).toHaveCount(5);
  await expect(frames.filter({ has: page.locator('.svo-payment-logo-fallback') })).toHaveCount(5);
  await expect(frames.locator('img')).toHaveCount(5);
  await expect(page.locator('#pembayaran .svo-payment-logo-frame.is-fallback')).toHaveCount(5);
  await expect(page.locator('#pembayaran .svo-payment-logo-fallback').first()).toBeVisible();
  await expect(page.locator('#pembayaran .svo-payment-method strong')).toHaveText([
    'BCA','Mandiri','SeaBank','Bank Jago','DANA'
  ]);
});

test('basic brand and functional controls remain after the visual pass', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.svo-brand img.svo-logo-horizontal')).toHaveCount(1);
  await expect(page.locator('a.svo-skip-link')).toHaveAttribute('href','#layanan');
  await expect(page.locator('#svoShopCartButton')).toHaveCount(1);
  await expect(page.locator('#svoMusicPlayer')).toHaveClass(/is-collapsed/);
  await page.locator('.load-preset-btn[data-preset="compact-white-itx"]').click();
  await expect(page.locator('#svoShopCartCount')).toHaveText('8');
  await page.locator('#svoBuilderViewCart').click();
  await expect(page.locator('#svoCartLayer')).toHaveClass(/is-open/);
  await expect(page.locator('#svoCartItems .svo-cart-item')).toHaveCount(8);
});
