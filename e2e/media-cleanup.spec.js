const { test, expect } = require('@playwright/test');

test('missing hardware image disappears but catalogue product and cart remain usable', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#svoProductCategory').selectOption('gpu');
  await page.locator('#svoProductSearch').fill('5060 Ti');
  const card = page.locator('.svo-product').first();
  await expect(card).toBeVisible();
  await card.locator('[data-svo-add]').click();
  await expect(page.locator('#svoShopCartCount')).toHaveText('1');
  const image = card.locator('img.svo-product-image');
  await image.evaluate(img => {
    img.dataset.svoTriedAlternate = 'yes';
    img.dataset.svoFallbackStage = '';
    img.src = '/images/missing-product-photo.jpg';
  });
  await expect(image).toHaveAttribute('src', /images\/catalog\/.+\.svg/);
  await expect(card).toBeVisible();
  await expect(page.locator('#svoShopCartCount')).toHaveText('1');
});

test('missing builder and preset pictures leave configuration controls visible', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const component = page.locator('.component-card').first();
  await component.scrollIntoViewIfNeeded(); // loading=lazy starts only near the viewport
  await component.locator('img.component-img').evaluate(img => { img.dataset.svoTriedAlternate = 'yes'; img.dataset.svoFallbackStage = ''; img.src = '/images/missing-builder-photo.jpg'; });
  await expect(component.locator('img.component-img')).toHaveAttribute('src', /images\/catalog\/.+\.svg/);
  await expect(component.locator('.select-part-btn')).toBeVisible();

  const preset = page.locator('.preset-card').last();
  await preset.scrollIntoViewIfNeeded();
  await preset.locator('img.preset-image').evaluate(img => { img.dataset.svoTriedAlternate = 'yes'; img.dataset.svoFallbackStage = ''; img.src = '/images/missing-preset-photo.jpg'; });
  await expect(preset.locator('img.preset-image')).toHaveAttribute('src', 'images/products/pcbuild.svg');
  await expect(preset.locator('.load-preset-btn')).toBeVisible();
});

test('category tiles have no generic hardware illustration placeholders', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.svo-category-tile')).toHaveCount(6);
  await expect(page.locator('.svo-category-tile img')).toHaveCount(0);
  await expect(page.locator('.svo-category-number')).toHaveCount(6);
  await page.locator('[data-svo-category-link="gpu"]').click();
  await expect(page.locator('#svoProductCategory')).toHaveValue('gpu');
});

test('original music and bank logo fallback stay unchanged after media fixes', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#svoMusicPlayer')).toHaveClass(/is-collapsed/);
  await expect(page.locator('.svo-payment-method')).toHaveCount(5);
  await expect(page.locator('.svo-payment-logo-fallback')).toHaveCount(5);
  await expect(page.locator('#svoShopCartButton')).toBeVisible();
  await expect(page.locator('#svoPresetTitle')).toBeVisible();
});

test('admin entry removed, GTA artwork served as local asset', async ({page,request}) => {
  await page.goto('/', {waitUntil:'domcontentloaded'});
  await expect(page.locator('.svo-admin-entry, .svo-admin-nav')).toHaveCount(0);
  await expect(page.locator('.svo-roleplay-media img')).toHaveAttribute('src','/images/gta-roleplay-scene.svg');
  const image = await request.get('/images/gta-roleplay-scene.svg');
  expect(image.ok()).toBe(true);
  expect((await image.text()).includes('<svg')).toBe(true);
});
