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
    img.src = '/images/missing-product-photo.jpg';
  });
  await expect(card).toHaveClass(/svo-card-without-photo/);
  await expect(card).toBeHidden();
  await expect(page.locator('#svoShopCartCount')).toHaveText('1');
});

test('missing builder and preset pictures leave configuration controls visible', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const component = page.locator('.component-card').first();
  await component.scrollIntoViewIfNeeded(); // loading=lazy starts only near the viewport
  await component.locator('img.component-img').evaluate(img => { img.src = '/images/missing-builder-photo.jpg'; });
  await expect(component).toHaveClass(/svo-card-without-photo/);
  await expect(component.locator('.select-part-btn')).toBeVisible();

  const preset = page.locator('.preset-card').last();
  await preset.scrollIntoViewIfNeeded();
  await preset.locator('img.preset-image').evaluate(img => { img.src = '/images/missing-preset-photo.jpg'; });
  await expect(preset).toHaveClass(/svo-card-without-photo/);
  await expect(preset.locator('.svo-preset-caption')).toBeHidden();
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

test('admin access and local roleplay artwork are present in the deployed site', async ({page}) => {
  await page.goto('/', {waitUntil:'domcontentloaded'});
  await expect(page.locator('.svo-admin-entry')).toHaveAttribute('href','/admin');
  await expect(page.locator('.svo-roleplay-media img')).toHaveAttribute('src','images/gta-roleplay-scene.svg');
  await expect(page.locator('.svo-roleplay-media img')).toHaveJSProperty('complete',true);
  await page.goto('/admin.html', {waitUntil:'domcontentloaded'});
  await expect(page.locator('#loginForm input[name="email"]')).toBeVisible();
  await expect(page.locator('#loginForm input[name="password"]')).toBeVisible();
});
