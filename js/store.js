/** SEMEISTVO TECH · Catalogue + local shopping cart.
 * This is a consultation checkout prototype. It does not charge money,
 * reserve inventory, or create verified orders. Production requires backend.
 */
document.addEventListener('DOMContentLoaded', () => {
  const db = window.PC_DATA;
  const layer = document.getElementById('svoCartLayer');
  const grid = document.getElementById('svoProductGrid');
  if (!db || !grid || !layer) return;

  const formatPrice = n => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
  let products = Object.entries(db.components).flatMap(([category, items]) => items.map(product => ({ ...product, category })));
  let productMap = new Map(products.map(item => [item.id, item]));
  let serverCheckoutEnabled = false;
  let serverCatalogAvailable = false;
  const els = {
    search: document.getElementById('svoProductSearch'),
    category: document.getElementById('svoProductCategory'),
    sort: document.getElementById('svoProductSort'),
    total: document.getElementById('svoProductCount'),
    count: document.getElementById('svoShopCartCount'),
    cartList: document.getElementById('svoCartItems'),
    cartTotal: document.getElementById('svoCartTotal'),
    cartView: document.getElementById('svoCartView'),
    checkoutView: document.getElementById('svoCheckoutView'),
    checkout: document.getElementById('svoCheckoutForm')
  };
  const storageKey = 'svo-tech-cart-v1';
  let cart = {};
  let builderSelections = {}; // Category -> SKU id from PC Builder; manual cart is separate.
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      Object.keys(stored).forEach(id => {
        const qty = Number(stored[id]);
        if (productMap.has(id) && Number.isInteger(qty) && qty > 0) cart[id] = Math.min(qty, 20);
      });
    }
  } catch (_) { /* cart still works when storage is unavailable */ }
  const persist = () => { try { localStorage.setItem(storageKey, JSON.stringify(cart)); } catch (_) {} };
  const entries = () => {
    const combined = new Map();
    for (const [id, qty] of Object.entries(cart)) {
      const product = productMap.get(id);
      if (!product || qty < 1) continue;
      combined.set(id, { product, qty, manualQty: qty, builderQty: 0, builderCategory: null });
    }
    for (const [category, id] of Object.entries(builderSelections)) {
      const product = productMap.get(id);
      if (!product || product.category !== category) continue;
      const entry = combined.get(id) || { product, qty: 0, manualQty: 0, builderQty: 0, builderCategory: null };
      entry.qty += 1; entry.builderQty = 1; entry.builderCategory = category;
      combined.set(id, entry);
    }
    return [...combined.values()];
  };
  const subtotal = () => entries().reduce((sum, { product, qty }) => sum + product.price * qty, 0);
  const count = () => entries().reduce((sum, { qty }) => sum + qty, 0);
  const canPayOnline = () => {
    const items = entries();
    return serverCheckoutEnabled && items.length > 0 && items.every(({ product, qty }) =>
      Number.isInteger(product.stock) && product.stock >= qty
    );
  };
  const syncPaymentMode = () => {
    const online = canPayOnline();
    const note = document.querySelector('#svoCheckoutView > p');
    const submit = els.checkout.querySelector('button[type="submit"]');
    const email = document.getElementById('svoCheckoutEmail');
    const emailLabel = els.checkout.querySelector('label[for="svoCheckoutEmail"]');
    if (submit) submit.textContent = online ? 'Lanjutkan ke Pembayaran Resmi' : 'Kirim Permintaan via WhatsApp';
    if (email) email.required = online;
    if (emailLabel) emailLabel.hidden = !online;
    if (note) note.textContent = online
      ? 'Periksa data dan alamat. Pembayaran hanya melalui gateway resmi dengan verifikasi server.'
      : 'Ini keranjang konsultasi. Harga dan stok perlu dikonfirmasi admin, belum ada tagihan atau pembayaran.';
  };
  const toggleView = checkout => {
    els.cartView.hidden = checkout;
    els.checkoutView.hidden = !checkout;
    document.getElementById('svoCartTitle').textContent = checkout ? 'Detail Permintaan Pesanan' : 'Keranjang Belanja';
  };
  const openCart = () => {
    toggleView(false);
    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('svo-cart-open');
    document.getElementById('svoCloseCart').focus();
  };
  const closeCart = () => {
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('svo-cart-open');
  };
  const showImage = p => {
    const matched = window.SVO_PHOTOS?.[p.id];
    const current = typeof p.image === 'string' ? p.image : '';
    const reference = matched?.local || matched?.url;
    // Both old deployments and new seeds can supply catalogue image paths.
    const oldDefault = !current || /^images\/(?:products|catalog)\/[a-z0-9-]+\.svg$/.test(current)
      || current === matched?.url || current === matched?.alternate?.url;
    const categoryArtwork = 'images/products/' + (db.components[p.category] ? p.category : 'accessories') + '.svg';
    const image = oldDefault ? reference || current || categoryArtwork : current;
    return {
      image,
      credit: image === reference ? matched.credit : (image === p.image ? p.imageCreditUrl : null),
      photo: image === matched?.local || /^https:\/\//i.test(image),
      servicePhoto: matched?.kind === 'service-photo' && image === reference,
      fallback: 'images/catalog/' + p.id + '.svg',
      finalFallback: categoryArtwork
    };
  };
  const renderProducts = () => {
    // Only a supplier-confirmed stock=0 hides a product. Seeded stock=0
    // means availability is unverified, not necessarily unavailable.
    let list = products.filter(p => p.active !== 0 && p.active !== false && !(p.stock_live === true && p.stock === 0));
    const query = els.search.value.trim().toLowerCase();
    if (query) list = list.filter(p => (p.name + ' ' + p.brand + ' ' + p.description).toLowerCase().includes(query));
    if (els.category.value !== 'all') list = list.filter(p => p.category === els.category.value);
    if (els.sort.value === 'low') list.sort((a, b) => a.price - b.price);
    if (els.sort.value === 'high') list.sort((a, b) => b.price - a.price);
    if (els.sort.value === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    els.total.textContent = list.length + ' komponen ditemukan';
    grid.innerHTML = list.length ? list.map(p => {
      const picture = showImage(p);
      const pictureLabel = picture.servicePhoto ? 'Foto ilustrasi layanan' : picture.photo ? 'Foto referensi model' : 'Ilustrasi model';
      return `
      <article class="svo-product" data-svo-category="${escapeHTML(p.category)}">
        <div class="svo-product-media ${picture.servicePhoto ? 'has-service-photo' : picture.photo ? 'has-photo' : 'has-illustration'}">
          <img src="${escapeHTML(picture.image)}"
               data-svo-fallback="${escapeHTML(picture.fallback)}" data-svo-final-fallback="${escapeHTML(picture.finalFallback)}"
               alt="${pictureLabel}: ${escapeHTML(p.name)}"
               class="svo-product-image" loading="lazy" width="600" height="400">
          <span class="svo-illustration-chip">${pictureLabel}</span>
        </div>
        <div class="svo-product-body">
          <span class="svo-product-brand">${escapeHTML(p.brand)} · ${escapeHTML((db.categories.find(c => c.id === p.category) || {}).name || p.category)}</span>
          <h3 class="svo-product-name">${escapeHTML(p.name)}</h3>
          <p class="svo-product-description">${escapeHTML(p.description)}</p>
          ${picture.credit ? `<a class="svo-photo-credit" href="${escapeHTML(picture.credit)}" target="_blank" rel="noopener noreferrer">Sumber foto referensi ↗</a>` : ''}
          <span class="svo-stock-status">${serverCatalogAvailable ? (p.stock > 0 ? 'Stok tercatat: ' + p.stock : 'Stok belum tersedia') : 'Tanyakan ketersediaan'}</span>
          <p class="svo-product-price"><span class="svo-price-caption">${p.price_live ? 'Harga pemasok terverifikasi' : p.price_source === 'dprice' ? 'Estimasi pasar DPrice (maks. 7 hari)' : p.price_source === 'serpapi' ? (p.price_method === 'google_search' ? 'Estimasi Google Search — 1 toko' + (p.price_variant === 'box' ? ' (Box)' : p.price_variant === 'tray' ? ' (Tray)' : '') : 'Estimasi pasar Google Shopping') : 'Harga referensi / estimasi'}</span><br>${formatPrice(p.price)}</p>
          <button class="svo-store-btn" type="button" data-svo-add="${escapeHTML(p.id)}">${serverCatalogAvailable && p.stock < 1 ? '+ Tanya Stok via Keranjang' : '+ Tambah ke Keranjang'}</button>
        </div>
      </article>`;
    }).join('') : '<p class="svo-cart-empty">Tidak ada produk yang sesuai dengan pencarian.</p>';
  };
  const renderFeatured = () => {
    const container = document.getElementById('svoFeaturedGrid');
    if (!container) return;
    const picks = ['gpu-rtx5060ti16', 'cpu-r7-9850x3d', 'gpu-rx9060xt16', 'case-ch160-white'];
    const available = picks.map(id => productMap.get(id)).filter(Boolean);
    container.innerHTML = available.map(p => {
      const picture = showImage(p);
      return `
        <article class="svo-featured-card">
          <div class="svo-featured-image">
            <img src="${escapeHTML(picture.image)}" data-svo-fallback="${escapeHTML(picture.fallback)}"
              data-svo-final-fallback="${escapeHTML(picture.finalFallback)}" width="640" height="640"
              loading="lazy" alt="${escapeHTML(p.name)} — foto referensi atau ilustrasi model">
            <span>${picture.photo ? "Foto referensi" : "Ilustrasi model"}</span>
          </div>
          <div class="svo-featured-info">
            <small>${escapeHTML(p.brand)} / 2026</small>
            <h3>${escapeHTML(p.name)}</h3>
            <p>Estimasi ${formatPrice(p.price)}</p>
            <button type="button" class="svo-featured-link" data-svo-featured-id="${escapeHTML(p.id)}">Lihat di katalog ↗</button>
          </div>
        </article>`;
    }).join('');
  };
  const renderCart = () => {
    const items = entries();
    els.count.textContent = String(count());
    els.cartTotal.textContent = formatPrice(subtotal());
    els.cartList.innerHTML = items.length ? items.map(({product:p, qty, manualQty, builderQty}) => `
      <div class="svo-cart-item">
        <img src="${escapeHTML(showImage(p).image)}" data-svo-fallback="${escapeHTML(showImage(p).fallback)}"
             data-svo-final-fallback="${escapeHTML(showImage(p).finalFallback)}" alt="${escapeHTML(p.name)}" loading="lazy">
        <div class="svo-cart-item-main">
          <strong>${escapeHTML(p.name)}</strong>
          ${builderQty ? '<span class="svo-builder-cart-tag">Dari PC Builder · 1 unit</span>' : ''}
          ${manualQty ? '<span class="svo-manual-cart-tag">Dari katalog · ' + manualQty + ' unit</span>' : ''}
          <p class="svo-cart-item-price">${formatPrice(p.price)} × ${qty}</p>
          <div class="svo-cart-qty">
            <button type="button" aria-label="Kurangi ${escapeHTML(p.name)}" data-svo-delta="-1" data-svo-id="${escapeHTML(p.id)}">−</button>
            <span aria-label="Jumlah ${escapeHTML(p.name)}">${qty}</span>
            <button type="button" aria-label="Tambah ${escapeHTML(p.name)}" data-svo-delta="1" data-svo-id="${escapeHTML(p.id)}">+</button>
            <button type="button" class="svo-cart-remove" data-svo-remove="${escapeHTML(p.id)}">Hapus</button>
          </div>
        </div>
      </div>`).join('') : '<p class="svo-cart-empty">Keranjang masih kosong. Pilih komponen di PC Builder atau katalog.</p>';
    document.getElementById('svoCheckoutButton').disabled = !items.length;
    syncPaymentMode();
  };
  const setQty = (id, qty) => {
    if (!productMap.has(id)) return;
    const n = Math.max(0, Math.min(20, qty));
    if (!n) delete cart[id]; else cart[id] = n;
    persist(); renderCart();
  };
  const removeBuilderPart = id => {
    const entry = Object.entries(builderSelections).find(([category, sku]) => (
      sku === id && productMap.get(id)?.category === category
    ));
    if (!entry) return;
    document.dispatchEvent(new CustomEvent('svo:builder-remove', { detail: { category: entry[0], id } }));
  };
  const updateBuilderCart = payload => {
    const next = {};
    for (const [category, id] of Object.entries(payload || {})) {
      const product = productMap.get(id);
      if (product && product.category === category) next[category] = id;
    }
    builderSelections = next;
    renderCart();
  };
  updateBuilderCart(window.SVOBuilderSelections || {});
  document.addEventListener('svo:builder-change', event => updateBuilderCart(event.detail?.selections));
  db.categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    els.category.appendChild(opt);
  });
  const featuredGrid = document.getElementById('svoFeaturedGrid');
  featuredGrid?.addEventListener('click', event => {
    const button = event.target.closest('[data-svo-featured-id]');
    if (!button) return;
    const item = productMap.get(button.dataset.svoFeaturedId);
    if (!item) return;
    els.category.value = item.category;
    els.search.value = item.name;
    els.sort.value = 'default';
    renderProducts();
    document.getElementById('svo-shop')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  document.querySelectorAll('[data-svo-category-link]').forEach(link => {
    link.addEventListener('click', () => {
      const category = link.dataset.svoCategoryLink;
      if (!db.categories.some(c => c.id === category)) return;
      els.category.value = category;
      els.search.value = '';
      els.sort.value = 'default';
      renderProducts();
    });
  });

  grid.addEventListener('click', e => {
    const add = e.target.closest('[data-svo-add]');
    if (!add) return;
    const id = add.dataset.svoAdd;
    if (!productMap.has(id)) return;
    setQty(id, (cart[id] || 0) + 1);
    add.textContent = '✓ Ditambahkan';
    setTimeout(() => { if (add.isConnected) add.textContent = '+ Tambah ke Keranjang'; }, 1000);
  });
  els.cartList.addEventListener('click', e => {
    const remove = e.target.closest('[data-svo-remove]');
    if (remove) {
      const id = remove.dataset.svoRemove;
      setQty(id, 0);
      removeBuilderPart(id);
      return;
    }
    const button = e.target.closest('[data-svo-delta]');
    if (!button) return;
    const id = button.dataset.svoId;
    const delta = Number(button.dataset.svoDelta);
    if (delta === -1 && !(cart[id] > 0)) removeBuilderPart(id);
    else if (delta === 1 || delta === -1) setQty(id, (cart[id] || 0) + delta);
  });
  [els.search, els.category, els.sort].forEach(el => el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', renderProducts));
  document.getElementById('svoShopCartButton').addEventListener('click', openCart);
  document.getElementById('svoOpenCartFromShop').addEventListener('click', openCart);
  document.getElementById('svoCloseCart').addEventListener('click', closeCart);
  document.getElementById('svoCartOverlay').addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && layer.classList.contains('is-open')) closeCart(); });
  document.getElementById('svoCheckoutButton').addEventListener('click', () => { if (entries().length) toggleView(true); });
  document.getElementById('svoBackToCart').addEventListener('click', () => toggleView(false));
  els.checkout.addEventListener('submit', async e => {
    e.preventDefault();
    if (!els.checkout.reportValidity() || !entries().length) return;
    const fields = new FormData(els.checkout);
    const name = String(fields.get('name') || '').trim();
    const phone = String(fields.get('phone') || '').replace(/[\s-]/g, '');
    const address = String(fields.get('address') || '').trim();
    const notes = String(fields.get('notes') || '').trim();
    const email = String(fields.get('email') || '').trim();
    if (!/^[+0-9]{8,17}$/.test(phone)) {
      document.getElementById('svoCheckoutStatus').textContent = 'Periksa kembali nomor WhatsApp.';
      return;
    }
    const status = document.getElementById('svoCheckoutStatus');
    // When the server and sandbox/provider are configured, submit a real server-side
    // inventory reservation and create payment using authoritative server prices.
    if (canPayOnline()) {
      if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
        status.textContent = 'Masukkan email yang valid untuk pembayaran.';
        return;
      }
      const submit = els.checkout.querySelector('button[type="submit"]');
      submit.disabled = true;
      status.textContent = 'Memeriksa stok dan membuat tautan pembayaran resmi...';
      try {
        const response = await fetch('/api/orders', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: entries().map(({product,qty}) => ({id:product.id,quantity:qty})),
            customer: { name, phone, email, address, notes }
          })
        });
        const data = await response.json();
        if (!response.ok) throw Error(data.error || 'Tidak dapat membuat pesanan.');
        if (!data.order?.id || !data.order?.payment_url || !data.access_token) throw Error('Respons pembayaran tidak lengkap.');
        try {
          localStorage.setItem('svo-last-order', JSON.stringify({
            id: data.order.id, token: data.access_token, createdAt: Date.now()
          }));
        } catch (_) {}
        status.textContent = 'Pesanan ' + data.order.id + ' dibuat. Mengarahkan ke penyedia pembayaran...';
        // Redirect only to a trusted payment gateway hostname.
        const url = new URL(data.order.payment_url);
        if (!['app.midtrans.com','app.sandbox.midtrans.com'].includes(url.hostname) || url.protocol !== 'https:') {
          throw Error('Alamat pembayaran tidak valid.');
        }
        window.location.assign(url.href);
        return;
      } catch (err) {
        status.textContent = 'Checkout belum berhasil: ' + err.message + ' Silakan periksa stok atau hubungi admin.';
        return;
      } finally { submit.disabled = false; }
    }
    const rows = entries().map(({ product:p, qty }, i) => `${i+1}. ${p.name} × ${qty} — ${formatPrice(p.price * qty)}`);
    const message = [
      'Halo SEMEISTVO TECH, saya ingin mengajukan permintaan pembelian:',
      '',
      ...rows,
      '',
      'Subtotal estimasi: ' + formatPrice(subtotal()),
      'Biaya kirim dan stok: menunggu konfirmasi admin',
      '',
      'Nama: ' + name,
      'WhatsApp: ' + phone,
      'Alamat pengiriman: ' + address,
      'Catatan: ' + (notes || '-'),
      '',
      'Mohon konfirmasi stok, total akhir, ongkir, dan instruksi pembayaran resmi. Pesanan belum dibayar.'
    ].join('\n');
    const url = 'https://wa.me/6288291967659?text=' + encodeURIComponent(message);
    const newTab = window.open(url, '_blank', 'noopener,noreferrer');
    status.textContent = 'Permintaan siap dikirim. Jika WhatsApp tidak terbuka, gunakan tautan berikut: ';
    const fallback = document.createElement('a');
    fallback.href = url; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer';
    fallback.textContent = 'Buka WhatsApp'; fallback.style.color = '#cdb6ff';
    status.appendChild(fallback);
  });
  renderProducts();
  renderCart();
  renderFeatured();
  // Cloudflare D1 is the default catalogue. When an approved supplier feed
  // is configured, its verified IDR prices are reflected here automatically.
  // Poll while shoppers are browsing; never pretend an estimate is live.
  let loading = false;
  let lastQuoteLookup = false;
  async function refreshCatalogue() {
    if (loading || document.visibilityState === 'hidden') return;
    loading = true;
    try {
      const response = await fetch('/api/products', { cache: 'no-store' });
      if (!response.ok) throw new Error('catalogue unavailable');
      const data = await response.json();
      if (!Array.isArray(data.products)) return;
      const valid = data.products.filter(p => p && p.id &&
        Number.isSafeInteger(p.price) && p.price >= 0 &&
        Number.isInteger(p.stock) && p.stock >= 0);
      serverCatalogAvailable = true;
      serverCheckoutEnabled = data.checkout_enabled === true;
      products = valid;
      productMap = new Map(products.map(p => [p.id, p]));

      // Synchronize PC Builder selected object references to the same price feed.
      const sku = new Map(valid.map(p => [p.id, p]));
      for (const items of Object.values(db.components)) {
        for (const item of items) {
          const current = sku.get(item.id);
          if (!current) continue;
          item.price = current.price;
          item.stock = current.stock;
          item.stockLive = current.stock_live === true;
          item.priceLive = current.price_live === true;
          item.priceUpdatedAt = current.price_updated_at || null;
        }
      }
      for (const preset of db.presets || []) {
        const parts = Object.entries(preset.components || {}).map(([category,id]) =>
          (db.components[category] || []).find(p => p.id === id)).filter(Boolean);
        if (parts.length) preset.totalPrice = parts.reduce((sum,p)=>sum+p.price,0);
      }
      updateBuilderCart(window.SVOBuilderSelections || {});
      persist(); renderProducts(); renderCart(); renderFeatured(); syncPaymentMode();

      const pricing = data.pricing || {};
      const updated = pricing.updated_at ? new Date(pricing.updated_at).toLocaleString('id-ID') : '';
      const statusEl = document.getElementById('svoPriceStatus');
      const live = Number(pricing.live_products) || 0;
      if (statusEl) {
        const market = Number(pricing.market_products) || 0;
        const marketDate = pricing.market_updated_at ?
          new Date(pricing.market_updated_at).toLocaleString('id-ID', {timeZone:'Asia/Jakarta'}) + ' WIB' : '';
        const info = [];
        if (live) info.push('Harga pemasok: ' + live + '/' + valid.length + ' produk' + (updated ? ' • terakhir ' + updated : ''));
        if (market) info.push('Estimasi pasar: ' + market + '/' + valid.length + ' produk (DPrice: ' + (Number(pricing.dprice_products)||0) + ', Google / SerpApi: ' + (Number(pricing.serpapi_products)||0) + ')' + (marketDate ? ' • data terbaru ' + marketDate : ''));
        statusEl.textContent = info.length ? info.join(' | ') +
          '. Produk lain memakai estimasi referensi.' :
          'Harga masih estimasi referensi; belum ada harga pemasok atau marketplace yang memenuhi validasi.';
        statusEl.dataset.live = live ? 'true' : 'false';
      }
      document.dispatchEvent(new CustomEvent('svo:catalog-updated', {
        detail: { prices: valid.map(p => ({id:p.id,price:p.price,stock:p.stock,live:!!p.price_live})),
          updated_at: pricing.updated_at, live_products: live }
      }));
      const note = document.querySelector('.svo-store-note');
      if (note) note.textContent = 'Harga pemasok diprioritaskan; estimasi pasar DPrice dan Google (Shopping/Search) hanya memakai data yang lolos validasi. Harga lainnya merupakan estimasi. Stok dan harga akhir dikonfirmasi via WhatsApp.';
      if (!lastQuoteLookup) {
        lastQuoteLookup = true;
        const prev = document.getElementById('svoPreviousOrder');
        let last; try { last = JSON.parse(localStorage.getItem('svo-last-order') || 'null'); } catch (_) {}
        if (prev && last?.id && last?.token) {
          prev.hidden = false;
          prev.textContent = 'Pesanan terakhir ' + last.id + ' — Memeriksa status...';
          fetch('/api/orders/' + encodeURIComponent(last.id),
            {headers:{'x-order-access-token':last.token},cache:'no-store'})
            .then(r => r.ok ? r.json() : Promise.reject(new Error('Tidak ditemukan')))
            .then(data => {prev.textContent='Pesanan '+last.id+' — status: '+data.order.status;})
            .catch(()=>{prev.textContent='Status pesanan terakhir belum dapat diperiksa.';});
        }
      }
    } catch {
      const el = document.getElementById('svoPriceStatus');
      if (el && !serverCatalogAvailable) el.textContent = 'Harga referensi belum terverifikasi secara live. Tanyakan harga terbaru sebelum memesan.';
    } finally { loading = false; }
  }
  refreshCatalogue();
  const priceTimer = setInterval(refreshCatalogue, 120000);
  window.addEventListener('pagehide', () => clearInterval(priceTimer), { once: true });

});
