/**
 * SEMEISTVO TECH - App Logic & Interactivity
 */

document.addEventListener('DOMContentLoaded', () => {
  // State Application
  const state = {
    selectedCategory: 'cpu',
    searchQuery: '',
    selectedBrand: 'ALL',
    userBuild: {
      cpu: null,
      gpu: null,
      motherboard: null,
      ram: null,
      storage: null,
      psu: null,
      case: null,
      cooler: null,
      accessories: null,
      software: null
    }
  };

  // DOM Elements
  const categoryNavEl = document.getElementById('categoryNav');
  const componentsListEl = document.getElementById('componentsList');
  const summaryPartsEl = document.getElementById('summaryParts');
  const totalAmountEl = document.getElementById('totalAmount');
  const currentWattageEl = document.getElementById('currentWattage');
  const wattageBarEl = document.getElementById('wattageBar');
  const psuCapacityEl = document.getElementById('psuCapacity');
  const searchInputEl = document.getElementById('searchInput');
  const brandFiltersEl = document.getElementById('brandFilters');
  const resetBuildBtn = document.getElementById('resetBuildBtn');
  const whatsappOrderBtn = document.getElementById('whatsappOrderBtn');
  const exportSpecBtn = document.getElementById('exportSpecBtn');
  const specModal = document.getElementById('specModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalContentEl = document.getElementById('modalContent');
  const presetsContainerEl = document.getElementById('presetsContainer');

  // WhatsApp store number (Bisa diganti sesuai nomor pengguna)
  const WHATSAPP_NUMBER = '6288291967659';

  // Format IDR Helper
  function formatIDR(price) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(price);
  }

  // Initialize
  function init() {
    renderCategoryTabs();
    renderBrandFilters();
    renderComponents();
    renderPresets();
    updateSummary();
    setupEventListeners();
  }

  // 1. Render Category Tabs
  function renderCategoryTabs() {
    if (!categoryNavEl) return;
    categoryNavEl.innerHTML = PC_DATA.categories.map(cat => `
      <button class="category-tab ${state.selectedCategory === cat.id ? 'active' : ''}" data-id="${cat.id}">
        <i class="feather feather-${cat.icon}"></i>
        <span>${cat.name}</span>
        ${state.userBuild[cat.id] ? '<span style="color: var(--accent); font-weight: bold;">✓</span>' : ''}
      </button>
    `).join('');
  }

  // 2. Render Brand Filters
  function renderBrandFilters() {
    if (!brandFiltersEl) return;
    const currentList = PC_DATA.components[state.selectedCategory] || [];
    const brands = ['ALL', ...new Set(currentList.map(item => item.brand))];

    brandFiltersEl.innerHTML = brands.map(b => `
      <button class="brand-chip ${state.selectedBrand === b ? 'active' : ''}" data-brand="${b}">
        ${b}
      </button>
    `).join('');
  }

  // 3. Render Component Cards in Selected Category
  function renderComponents() {
    if (!componentsListEl) return;
    let list = PC_DATA.components[state.selectedCategory] || [];

    // Filter by Brand
    if (state.selectedBrand !== 'ALL') {
      list = list.filter(item => item.brand === state.selectedBrand);
    }

    // Filter by Search Query
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase();
      list = list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q)
      );
    }

    if (list.length === 0) {
      componentsListEl.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
          <p>Tidak ada komponen yang cocok dengan pencarian / filter ini.</p>
        </div>
      `;
      return;
    }

    const selectedPart = state.userBuild[state.selectedCategory];

    componentsListEl.innerHTML = list.map(item => {
      const isSelected = selectedPart && selectedPart.id === item.id;
      return `
        <div class="component-card ${isSelected ? 'selected' : ''}">
          <img src="${item.image}" data-svo-fallback="${item.fallbackImage || ('images/products/' + state.selectedCategory + '.svg')}" data-svo-final-fallback="${item.categoryArtwork || ('images/products/' + state.selectedCategory + '.svg')}" alt="Foto referensi atau ilustrasi komponen ${item.name}" class="component-img" loading="lazy">
          <div class="component-info">
            <h4>${item.name}</h4>
            <p>${item.description}</p>
            <div class="component-meta">
              <span class="meta-item"><i class="feather feather-tag"></i> ${item.brand}</span>
              ${item.watts ? `<span class="meta-item watt"><i class="feather feather-zap"></i> ${item.watts} W</span>` : ''}
              ${item.socket ? `<span class="meta-item"><i class="feather feather-cpu"></i> ${item.socket}</span>` : ''}
              ${item.capacityWatts ? `<span class="meta-item watt"><i class="feather feather-zap"></i> ${item.capacityWatts}W PSU</span>` : ''}
            </div>
          </div>
          <div class="component-action">
            <span class="component-price"><small>Estimasi</small>${formatIDR(item.price)}</span>
            <button class="btn ${isSelected ? 'btn-emerald' : 'btn-secondary'} select-part-btn" data-id="${item.id}">
              ${isSelected ? '✓ Terpilih' : 'Pilih Komponen'}
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // 4. Render Preset Cards (Home & Presets Section)
  function renderPresets() {
    if (!presetsContainerEl) return;
    presetsContainerEl.innerHTML = PC_DATA.presets.map(preset => `
      <div class="glass-card preset-card">
        <img src="${preset.image}" data-svo-fallback="images/products/pcbuild.svg" alt="Foto konsep rakitan PC, bukan konfigurasi final ${preset.title}" class="preset-image" loading="lazy">
        <span class="svo-preset-caption">Foto konsep referensi · Komponen dan warna unit bisa berbeda</span>
        <div class="preset-header">
          <span class="badge ${preset.id.includes('beast') ? 'badge-purple' : 'badge'}">${preset.badge}</span>
          <h3 class="preset-title">${preset.title}</h3>
        </div>
        <p class="preset-tagline">${preset.tagline}</p>

        <div class="preset-specs-list">
          <div class="preset-spec-item"><i class="feather feather-zap"></i> Est. Daya: ${preset.estimatedWatts} Watts</div>
          <div class="preset-spec-item"><i class="feather feather-check-circle"></i> Rekomendasi PSU: ${preset.recommendedPsu}</div>
        </div>

        <div class="preset-footer">
          <div class="preset-price">
            <span>Estimasi Paket</span>
            <strong>${formatIDR(preset.totalPrice)}</strong>
          </div>
          <button class="btn btn-primary load-preset-btn" data-preset="${preset.id}">
            Gunakan Racikan Ini
          </button>
        </div>
      </div>
    `).join('');
  }

  // Basic compatibility screening from known catalogue metadata only.
  // This does not replace motherboard BIOS, PSU connector or physical clearance checks.
  function getCompatibilityIssues() {
    const b = state.userBuild;
    const issues = [];
    if (b.cpu && b.motherboard && b.cpu.socket && b.motherboard.socket && b.cpu.socket !== b.motherboard.socket) {
      issues.push('Socket CPU (' + b.cpu.socket + ') tidak cocok dengan motherboard (' + b.motherboard.socket + ').');
    }
    if (b.ram && b.motherboard && b.ram.memoryType && b.motherboard.memoryType && b.ram.memoryType !== b.motherboard.memoryType) {
      issues.push('Tipe RAM ' + b.ram.memoryType + ' tidak cocok dengan slot ' + b.motherboard.memoryType + '.');
    }
    if (b.case && b.motherboard && Array.isArray(b.case.supportedFormFactors) &&
        b.motherboard.formFactor && !b.case.supportedFormFactors.includes(b.motherboard.formFactor)) {
      issues.push('Ukuran motherboard (' + b.motherboard.formFactor + ') tidak didukung casing ini.');
    }
    if (b.case && b.psu && Array.isArray(b.case.supportedPsuTypes) && b.psu.psuFormFactor &&
        !b.case.supportedPsuTypes.includes(b.psu.psuFormFactor)) {
      issues.push('PSU tipe ' + b.psu.psuFormFactor + ' tidak didukung casing pilihan.');
    }
    const estimated = Object.values(b).reduce((sum, item) => sum + (item?.watts || 0), 0);
    if (b.psu?.capacityWatts && estimated * 1.25 > b.psu.capacityWatts) {
      issues.push('PSU ' + b.psu.capacityWatts + 'W belum mencukupi margin 25% dari estimasi ' + estimated + 'W.');
    }
    return issues;
  }

  function renderCompatibility() {
    const target = document.getElementById('svoCompatibilityIssues');
    if (!target) return;
    const issues = getCompatibilityIssues();
    target.className = 'svo-compatibility ' + (issues.length ? 'svo-compatibility-warning' : 'svo-compatibility-pass');
    target.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = issues.length ? '⚠ Cek kompatibilitas rakitan' : '✓ Pemeriksaan dasar kompatibilitas';
    target.appendChild(title);
    const list = document.createElement('p');
    list.textContent = issues.length
      ? issues.join(' ')
      : 'Periksa kembali BIOS, konektor daya, ruang GPU, tinggi cooler dan dukungan radiator sebelum pembelian. Kalkulasi watt adalah perkiraan.';
    target.appendChild(list);
  }

  // 5. Update Summary Panel & Wattage Meter
  function updateSummary() {
    let totalPrice = 0;
    let totalWatts = 0;
    let psuWattsCapacity = 0;
    let count = 0;

    const partsHTML = [];

    PC_DATA.categories.forEach(cat => {
      const part = state.userBuild[cat.id];
      if (part) {
        count++;
        totalPrice += part.price;
        if (part.watts) totalWatts += part.watts;
        if (part.capacityWatts) psuWattsCapacity = part.capacityWatts;

        partsHTML.push(`
          <div class="summary-part-item">
            <div class="part-name" title="${part.name}">
              <strong style="color: var(--primary)">${cat.name.split(' ')[0]}:</strong> ${part.name}
            </div>
            <div style="display: flex; align-items: center;">
              <span class="part-price">${formatIDR(part.price)}</span>
              <span class="remove-btn" data-category="${cat.id}" title="Hapus"><i class="feather feather-x"></i></span>
            </div>
          </div>
        `);
      }
    });

    if (summaryPartsEl) {
      if (partsHTML.length === 0) {
        summaryPartsEl.innerHTML = `
          <p style="text-align: center; color: var(--text-dim); padding: 1.5rem 0; font-size: 0.9rem;">
            Belum ada komponen yang dipilih. Silakan pilih komponen di sebelah kiri.
          </p>
        `;
      } else {
        summaryPartsEl.innerHTML = partsHTML.join('');
      }
    }

    if (totalAmountEl) totalAmountEl.textContent = formatIDR(totalPrice);
    if (currentWattageEl) currentWattageEl.textContent = `${totalWatts} W`;

    // Wattage Bar percentage relative to PSU capacity or standard 1000W
    const maxReference = psuWattsCapacity > 0 ? psuWattsCapacity : 1000;
    const percentage = Math.min(Math.round((totalWatts / maxReference) * 100), 100);

    if (wattageBarEl) {
      wattageBarEl.style.width = `${percentage}%`;
      if (psuWattsCapacity > 0 && totalWatts > psuWattsCapacity) {
        wattageBarEl.classList.add('overload');
      } else {
        wattageBarEl.classList.remove('overload');
      }
    }

    if (psuCapacityEl) {
      if (psuWattsCapacity > 0) {
        if (totalWatts > psuWattsCapacity) {
          psuCapacityEl.innerHTML = `<span style="color: var(--danger); font-weight: 600;">⚠️ Peringatan: Total Watt (${totalWatts}W) melebihi kapasitas PSU (${psuWattsCapacity}W)!</span>`;
        } else {
          psuCapacityEl.innerHTML = `<span style="color: var(--accent);">Daya PSU Terpasang: ${psuWattsCapacity}W (Aman)</span>`;
        }
      } else {
        psuCapacityEl.textContent = `Pilih PSU untuk memverifikasi kecukupan daya.`;
      }
    }

    // Update cart badge count in nav
    const cartCountEl = document.getElementById('cartCount');
    if (cartCountEl) cartCountEl.textContent = count;
    renderCompatibility();
    // Shared cart synchronization: all builder mutations (select, remove,
    // load preset, restore and reset) use updateSummary as a single source.
    const selections = Object.fromEntries(Object.entries(state.userBuild)
      .filter(([category, part]) => !!part && !!PC_DATA.components[category])
      .map(([category, part]) => [category, part.id]));
    window.SVOBuilderSelections = selections;
    document.dispatchEvent(new CustomEvent('svo:builder-change', { detail: { selections } }));
  }

  // 6. Select or Unselect a Component
  function togglePart(partId) {
    const category = state.selectedCategory;
    const currentPart = state.userBuild[category];

    if (currentPart && currentPart.id === partId) {
      state.userBuild[category] = null;
    } else {
      const found = (PC_DATA.components[category] || []).find(item => item.id === partId);
      if (found) {
        state.userBuild[category] = found;
      }
    }

    renderCategoryTabs();
    renderComponents();
    updateSummary();
  }

  // 7. Load Preset Configuration
  function loadPreset(presetId) {
    const preset = PC_DATA.presets.find(p => p.id === presetId);
    if (!preset) return;

    // Reset user build
    Object.keys(state.userBuild).forEach(k => state.userBuild[k] = null);

    // Fill components from preset
    Object.entries(preset.components).forEach(([catId, partId]) => {
      const part = (PC_DATA.components[catId] || []).find(item => item.id === partId);
      if (part) {
        state.userBuild[catId] = part;
      }
    });

    renderCategoryTabs();
    renderComponents();
    updateSummary();

    // Scroll to builder section
    const builderSection = document.getElementById('rakit-pc');
    if (builderSection) {
      builderSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Builder inquiry only; payment details are not shown before verified checkout.
  function renderOrderSummaryPreview() {
    const target = document.getElementById('orderSummaryPreview');
    if (!target) return;
    target.replaceChildren();
    const rows = PC_DATA.categories
      .map(cat => ({ category: cat.name, item: state.userBuild[cat.id] }))
      .filter(row => row.item);
    const sum = rows.reduce((amount, row) => amount + row.item.price, 0);
    const heading = document.createElement('strong');
    heading.textContent = 'Ringkasan konfigurasi · ' + rows.length + ' pilihan';
    target.appendChild(heading);
    const list = document.createElement('ul');
    list.style.padding = '1rem 0 0 1.15rem';
    list.style.margin = '0';
    for (const row of rows) {
      const li = document.createElement('li');
      li.textContent = row.category + ': ' + row.item.name;
      li.style.marginBottom = '.35rem';
      list.appendChild(li);
    }
    target.appendChild(list);
    const total = document.createElement('p');
    total.style.marginTop = '1rem';
    total.style.fontWeight = '800';
    total.textContent = 'Total estimasi komponen: ' + formatIDR(sum) + ' (belum termasuk pengiriman)';
    target.appendChild(total);
  }

  // 8. Open Order Form Modal (Form Pemesanan)
  function openOrderModal() {
    let count = 0;
    PC_DATA.categories.forEach(cat => {
      if (state.userBuild[cat.id]) count++;
    });

    if (count === 0) {
      alert('Silakan pilih minimal 1 komponen terlebih dahulu sebelum membuat pesanan!');
      return;
    }

    const issues = getCompatibilityIssues();
    if (issues.length) {
      alert('Periksa kompatibilitas rakitan terlebih dahulu:\\n' + issues.join('\\n'));
      document.getElementById('svoCompatibilityIssues')?.scrollIntoView({ behavior:'smooth', block:'center' });
      return;
    }

    renderOrderSummaryPreview();

    const orderModal = document.getElementById('orderModal');
    if (orderModal) {
      orderModal.classList.add('open');
    }
  }

  // Helper to build formatted Order Message
  function buildOrderMessageText() {
    const name = document.getElementById('orderCustomerName').value.trim();
    const phone = document.getElementById('orderCustomerPhone').value.trim();
    const address = document.getElementById('orderCustomerAddress').value.trim();
    const notes = document.getElementById('orderNotes').value.trim();
    const preferredPayment = document.getElementById('orderPreferredPayment')?.value || 'Diskusikan saat penawaran';

    if (name.length < 2 || !/^\\+?[0-9 -]{8,20}$/.test(phone) || address.length < 8) {
      alert('Periksa nama, nomor WhatsApp dan alamat pengiriman.');
      return null;
    }

    const rows = PC_DATA.categories
      .map(cat => ({ category: cat.name, item: state.userBuild[cat.id] }))
      .filter(row => row.item);
    if (!rows.length) {
      alert('Pilih komponen rakitan terlebih dahulu.');
      return null;
    }
    const total = rows.reduce((sum, row) => sum + row.item.price, 0);
    const watts = rows.reduce((sum, row) => sum + (row.item.watts || 0), 0);
    const lines = [
      'SEMEISTVO TECH / PERMINTAAN PENAWARAN RAKIT PC',
      '',
      'Nama: ' + name,
      'WhatsApp: ' + phone,
      'Alamat/kota: ' + address,
      'Catatan: ' + (notes || '-'),
      'Preferensi pembayaran: ' + preferredPayment + ' (belum ada transaksi)',
      '',
      'KONFIGURASI:'
    ];
    rows.forEach(row => lines.push('• ' + row.category + ': ' + row.item.name + ' — ' + formatIDR(row.item.price)));
    lines.push(
      '',
      'Subtotal estimasi komponen: ' + formatIDR(total),
      'Estimasi daya dasar: ' + watts + 'W',
      '',
      'Mohon bantu cek stok, spesifikasi/kompatibilitas final, harga akhir, ongkos kirim, garansi, dan instruksi pembayaran resmi.',
      'Pesan ini hanya permintaan penawaran dan belum merupakan pesanan berbayar.'
    );
    return lines.join('\\n');
  }

  // Submit Order Form to WhatsApp
  function handleCheckoutOrderSubmit(e) {
    if (e) e.preventDefault();

    const msg = buildOrderMessageText();
    if (!msg) return;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');

    const orderModal = document.getElementById('orderModal');
    if (orderModal) {
      orderModal.classList.remove('open');
    }
  }

  // Submit Order Form to Telegram Direct @nandamorgul
  function sendOrderToTelegram() {
    const msg = buildOrderMessageText();
    if (!msg) return;

    const encoded = encodeURIComponent(msg);
    window.open(`https://t.me/nandamorgul?text=${encoded}`, '_blank');

    const orderModal = document.getElementById('orderModal');
    if (orderModal) {
      orderModal.classList.remove('open');
    }
  }

  // Legacy fallback alias
  function generateWhatsAppLink() {
    openOrderModal();
  }

  // 9. Show Specification Modal Dialog / Print View
  function showSpecModal() {
    let totalPrice = 0;
    let totalWatts = 0;
    const items = [];

    PC_DATA.categories.forEach(cat => {
      const part = state.userBuild[cat.id];
      if (part) {
        totalPrice += part.price;
        if (part.watts) totalWatts += part.watts;
        items.push(`
          <tr style="border-bottom: 1px solid var(--border-color)">
            <td style="padding: 0.75rem 0; color: var(--primary); font-weight: 600;">${cat.name}</td>
            <td style="padding: 0.75rem 0.5rem; color: var(--text-main);">${part.name}</td>
            <td style="padding: 0.75rem 0; text-align: right; color: var(--accent); font-weight: 600;">${formatIDR(part.price)}</td>
          </tr>
        `);
      }
    });

    if (items.length === 0) {
      alert('Pilih beberapa komponen terlebih dahulu untuk melihat rincian spesifikasi!');
      return;
    }

    modalContentEl.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.6rem;" class="text-gradient">SEMEISTVO TECH · CUSTOM BUILD SPEC</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Rincian Konfigurasi & Estimasi Biaya</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem; margin-bottom: 1.5rem;">
        <thead>
          <tr style="border-bottom: 2px solid var(--primary); text-align: left;">
            <th style="padding-bottom: 0.5rem; color: var(--text-muted);">Kategori</th>
            <th style="padding-bottom: 0.5rem; color: var(--text-muted);">Komponen</th>
            <th style="padding-bottom: 0.5rem; text-align: right; color: var(--text-muted);">Harga</th>
          </tr>
        </thead>
        <tbody>
          ${items.join('')}
        </tbody>
      </table>

      <div style="background: rgba(0, 240, 255, 0.05); border: 1px solid var(--border-glow); padding: 1rem; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <div>
          <span style="font-size: 0.85rem; color: var(--text-muted);">Estimasi Konsumsi Daya</span>
          <h4 style="color: var(--warning); font-size: 1.1rem;">⚡ ${totalWatts} Watts</h4>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.85rem; color: var(--text-muted);">TOTAL KESELURUHAN</span>
          <h3 style="color: var(--accent); font-size: 1.6rem; font-family: var(--font-heading);">${formatIDR(totalPrice)}</h3>
        </div>
      </div>

      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); padding: 0.85rem 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
        <div style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
          <i class="feather feather-credit-card"></i> Pilihan Metode Pembayaran Resmi:
        </div>
        <div class="payment-logos-grid" style="gap: 0.35rem;">
          <span class="payment-chip" style="font-size: 0.725rem;"><svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#005caa"/><path d="M6 7h4c1.5 0 2.5.5 2.5 1.5s-.8 1.3-1.8 1.5c1.2.2 2.3.8 2.3 2 0 1.3-1.2 2-3 2H6V7z" fill="#fff"/></svg> Transfer BCA</span>
          <span class="payment-chip" style="font-size: 0.725rem;"><svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#003d79"/><path d="M5 14.5c3.5-3 8 2 14-2.5" stroke="#ffb703" stroke-width="2.5"/></svg> Mandiri VA</span>
          <span class="payment-chip" style="font-size: 0.725rem;"><svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#ed1c24"/><rect x="4.5" y="4.5" width="6" height="6" fill="#fff"/><rect x="13.5" y="4.5" width="6" height="6" fill="#fff"/><rect x="4.5" y="13.5" width="6" height="6" fill="#fff"/><rect x="13.5" y="13.5" width="3" height="3" fill="#fff"/></svg> QRIS All Wallet</span>
          <span class="payment-chip" style="font-size: 0.725rem;"><svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#03ac0e"/><circle cx="9" cy="10" r="1.5" fill="#fff"/><circle cx="15" cy="10" r="1.5" fill="#fff"/></svg> Tokopedia 0%</span>
          <span class="payment-chip" style="font-size: 0.725rem;"><svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#ee4d2d"/><path d="M7 10.5h10v7.5H7z" stroke="#fff" stroke-width="1.6"/></svg> ShopeePay</span>
          <span class="payment-chip" style="font-size: 0.725rem;"><svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#1a1f71"/><circle cx="9.5" cy="12" r="4.5" fill="#eb001b"/><circle cx="14.5" cy="12" r="4.5" fill="#f79e1b" fill-opacity="0.85"/></svg> Kartu Kredit</span>
        </div>
      </div>

      <div style="display: flex; gap: 1rem; justify-content: flex-end;">
        <button class="btn btn-secondary" onclick="window.print()"><i class="feather feather-printer"></i> Cetak / Simpan PDF</button>
        <button class="btn btn-emerald" id="modalWaBtn"><i class="feather feather-message-circle"></i> Pesan via WhatsApp</button>
      </div>
    `;

    specModal.classList.add('open');

    const modalWaBtn = document.getElementById('modalWaBtn');
    if (modalWaBtn) {
      modalWaBtn.addEventListener('click', () => {
        specModal.classList.remove('open');
        openOrderModal();
      });
    }
  }

  // 10. Event Listeners Setup
  function setupEventListeners() {
    // Category Tabs click
    if (categoryNavEl) {
      categoryNavEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.category-tab');
        if (!btn) return;
        state.selectedCategory = btn.dataset.id;
        state.selectedBrand = 'ALL';
        renderCategoryTabs();
        renderBrandFilters();
        renderComponents();
      });
    }

    // Brand Filter click
    if (brandFiltersEl) {
      brandFiltersEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.brand-chip');
        if (!btn) return;
        state.selectedBrand = btn.dataset.brand;
        renderBrandFilters();
        renderComponents();
      });
    }

    // Search input
    if (searchInputEl) {
      searchInputEl.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderComponents();
      });
    }

    // If an item is removed from the shared header cart, remove it from
    // the builder as well, including the local configuration summary.
    document.addEventListener('svo:builder-remove', event => {
      const category = event.detail?.category;
      const id = event.detail?.id;
      if (!category || !id || state.userBuild[category]?.id !== id) return;
      state.userBuild[category] = null;
      renderCategoryTabs();
      renderComponents();
      updateSummary();
    });

    // Component selection button click
    if (componentsListEl) {
      componentsListEl.addEventListener('click', (e) => {
        const btn = e.target.closest('.select-part-btn');
        if (!btn) return;
        togglePart(btn.dataset.id);
      });
    }

    // Summary part remove button click
    if (summaryPartsEl) {
      summaryPartsEl.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.remove-btn');
        if (!removeBtn) return;
        const catId = removeBtn.dataset.category;
        state.userBuild[catId] = null;
        renderCategoryTabs();
        renderComponents();
        updateSummary();
      });
    }

    // Load preset buttons click
    document.addEventListener('click', (e) => {
      const presetBtn = e.target.closest('.load-preset-btn');
      if (presetBtn) {
        loadPreset(presetBtn.dataset.preset);
        return;
      }

      const softBtn = e.target.closest('.select-software-btn');
      if (softBtn) {
        const softId = softBtn.dataset.id;
        const softObj = (PC_DATA.components.software || []).find(s => s.id === softId);
        if (softObj) {
          state.userBuild.software = softObj;
          state.selectedCategory = 'software';
          renderCategoryTabs();
          renderComponents();
          updateSummary();
          const builderSection = document.getElementById('rakit-pc');
          if (builderSection) {
            builderSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    });

    // Save/load user-selected configuration; products are looked up by ID on
    // restore so the catalogue remains the source of truth for demo pricing.
    const saveBuildBtn = document.getElementById('svoSaveBuildBtn');
    const loadBuildBtn = document.getElementById('svoLoadBuildBtn');
    const saveBuildStatus = document.getElementById('svoBuildSaveStatus');
    const buildKey = 'svo-tech-saved-build-v1';
    const notifyBuild = message => { if (saveBuildStatus) saveBuildStatus.textContent = message; };
    if (saveBuildBtn) saveBuildBtn.addEventListener('click', () => {
      const ids = Object.fromEntries(Object.entries(state.userBuild)
        .filter(([cat, part]) => !!part && !!PC_DATA.components[cat])
        .map(([cat, part]) => [cat, part.id]));
      if (!Object.keys(ids).length) { notifyBuild('Pilih komponen sebelum menyimpan rakitan.'); return; }
      try {
        localStorage.setItem(buildKey, JSON.stringify({ version: 1, savedAt: Date.now(), ids }));
        notifyBuild('Rakitan berhasil disimpan di browser ini.');
      } catch (_) { notifyBuild('Penyimpanan browser tidak tersedia.'); }
    });
    if (loadBuildBtn) loadBuildBtn.addEventListener('click', () => {
      let record;
      try { record = JSON.parse(localStorage.getItem(buildKey) || 'null'); }
      catch (_) { notifyBuild('Data rakitan yang tersimpan tidak valid.'); return; }
      if (!record?.ids || typeof record.ids !== 'object') {
        notifyBuild('Belum ada rakitan yang disimpan di browser ini.'); return;
      }
      for (const cat of Object.keys(state.userBuild)) {
        const id = record.ids[cat];
        state.userBuild[cat] = (PC_DATA.components[cat] || []).find(item => item.id === id) || null;
      }
      state.selectedBrand = 'ALL';
      state.searchQuery = '';
      if (searchInputEl) searchInputEl.value = '';
      renderCategoryTabs();
      renderBrandFilters();
      renderComponents();
      updateSummary();
      notifyBuild('Rakitan dimuat. Periksa kembali harga dan kompatibilitas sebelum konsultasi.');
    });

    // Reset Build button
    if (resetBuildBtn) {
      resetBuildBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin mereset seluruh rakitan PC?')) {
          Object.keys(state.userBuild).forEach(k => state.userBuild[k] = null);
          renderCategoryTabs();
          renderComponents();
          updateSummary();
        }
      });
    }

    // WhatsApp Order button
    if (whatsappOrderBtn) {
      whatsappOrderBtn.addEventListener('click', openOrderModal);
    }

    // Export Spec Modal button
    if (exportSpecBtn) {
      exportSpecBtn.addEventListener('click', showSpecModal);
    }

    // Spec Modal close handlers
    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', () => specModal.classList.remove('open'));
    }
    if (specModal) {
      specModal.addEventListener('click', (e) => {
        if (e.target === specModal) specModal.classList.remove('open');
      });
    }

    // Order Modal Handlers
    const orderModal = document.getElementById('orderModal');
    const closeOrderModalBtn = document.getElementById('closeOrderModalBtn');
    const cancelOrderModalBtn = document.getElementById('cancelOrderModalBtn');
    const checkoutOrderForm = document.getElementById('checkoutOrderForm');
    const orderPaymentMethodEl = document.getElementById('orderPaymentMethod');

    const bankCardsGrid = document.getElementById('bankCardsGrid');
    if (bankCardsGrid) {
      bankCardsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.bank-card-item');
        if (!card) return;
        const paymentVal = card.dataset.payment;
        if (paymentVal) {
          updateBankDetailsCard(paymentVal);
        }
      });
    }

    const orderDeliveryOptionEl = document.getElementById('orderDeliveryOption');
    const orderPackingKayuCheckEl = document.getElementById('orderPackingKayuCheck');
    const orderPaymentProofEl = document.getElementById('orderPaymentProof');

    if (orderDeliveryOptionEl) {
      orderDeliveryOptionEl.addEventListener('change', renderOrderSummaryPreview);
    }
    if (orderPackingKayuCheckEl) {
      orderPackingKayuCheckEl.addEventListener('change', renderOrderSummaryPreview);
    }
    if (orderPaymentProofEl) {
      orderPaymentProofEl.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const fileNameEl = document.getElementById('paymentProofFileName');
        const subtextEl = document.getElementById('paymentProofSubtext');
        if (file && fileNameEl) {
          fileNameEl.textContent = `✓ Terlampir: ${file.name}`;
          fileNameEl.style.color = 'var(--accent)';
          if (subtextEl) subtextEl.textContent = `Ukuran: ${(file.size / 1024).toFixed(1)} KB (Siap dikirim)`;
        }
      });
    }

    if (orderPaymentMethodEl) {
      orderPaymentMethodEl.addEventListener('change', (e) => {
        updateBankDetailsCard(e.target.value);
      });
    }

    if (closeOrderModalBtn && orderModal) {
      closeOrderModalBtn.addEventListener('click', () => orderModal.classList.remove('open'));
    }
    if (cancelOrderModalBtn && orderModal) {
      cancelOrderModalBtn.addEventListener('click', () => orderModal.classList.remove('open'));
    }
    if (orderModal) {
      orderModal.addEventListener('click', (e) => {
        if (e.target === orderModal) orderModal.classList.remove('open');
      });
    }
    const sendOrderTelegramBtn = document.getElementById('sendOrderTelegramBtn');
    if (sendOrderTelegramBtn) {
      sendOrderTelegramBtn.addEventListener('click', sendOrderToTelegram);
    }

    if (checkoutOrderForm) {
      checkoutOrderForm.addEventListener('submit', handleCheckoutOrderSubmit);
    }

    // Service-first inquiry: pre-fill chosen service and prepare a WhatsApp brief.
    const contactForm = document.getElementById('contactForm');
    const serviceChoice = document.getElementById('contactService');
    document.querySelectorAll('[data-svo-service]').forEach(link => {
      link.addEventListener('click', () => {
        const selected = link.getAttribute('data-svo-service');
        if (serviceChoice && Array.from(serviceChoice.options).some(opt => opt.value === selected)) {
          serviceChoice.value = selected;
          const subject = document.getElementById('contactSubject');
          if (subject && !subject.value.trim()) subject.value = 'Konsultasi ' + selected;
        }
      });
    });
    if (contactForm) {
      contactForm.addEventListener('submit', e => {
        e.preventDefault();
        if (!contactForm.reportValidity()) return;
        const service = serviceChoice?.value?.trim() || '';
        const name = document.getElementById('contactName').value.trim();
        const contact = document.getElementById('contactEmail').value.trim();
        const subject = document.getElementById('contactSubject').value.trim();
        const message = document.getElementById('contactMessage').value.trim();
        const budget = document.getElementById('contactBudget')?.value || 'Belum ditentukan';
        const method = document.getElementById('contactMethod')?.value || 'Diskusikan metode';
        const paymentPreference = document.getElementById('contactPaymentMethod')?.value || 'Diskusikan saat penawaran';
        if (!service || !name || !contact || !subject || !message) return;
        const content = [
          '*SEMEISTVO TECH — KONSULTASI LAYANAN*',
          '',
          'Layanan: ' + service,
          'Nama: ' + name,
          'Kontak: ' + contact,
          'Topik: ' + subject,
          'Budget: ' + budget,
          'Metode: ' + method,
          'Preferensi pembayaran: ' + paymentPreference + ' (menunggu konfirmasi admin)',
          '',
          'Detail kebutuhan:',
          message,
          '',
          'Mohon informasi ketersediaan, ruang lingkup, estimasi biaya dan jadwal pengerjaan.',
          'Website: hosting, domain dan layanan pihak ketiga tidak termasuk kecuali tercantum dalam penawaran.',
          'Server RP: hosting/VPS serta lisensi/resource premium ditagihkan terpisah sesuai kebutuhan.',
          'Ini adalah permintaan konsultasi, bukan pembayaran atau pesanan resmi.'
        ].join('\n');
        const url = 'https://wa.me/6288291967659?text=' + encodeURIComponent(content);
        window.open(url, '_blank', 'noopener,noreferrer');
        let note = document.getElementById('svoContactStatus');
        if (!note) {
          note = document.createElement('p');
          note.id = 'svoContactStatus';
          note.setAttribute('role', 'status');
          contactForm.appendChild(note);
        }
        note.replaceChildren(document.createTextNode('Brief sudah disiapkan. Jika WhatsApp tidak terbuka, '));
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'buka pesan konsultasi di sini';
        note.appendChild(link);
      });
    }

    // FAQ Accordion click
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        item.classList.toggle('active');
      });
    });

    // Accessible responsive menu, closed on Escape, navigation, or outside click.
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('svoPrimaryNav');
    const setMenu = open => {
      if (!mobileMenuBtn || !navLinks) return;
      navLinks.classList.toggle('open', open);
      mobileMenuBtn.setAttribute('aria-expanded', String(open));
      mobileMenuBtn.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
      const icon = mobileMenuBtn.querySelector('i');
      if (icon) {
        icon.className = open ? 'feather feather-x' : 'feather feather-menu';
        if (window.feather) feather.replace();
      }
    };
    if (mobileMenuBtn && navLinks) {
      mobileMenuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
      navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
      document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
      document.addEventListener('click', e => {
        if (!navLinks.contains(e.target) && !mobileMenuBtn.contains(e.target)) setMenu(false);
      });
      window.addEventListener('resize', () => { if (window.innerWidth > 1024) setMenu(false); });
    }

    // Header scroll background change
    const header = document.querySelector('.header');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 40) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });


  }

  // Run initialization
  init();
});
