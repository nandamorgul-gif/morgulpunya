const { test, expect } = require('@playwright/test');

test('services-first landing keeps the existing music and PC Builder', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('Teknologi yang kamu butuhkan');
  await expect(page.locator('#svoServicesTitle')).toBeVisible();
  await expect(page.locator('.svo-offer')).toHaveCount(7);
  await expect(page.locator('#svoDigitalTitle')).toContainText('website');
  await expect(page.locator('#svoRoleplayTitle')).toContainText('GTA 5 Roleplay');
  await expect(page.locator('#svoPaymentTitle')).toContainText('Metode Pembayaran');
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
  await page.locator('#contactPaymentMethod').selectOption('BCA');
  await page.locator('#contactMessage').fill('Butuh website mobile-friendly dengan 5 halaman, form kontak, dan SEO dasar.');
  await page.locator('.svo-service-submit').click();
  await expect(page.locator('#svoContactStatus')).toContainText('Brief sudah disiapkan');
  const url = await page.evaluate(() => window.__consultationLink);
  expect(url).toContain('https://wa.me/6288291967659?text=');
  const content = decodeURIComponent(url.split('?text=')[1]);
  expect(content).toContain('Pembuatan Website');
  expect(content).toContain('Website profil untuk studio kreatif');
  expect(content).toContain('Rp1–5 juta');
  expect(content).toContain('BCA');
  expect(content).toContain('hosting, domain');
  expect(content).toContain('bukan pembayaran atau pesanan resmi');
});

test('PC consultation card automatically selects PC service in the form', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-svo-service="Rakit PC Custom"]').first().click();
  await expect(page.locator('#contactService')).toHaveValue('Rakit PC Custom');
  await expect(page.locator('#contactSubject')).toHaveValue('Konsultasi Rakit PC Custom');
});

test('GTA 5 roleplay CTA chooses service and includes separate VPS and Jago preference', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    window.__consultationLink = '';
    window.open = url => { window.__consultationLink = url; return null; };
  });
  await page.locator('#roleplay [data-svo-service="Pembuatan Server GTA 5 Roleplay"]').click();
  await expect(page.locator('#contactService')).toHaveValue('Pembuatan Server GTA 5 Roleplay');
  await page.locator('#contactName').fill('Penguji RP');
  await page.locator('#contactEmail').fill('081234567890');
  await page.locator('#contactSubject').fill('Setup server roleplay 32 slot');
  await page.locator('#contactPaymentMethod').selectOption('Bank Jago');
  await page.locator('#contactMessage').fill('Ingin server GTA Roleplay FiveM untuk komunitas baru dengan konfigurasi awal.');
  await page.locator('.svo-service-submit').click();
  const text = decodeURIComponent((await page.evaluate(() => window.__consultationLink)).split('?text=')[1]);
  expect(text).toContain('Pembuatan Server GTA 5 Roleplay');
  expect(text).toContain('Bank Jago');
  expect(text).toContain('hosting/VPS');
  expect(text).toContain('bukan pembayaran');
});

test('payment preferences list all requested services without exposing fake bank details', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const methods = page.locator('#pembayaran .svo-payment-method strong');
  await expect(methods).toHaveCount(5);
  await expect(methods).toHaveText(['BCA', 'Mandiri', 'SeaBank', 'Bank Jago', 'DANA']);
  await expect(page.locator('#orderPreferredPayment option[value="DANA"]')).toHaveCount(1);
  await expect(page.locator('#contactPaymentMethod option[value="SeaBank"]')).toHaveCount(1);
  await expect(page.locator('.svo-payment-note')).toContainText('Belum ada instruksi transfer');
  await expect(page.locator('#digital .svo-web-exclusion')).toContainText('hosting');
});

test('five PC build presets include compatible Compact White Mini-ITX with estimated prices', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.preset-card')).toHaveCount(5);
  await expect(page.locator('#preset')).toContainText('SVO COMPACT WHITE');
  await expect(page.locator('#svoMusicPlayer')).toHaveClass(/is-collapsed/);
});
