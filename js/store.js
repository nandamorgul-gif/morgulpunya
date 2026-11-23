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
  const products = Object.entries(db.components).flatMap(([category, items]) => items.map(product => ({ ...product, category })));
  const productMap = new Map(products.map(item => [item.id, item]));
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
  const entries = () => Object.entries(cart).filter(([id, qty]) => productMap.has(id) && qty > 0).map(([id, qty]) => ({ product: productMap.get(id), qty }));
  const subtotal = () => entries().reduce((sum, { product, qty }) => sum + product.price * qty, 0);
  const count = () => entries().reduce((sum, { qty }) => sum + qty, 0);
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
  const renderProducts = () => {
    let list = products.slice();
    const query = els.search.value.trim().toLowerCase();
    if (query) list = list.filter(p => (p.name + ' ' + p.brand + ' ' + p.description).toLowerCase().includes(query));
    if (els.category.value !== 'all') list = list.filter(p => p.category === els.category.value);
    if (els.sort.value === 'low') list.sort((a, b) => a.price - b.price);
    if (els.sort.value === 'high') list.sort((a, b) => b.price - a.price);
    if (els.sort.value === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'id'));
    els.total.textContent = list.length + ' komponen ditemukan';
    grid.innerHTML = list.length ? list.map(p => `
      <article class="svo-product">
        <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" class="svo-product-image" loading="lazy">
        <div class="svo-product-body">
          <span class="svo-product-brand">${escapeHTML(p.brand)}</span>
          <h3 class="svo-product-name">${escapeHTML(p.name)}</h3>
          <p class="svo-product-description">${escapeHTML(p.description)}</p>
          <p class="svo-product-price">${formatPrice(p.price)}</p>
          <button class="svo-store-btn" type="button" data-svo-add="${escapeHTML(p.id)}">+ Tambah ke Keranjang</button>
        </div>
      </article>`).join('') : '<p class="svo-cart-empty">Tidak ada produk yang sesuai dengan pencarian.</p>';
  };
  const renderCart = () => {
    const items = entries();
    els.count.textContent = count();
    els.cartTotal.textContent = formatPrice(subtotal());
    els.cartList.innerHTML = items.length ? items.map(({product:p, qty}) => `
      <div class="svo-cart-item">
        <img src="${escapeHTML(p.image)}" alt="" loading="lazy">
        <div class="svo-cart-item-main">
          <strong>${escapeHTML(p.name)}</strong>
          <p class="svo-cart-item-price">${formatPrice(p.price)} × ${qty}</p>
          <div class="svo-cart-qty">
            <button type="button" aria-label="Kurangi ${escapeHTML(p.name)}" data-svo-delta="-1" data-svo-id="${escapeHTML(p.id)}">−</button>
            <span>${qty}</span>
            <button type="button" aria-label="Tambah ${escapeHTML(p.name)}" data-svo-delta="1" data-svo-id="${escapeHTML(p.id)}">+</button>
            <button type="button" class="svo-cart-remove" data-svo-remove="${escapeHTML(p.id)}">Hapus</button>
          </div>
        </div>
      </div>`).join('') : '<p class="svo-cart-empty">Keranjang masih kosong. Pilih komponen dari katalog terlebih dahulu.</p>';
    document.getElementById('svoCheckoutButton').disabled = !items.length;
  };
  const setQty = (id, qty) => {
    if (!productMap.has(id)) return;
    const n = Math.max(0, Math.min(20, qty));
    if (!n) delete cart[id]; else cart[id] = n;
    persist();
    renderCart();
  };
  db.categories.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    els.category.appendChild(opt);
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
    if (remove) { setQty(remove.dataset.svoRemove, 0); return; }
    const qtyButton = e.target.closest('[data-svo-delta]');
    if (qtyButton) setQty(qtyButton.dataset.svoId, (cart[qtyButton.dataset.svoId] || 0) + Number(qtyButton.dataset.svoDelta));
  });
  [els.search, els.category, els.sort].forEach(el => el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', renderProducts));
  document.getElementById('svoShopCartButton').addEventListener('click', openCart);
  document.getElementById('svoOpenCartFromShop').addEventListener('click', openCart);
  document.getElementById('svoCloseCart').addEventListener('click', closeCart);
  document.getElementById('svoCartOverlay').addEventListener('click', closeCart);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && layer.classList.contains('is-open')) closeCart(); });
  document.getElementById('svoCheckoutButton').addEventListener('click', () => { if (entries().length) toggleView(true); });
  document.getElementById('svoBackToCart').addEventListener('click', () => toggleView(false));
  els.checkout.addEventListener('submit', e => {
    e.preventDefault();
    if (!els.checkout.reportValidity() || !entries().length) return;
    const fields = new FormData(els.checkout);
    const name = String(fields.get('name') || '').trim();
    const phone = String(fields.get('phone') || '').replace(/[\s-]/g, '');
    const address = String(fields.get('address') || '').trim();
    const notes = String(fields.get('notes') || '').trim();
    if (!/^[+0-9]{8,17}$/.test(phone)) {
      document.getElementById('svoCheckoutStatus').textContent = 'Periksa kembali nomor WhatsApp.';
      return;
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
    const status = document.getElementById('svoCheckoutStatus');
    status.textContent = 'Permintaan siap dikirim. Jika WhatsApp tidak terbuka, gunakan tautan berikut: ';
    const fallback = document.createElement('a');
    fallback.href = url; fallback.target = '_blank'; fallback.rel = 'noopener noreferrer';
    fallback.textContent = 'Buka WhatsApp'; fallback.style.color = '#cdb6ff';
    status.appendChild(fallback);
  });
  renderProducts();
  renderCart();
});
