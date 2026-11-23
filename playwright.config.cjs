const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 40_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  webServer: {
    command: 'node server/app.js',
    url: 'http://127.0.0.1:3000/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 40_000,
    env: {
      NODE_ENV: 'development',
      PORT: '3000',
      ADMIN_EMAIL: 'testadmin@example.com',
      ADMIN_PASSWORD: 'testing-only-admin-password-12345',
      SEED_DEMO_STOCK: '0',
      MIDTRANS_SERVER_KEY: '',
      DATA_DIR: './runtime-data-e2e'
    }
  }
});
