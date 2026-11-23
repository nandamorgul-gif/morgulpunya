const { test, expect } = require('@playwright/test');

test('rakitan PC recommendations precede PC Builder without duplicate IDs', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const preset = page.locator('#preset');
  const builder = page.locator('#rakit-pc');
  await expect(preset).toHaveCount(1);
  await expect(builder).toHaveCount(1);
  await expect(page.locator('#presetsContainer')).toHaveCount(1);
  await expect(page.locator('.preset-card')).toHaveCount(5);
  const order = await page.evaluate(() => {
    const a = document.getElementById('preset');
    const b = document.getElementById('rakit-pc');
    return !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(order).toBe(true);
  await expect(preset.locator('.svo-preset-next a[href="#rakit-pc"]')).toBeVisible();
});

test('payment logos are real brand files, payment options remain informational', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const section = page.locator('#pembayaran');
  await expect(section).toHaveCount(1);
  const cards = section.locator('.svo-payment-method');
  await expect(cards).toHaveCount(5);
  await expect(cards.locator('strong')).toHaveText(['BCA', 'Mandiri', 'SeaBank', 'Bank Jago', 'DANA']);
  const images = section.locator('.svo-payment-logo-frame img');
  await expect(images).toHaveCount(5);
  const sources = await images.evaluateAll(nodes => nodes.map(node => node.getAttribute('src')));
  const expected = [
    'Bank_Central_Asia.svg',
    'Bank_Mandiri_logo_2016.svg',
    'SeaBank.svg',
    'Bank_Jago_2026.svg',
    'Logo_dana_blue.svg'
  ];
  expect(sources).toEqual(expected.map(file => 'https://commons.wikimedia.org/wiki/Special:FilePath/' + file));
  await expect(section.locator('.svo-payment-note')).toContainText('Belum ada instruksi transfer');
  await expect(page.locator('#svoMusicPlayer')).toHaveCount(1);
  await expect(page.locator('#svoShopCartButton')).toHaveCount(1);
});
