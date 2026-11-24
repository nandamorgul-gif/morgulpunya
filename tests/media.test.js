'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('native background music includes local audio, loop and accessible controls', () => {
  const html = source('index.html');
  for (const id of ['svoMusicPlayer', 'svoMusicCollapse', 'svoMusicContent', 'svoMusicAudio',
    'svoMusicPlay', 'svoMusicPause', 'svoMusicMute', 'svoMusicVolume', 'svoMusicVolumeValue',
    'svoMusicClose', 'svoMusicStatus']) {
    assert.match(html, new RegExp('id="' + id + '"'), 'missing music control: ' + id);
  }
  const audio = html.match(/<audio\b[^>]*id="svoMusicAudio"[^>]*>/)[0];
  assert.match(audio, /src="\/images\/svo-background\.m4a"/);
  assert.match(audio, /\bloop\b/);
  const bytes = fs.readFileSync(path.join(__dirname, '..', 'images/svo-background.m4a'));
  assert.ok(bytes.length > 0 && bytes.length < 25 * 1024 * 1024);
  assert.equal(bytes.toString('ascii', 4, 8), 'ftyp');
  assert.match(html, /<input[^>]*id="svoMusicVolume"[^>]*min="0"[^>]*max="100"[^>]*value="30"/);
  assert.match(html, /<div[^>]*id="svoMusicContent"[^>]*hidden/);
  assert.doesNotMatch(html, /youtube\.com\/(?:embed\/|iframe_api)/);
});

function musicFixture({ blocked = false, saved = null } = {}) {
  const vm = require('node:vm');
  const html = source('index.html');
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map(match => match[1]).find(code => code.includes("const key='svo-native-music-v1'"));
  assert.ok(script, 'native audio controller not found');
  function element() {
    const listeners = new Map();
    const attributes = new Map();
    const classes = new Set();
    return {
      hidden: false, disabled: false, value: '', textContent: '', title: '',
      addEventListener(type, callback) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(callback);
      },
      emit(type, data = {}) { for (const cb of listeners.get(type) || []) cb(data); },
      setAttribute(name, val) { attributes.set(name, String(val)); },
      getAttribute(name) { return attributes.get(name); },
      focus() {},
      classList: {
        toggle(name, value) { if (value) classes.add(name); else classes.delete(name); },
        contains(name) { return classes.has(name); }
      }
    };
  }
  const ids = ['svoMusicPlayer', 'svoMusicAudio', 'svoMusicCollapse', 'svoMusicContent',
    'svoMusicPlay', 'svoMusicPause', 'svoMusicMute', 'svoMusicVolume', 'svoMusicVolumeValue',
    'svoMusicStatus', 'svoSupport', 'svoMusicClose'];
  const elements = Object.fromEntries(ids.map(id => [id, element()]));
  elements.svoMusicContent.hidden = true;
  const audio = elements.svoMusicAudio;
  let starts = 0, allowed = !blocked, stored = saved;
  Object.assign(audio, {
    paused: true, volume: 1, muted: false, error: null,
    async play() {
      starts++;
      if (!allowed) throw Object.assign(new Error('Autoplay blocked'), { name: 'NotAllowedError' });
      this.paused = false; this.emit('play');
    },
    pause() { this.paused = true; this.emit('pause'); }
  });
  const document = element();
  document.getElementById = id => elements[id];
  const localStorage = { getItem: () => stored, setItem: (_key, value) => { stored = value; } };
  vm.runInNewContext(script, { document, localStorage });
  return { elements, audio, starts: () => starts, allow: () => { allowed = true; },
    stored: () => JSON.parse(stored), settle: () => new Promise(resolve => setImmediate(resolve)) };
}

test('native audio autoplay, volume, minimize, mute and pause behave correctly', async () => {
  const f = musicFixture();
  await f.settle();
  const e = f.elements;
  assert.equal(f.starts(), 1);
  assert.equal(f.audio.paused, false);
  assert.equal(f.audio.volume, 0.3);
  assert.equal(e.svoMusicContent.hidden, true);
  e.svoMusicCollapse.emit('click');
  assert.equal(e.svoMusicContent.hidden, false);
  e.svoMusicVolume.value = '75';
  e.svoMusicVolume.emit('input');
  assert.equal(f.audio.volume, 0.75);
  assert.equal(e.svoMusicVolumeValue.value, '75%');
  assert.equal(f.stored().volume, 75);
  e.svoMusicClose.emit('click');
  assert.equal(e.svoMusicContent.hidden, true);
  assert.equal(f.audio.paused, false);
  e.svoMusicMute.emit('click');
  assert.equal(f.audio.muted, true);
  e.svoMusicPause.emit('click');
  assert.equal(f.audio.paused, true);
  assert.equal(f.stored().paused, true);
  e.svoMusicPlay.emit('click');
  await f.settle();
  assert.equal(f.audio.paused, false);
  assert.equal(f.audio.muted, false);
});

test('autoplay rejection leaves explicit Play usable and saved pause is respected', async () => {
  const f = musicFixture({ blocked: true });
  await f.settle();
  assert.equal(f.audio.paused, true);
  assert.match(f.elements.svoMusicStatus.textContent, /Tekan Putar/);
  assert.equal(f.elements.svoMusicPlay.disabled, false);
  f.allow();
  f.elements.svoMusicPlay.emit('click');
  await f.settle();
  assert.equal(f.audio.paused, false);
  const saved = musicFixture({ saved: JSON.stringify({ paused: true, muted: true, volume: 40 }) });
  await saved.settle();
  assert.equal(saved.starts(), 0);
  assert.equal(saved.audio.volume, 0.4);
  assert.equal(saved.audio.muted, true);
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
