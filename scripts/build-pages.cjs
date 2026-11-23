'use strict';
/**
 * Cloudflare Pages public bundle.
 * NEVER deploy the repository root: it contains server source, internal
 * scripts, dependency manifests, and (locally) SQLite data and secrets.
 */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'dist');
const folders = ['css', 'js', 'images'];
const verificationFile = 'google7f49957bcb00f098.html';
const files = ['index.html', 'site.webmanifest', 'robots.txt', 'sitemap.xml', verificationFile, 'jasa-server-fivem/index.html'];
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const folder of folders) {
  fs.cpSync(path.join(root, folder), path.join(output, folder), { recursive: true });
}
for (const file of files) {
  const destination = path.join(output, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(path.join(root, file), destination);
}
// Serve the exact verification URL with 200 instead of redirecting to the extensionless URL.
fs.writeFileSync(path.join(output, '_redirects'), `/${verificationFile} /${path.basename(verificationFile, '.html')} 200\n`);
fs.writeFileSync(path.join(output, '_routes.json'), JSON.stringify({version:1,include:['/api/*'],exclude:[]},null,2)+'\n');
fs.writeFileSync(path.join(output, '_headers'), [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  X-Frame-Options: DENY',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  ''
].join('\n'));
fs.writeFileSync(path.join(output, '404.html'),
  '<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404 — SEMEISTVO TECH</title><body style="font-family:system-ui;background:#0c0b13;color:#fff;text-align:center;padding:15vh 1rem"><h1>404</h1><p>Halaman tidak ditemukan.</p><a style="color:#c5a1fa" href="/">Kembali ke SEMEISTVO TECH</a></body></html>');
const all = fs.readdirSync(output);
if (all.some(entry => ['server', 'runtime-data', '.env', 'package.json', 'node_modules', 'functions', 'db'].includes(entry))) {
  throw Error('Refusing to publish private server assets');
}
if (fs.existsSync(path.join(output, 'admin.html'))) throw Error('Public admin login must not be published');
if (!fs.existsSync(path.join(output, 'images/gta-roleplay-night.jpg'))) throw Error('Missing local GTA Roleplay artwork');
if (!fs.existsSync(path.join(output, 'images/favicon.svg'))) throw Error('Missing public favicon');
console.log('Safe Cloudflare Pages bundle created in dist/');
