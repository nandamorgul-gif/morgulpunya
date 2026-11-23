'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('music player restored with original video, controls and autoplay fallback', () => {
  const html = source('index.html');
  const music = source('js/music.js');
  for (const id of ['svoMusicPlayer', 'svoMusicCollapse', 'svoMusicPlay',
    'svoMusicPause', 'svoMusicVideoSlot', 'svoMusicStatus']) {
    assert.match(html, new RegExp('id="' + id + '"'), 'missing music control: ' + id);
  }
  assert.match(html, /js\/music\.js/);
  assert.match(html, /css\/music\.css/);
  assert.match(music, /8_y6w1V9PXs/);
  assert.match(music, /autoplay: 1/);
  assert.match(music, /mute: 1/);
  assert.match(music, /svoMusicMute/);
  assert.match(music, /pauseVideo\(\)/);
  assert.doesNotMatch(music, /document\.addEventListener\('mousemove'/);
});

test('all hardware products have local WebP photos and a source credit', () => {
  const data = require('../js/product-photos.js')(require('../js/data.js'));
  const products = Object.values(data.components).flat();
  const photoProducts = products.filter(p => p.imageType === 'reference-photo');
  assert.equal(products.length, 46);
  for (const p of products) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'images/catalog/' + p.id + '.svg')), p.id);
    assert.ok(p.image && p.fallbackImage, p.id);
  }
  assert.equal(photoProducts.length, 43);
  for (const p of photoProducts) {
    assert.equal(p.image, 'images/catalog/photos/' + p.id + '.webp');
    const bytes = fs.readFileSync(path.join(__dirname, '..', p.image));
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF', p.id);
    assert.equal(bytes.toString('ascii', 8, 12), 'WEBP', p.id);
    assert.match(p.imageCreditUrl, /^https:\/\//i, p.id);
    assert.equal(p.fallbackImage, 'images/catalog/' + p.id + '.svg');
    assert.ok(fs.existsSync(path.join(__dirname, '..', p.fallbackImage)), p.id);
  }
});

test('product renderers hide unavailable photos without injecting generic artwork', () => {
  assert.match(source('js/store.js'), /Sumber foto referensi/);
  assert.match(source('js/store.js'), /showImage\(p\)/);
  assert.match(source('js/app.js'), /data-svo-fallback/);
  const media = source('js/product-photos.js');
  assert.match(media, /hideUnavailableMedia/);
  assert.match(media, /svo-card-without-photo/);
  assert.match(media, /image.hidden = true/);
  assert.match(source('css/polish.css'), /svo-media-unavailable/);
});
