const { test, expect } = require('@playwright/test');

test('services-first landing keeps the existing music and PC Builder', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('Teknologi yang kamu butuhkan');
  await expect(page.locator('#svoServicesTitle')).toBeVisible();
  await expect(page.locator('.svo-offer')).toHaveCount(6);
  await expect(page.locator('#svoDigitalTitle')).toContainText('website');
  await expect(page.locator('#rakit-pc')).toBeAttached();
  await expect(page.locator('#svoMusicPlayer')).toHaveClass(/is-collapsed/);
  await expect(page.locator('a[href="https://www.youtube.com/watch?v=8_y6w1V9PXs"]')).toHaveCount(1);
  await expect(page.locator('.svo-product')).toHaveCount(46);
});

test('web development CTA creates a service-specific WhatsApp brief, not a paid order', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.__consultationLink = null;
    window.open = url => { window.__consultationLink = url; return null; };
  });
  await page.locator('#digital [data-svo-service="Pembuatan Website"]').click();
  await expect(page.locator('#contactService')).toHaveValue('Pembuatan Website');
  await page.locator('#contactName').fill('Penguji SEMEISTVO');
  await page.locator('#contactEmail').fill('081234567890');
  await page.locator('#contactSubject').fill('Website profil untuk studio kreatif');
  await page.locator('#contactBudget').selectOption('Rp1–5 juta');
  await page.locator('#contactMethod').selectOption('Remote/online');
  await page.locator('#contactMessage').fill('Butuh website mobile-friendly dengan 5 halaman, form kontak, dan SEO dasar.');
  await page.locator('.svo-service-submit').click();
  await expect(page.locator('#svoContactStatus')).toContainText('Brief sudah disiapkan');
  const url = await page.evaluate(() => window.__consultationLink);
  expect(url).toContain('https://wa.me/6288291967659?text=');
  const content = decodeURIComponent(url.split('?text=')[1]);
  expect(content).toContain('Pembuatan Website');
  expect(content).toContain('Website profil untuk studio kreatif');
  expect(content).toContain('Rp1–5 juta');
  expect(content).toContain('bukan pembayaran atau pesanan resmi');
});

test('PC consultation card automatically selects PC service in the form', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-svo-service="Rakit PC Custom"]').first().click();
  await expect(page.locator('#contactService')).toHaveValue('Rakit PC Custom');
  await expect(page.locator('#contactSubject')).toHaveValue('Konsultasi Rakit PC Custom');
});
