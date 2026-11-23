const { test, expect } = require('@playwright/test');

const viewports = [360, 390, 430, 768, 1024, 1200, 1280, 1440, 1920];
const serviceOrder = [
  '01 / HARDWARE', '02 / ADVISORY', '03 / SETUP', '04 / WEB DEVELOPMENT',
  '05 / ROLEPLAY SERVER', '06 / MAINTENANCE', '07 / CREATOR'
];

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
    const grid = page.locator('.svo-services-grid');
    await expect(grid.locator('.svo-offer-media > span')).toHaveText(serviceOrder);
    const layout = await grid.evaluate(node => {
      const bounds = node.getBoundingClientRect();
      const rows = [];
      for (const card of node.children) {
        const rect = card.getBoundingClientRect();
        const prev = rows.at(-1);
        if (!prev || Math.abs(prev.top - rect.top) > 1) {
          rows.push({ top: rect.top, left: rect.left, right: rect.right, count: 1 });
        } else {
          prev.right = rect.right;
          prev.count++;
        }
      }
      return {
        rows: rows.map(row => row.count),
        fillsGrid: rows.every(row => Math.abs(row.left - bounds.left) <= 1 && Math.abs(row.right - bounds.right) <= 1),
        touchTargets: [...node.querySelectorAll('.svo-offer-link')]
          .every(link => link.getBoundingClientRect().height >= 44)
      };
    });
    const expectedRows = width <= 760 ? [1, 1, 1, 1, 1, 1, 1]
      : width <= 1024 ? [1, 2, 2, 2]
        : width <= 1260 ? [2, 2, 3] : [3, 4];
    expect(layout.rows).toEqual(expectedRows);
    expect(layout.fillsGrid).toBe(true);
    if (width <= 1024) expect(layout.touchTargets).toBe(true);
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
    first: getComputedStyle(node.firstElementChild).gridColumnStart,
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

test('floating arrows let mobile visitors reach both ends of every public page', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of ['/', '/jasa-server-fivem/', '/jasa-rakit-pc/', '/jasa-pembuatan-website/']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const controls = page.getByRole('group', { name: 'Gulir halaman' });
    const down = controls.getByRole('button', { name: 'Ke bawah halaman' });
    const up = controls.getByRole('button', { name: 'Ke atas halaman' });
    await expect(controls.locator('svg')).toHaveCount(2);
    const target = await down.boundingBox();
    expect(target.height).toBeGreaterThanOrEqual(44);
    expect(target.width).toBeGreaterThanOrEqual(44);
    if (path === '/') {
      const whatsApp = await page.locator('.floating-whatsapp').boundingBox();
      expect(target.y + target.height).toBeLessThan(whatsApp.y);
      const musicToggle = page.locator('#svoMusicCollapse');
      await musicToggle.click();
      await expect.poll(async () => {
        const player = await page.locator('#svoMusicPlayer').boundingBox();
        const arrows = await controls.boundingBox();
        return arrows.y + arrows.height < player.y;
      }).toBe(true);
      await musicToggle.click();
    }
    await down.click();
    await expect.poll(() => page.evaluate(() => {
      const root = document.scrollingElement;
      return root.scrollHeight - root.clientHeight - root.scrollTop;
    })).toBeLessThanOrEqual(2);
    await up.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  }
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
