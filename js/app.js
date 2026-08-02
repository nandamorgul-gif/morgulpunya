/**
 * Morgulzxz Gaming Performance - App Logic & Interactivity
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
          <img src="${item.image}" alt="${item.name}" class="component-img" loading="lazy">
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
            <span class="component-price">${formatIDR(item.price)}</span>
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
        <img src="${preset.image}" alt="${preset.title}" class="preset-image" loading="lazy">
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

  // Bank Payment Information Database
  const PAYMENT_INFO = {
    'Transfer Bank BCA Direct': {
      bank: 'Bank Central Asia (BCA)',
      logoSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#005caa"/><path d="M6 7h4c1.5 0 2.5.5 2.5 1.5s-.8 1.3-1.8 1.5c1.2.2 2.3.8 2.3 2 0 1.3-1.2 2-3 2H6V7z" fill="#fff"/></svg>`,
      accountNumber: '883091967659',
      accountNumberFormatted: '8830-9196-7659',
      accountName: 'NANDA MORGUL',
      notes: 'Transfer Langsung BCA / M-BCA'
    },
    'Transfer Mandiri Virtual Account': {
      bank: 'Bank Mandiri',
      logoSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#003d79"/><path d="M5 14.5c3.5-3 8 2 14-2.5" stroke="#ffb703" stroke-width="2.5"/></svg>`,
      accountNumber: '1330091967659',
      accountNumberFormatted: '133-00-9196-7659',
      accountName: 'NANDA MORGUL',
      notes: 'Transfer Livin by Mandiri / Virtual Account'
    },
    'QRIS Instant All Wallet (Gopay/OVO/ShopeePay)': {
      bank: 'QRIS All Payment (GoPay, OVO, Dana, ShopeePay)',
      logoSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#ed1c24"/><rect x="4.5" y="4.5" width="6" height="6" fill="#fff"/><rect x="13.5" y="4.5" width="6" height="6" fill="#fff"/><rect x="4.5" y="13.5" width="6" height="6" fill="#fff"/><rect x="13.5" y="13.5" width="3" height="3" fill="#fff"/></svg>`,
      accountNumber: '088291967659',
      accountNumberFormatted: 'NPM-MORGULZXZ-QRIS (Scan QR)',
      accountName: 'MORGULZXZ GAMING PERFORMANCE',
      notes: 'Scan QRIS Instant All Wallet & M-Banking'
    },
    'Checkout via Official Tokopedia (Cicilan 0%)': {
      bank: 'Tokopedia Official Store',
      logoSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#03ac0e"/><circle cx="9" cy="10" r="1.5" fill="#fff"/><circle cx="15" cy="10" r="1.5" fill="#fff"/><path d="M7.5 14.5c1.5 2 7.5 2 9 0" stroke="#fff" stroke-width="1.6"/></svg>`,
      accountNumber: 'Official Store Tokopedia Morgulzxz',
      accountNumberFormatted: 'Official Tokopedia: Morgulzxz Gaming',
      accountName: 'Morgulzxz Gaming Performance',
      notes: 'Tersedia Cicilan 0% s/d 24 Bulan'
    },
    'Checkout via Official Shopee (PayLater/ShopeePay)': {
      bank: 'Shopee Official Store',
      logoSvg: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#ee4d2d"/><path d="M7 10.5h10v7.5H7z" stroke="#fff" stroke-width="1.6"/><path d="M9.5 10.5V8a2.5 2.5 0 0 1 5 0v2.5" stroke="#fff" stroke-width="1.6"/></svg>`,
      accountNumber: 'Official Store Shopee Morgulzxz',
      accountNumberFormatted: 'Official Shopee: Morgulzxz Gaming',
      accountName: 'Morgulzxz Gaming Performance',
      notes: 'Bisa SPayLater & ShopeePay'
    }
  };

  // Render Dynamic Bank Account Details Card in Order Form
  function updateBankDetailsCard(paymentMethodKey) {
    const cardEl = document.getElementById('paymentBankDetailsCard');
    if (!cardEl) return;

    const info = PAYMENT_INFO[paymentMethodKey] || PAYMENT_INFO['Transfer Bank BCA Direct'];

    cardEl.innerHTML = `
      <div style="background: rgba(0, 0, 0, 0.45); border: 1px solid var(--border-glow); padding: 0.75rem 0.9rem; border-radius: var(--radius-md);">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.4rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${info.logoSvg}
            <strong style="color: #fff; font-size: 0.85rem;">${info.bank}</strong>
          </div>
          <span style="font-size: 0.7rem; color: var(--accent); background: rgba(0, 255, 157, 0.12); padding: 0.15rem 0.5rem; border-radius: 4px; border: 1px solid rgba(0, 255, 157, 0.3);">
            ✓ Terverifikasi
          </span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.05); padding: 0.45rem 0.7rem; border-radius: 6px; margin-bottom: 0.4rem; border: 1px solid rgba(255, 255, 255, 0.08);">
          <div>
            <div style="font-size: 0.7rem; color: var(--text-muted);">Nomor Rekening / Kode Resmi:</div>
            <div style="font-size: 0.95rem; font-weight: 800; color: var(--primary); letter-spacing: 0.5px; font-family: var(--font-heading);">${info.accountNumberFormatted}</div>
          </div>
          <button type="button" class="btn btn-secondary" id="copyBankAccBtn" data-copy="${info.accountNumber}" style="padding: 0.35rem 0.75rem; font-size: 0.75rem; gap: 0.35rem;">
            📋 Salin Rekening
          </button>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.775rem; color: var(--text-main);">
          <span>👤 <strong>A.n. Penerima:</strong> <span style="color: var(--warning); font-weight: 700;">${info.accountName}</span></span>
          <span style="color: var(--text-muted); font-size: 0.725rem;">${info.notes}</span>
        </div>
      </div>
    `;

    const copyBtn = document.getElementById('copyBankAccBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const textToCopy = copyBtn.getAttribute('data-copy');
        if (navigator.clipboard) {
          navigator.clipboard.writeText(textToCopy).then(() => {
            copyBtn.textContent = '✓ Tersalin!';
            setTimeout(() => { copyBtn.textContent = '📋 Salin Rekening'; }, 2000);
          });
        } else {
          alert(`Nomor Rekening: ${textToCopy}`);
        }
      });
    }
  }

  // 8. Open Order Form Modal (Form Pemesanan)
  function openOrderModal() {
    let count = 0;
    let totalPrice = 0;
    let totalWatts = 0;
    const partsSummary = [];

    PC_DATA.categories.forEach(cat => {
      const part = state.userBuild[cat.id];
      if (part) {
        count++;
        totalPrice += part.price;
        if (part.watts) totalWatts += part.watts;
        partsSummary.push(`<li style="margin-bottom: 0.25rem;"><strong style="color: var(--primary);">${cat.name.split(' ')[0]}:</strong> ${part.name}</li>`);
      }
    });

    if (count === 0) {
      alert('Silakan pilih minimal 1 komponen terlebih dahulu sebelum membuat pesanan!');
      return;
    }

    const orderSummaryPreviewEl = document.getElementById('orderSummaryPreview');
    if (orderSummaryPreviewEl) {
      orderSummaryPreviewEl.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; border-bottom: 1px dashed var(--border-color); padding-bottom: 0.5rem;">
          <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">
            📦 Total (${count} Komponen Terpilih)
          </span>
          <span style="font-size: 1.1rem; font-weight: 800; color: var(--accent); font-family: var(--font-heading);">
            ${formatIDR(totalPrice)}
          </span>
        </div>
        <ul style="font-size: 0.775rem; color: var(--text-main); list-style: none; max-height: 110px; overflow-y: auto; padding-right: 0.35rem;">
          ${partsSummary.join('')}
        </ul>
        <div style="margin-top: 0.5rem; font-size: 0.775rem; color: var(--warning); font-weight: 600; display: flex; justify-content: space-between;">
          <span>⚡ Estimasi Konsumsi Daya: ${totalWatts} Watts</span>
          <span style="color: var(--accent);">✓ Siap Dirakit</span>
        </div>
      `;
    }

    const orderPaymentMethodEl = document.getElementById('orderPaymentMethod');
    if (orderPaymentMethodEl) {
      updateBankDetailsCard(orderPaymentMethodEl.value);
    }

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
    const payment = document.getElementById('orderPaymentMethod').value;
    const delivery = document.getElementById('orderDeliveryOption').value;
    const notes = document.getElementById('orderNotes').value.trim();

    if (!name || !phone || !address) {
      alert('Mohon lengkapi Nama Lengkap, Nomor HP/WA, dan Alamat Pengiriman!');
      return null;
    }

    const payInfo = PAYMENT_INFO[payment] || PAYMENT_INFO['Transfer Bank BCA Direct'];

    let totalPrice = 0;
    let totalWatts = 0;
    let count = 0;
    let partsListMsg = '';

    PC_DATA.categories.forEach(cat => {
      const part = state.userBuild[cat.id];
      if (part) {
        count++;
        totalPrice += part.price;
        if (part.watts) totalWatts += part.watts;
        partsListMsg += `• *${cat.name.split(' ')[0]}*: ${part.name} (${formatIDR(part.price)})\n`;
      }
    });

    if (count === 0) {
      alert('Tidak ada komponen terpilih!');
      return null;
    }

    let msg = `🛒 *FORM PEMESANAN PC RAKITAN - MORGULZXZ GAMING*\n`;
    msg += `=========================================\n\n`;
    msg += `👤 *DATA PEMESAN:*\n`;
    msg += `• *Nama*: ${name}\n`;
    msg += `• *No. HP/WA*: ${phone}\n`;
    msg += `• *Alamat & Kota*: ${address}\n`;
    msg += `• *Metode Pembayaran*: ${payment}\n`;
    msg += `• *No. Rekening Tujuan*: ${payInfo.accountNumberFormatted}\n`;
    msg += `• *Atas Nama (A.n.)*: ${payInfo.accountName}\n`;
    msg += `• *Pengiriman*: ${delivery}\n`;
    if (notes) {
      msg += `• *Catatan Khusus*: ${notes}\n`;
    }
    msg += `\n-----------------------------------------\n`;
    msg += `💻 *RINCIAN PAKET PC RAKITAN:*\n`;
    msg += partsListMsg;
    msg += `\n⚡ *Estimasi Konsumsi Daya*: ${totalWatts} Watts\n`;
    msg += `💰 *TOTAL ESTIMASI HARGA*: ${formatIDR(totalPrice)}\n`;
    msg += `=========================================\n\n`;
    msg += `Mohon konfirmasi ketersediaan stok komponen di atas dan konfirmasi pembayaran. Terima kasih!`;

    return msg;
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
        <h3 style="font-size: 1.6rem;" class="text-gradient">MORGULZXZ GAMING PERFORMANCE SPEC</h3>
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

    // Contact Form submission handler
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Terima kasih! Pesan Anda telah terkirim. Tim konsultasi Morgulzxz Gaming Performance akan menghubungi Anda secepatnya.');
        contactForm.reset();
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

    // Mobile Menu Toggle logic
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
      mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        const icon = mobileMenuBtn.querySelector('i');
        if (icon) {
          if (navLinks.classList.contains('open')) {
            icon.className = 'feather feather-x';
          } else {
            icon.className = 'feather feather-menu';
          }
          if (window.feather) feather.replace();
        }
      });

      // Close mobile menu when clicking any nav link
      navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          navLinks.classList.remove('open');
          const icon = mobileMenuBtn.querySelector('i');
          if (icon) {
            icon.className = 'feather feather-menu';
            if (window.feather) feather.replace();
          }
        });
      });
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

    // Floating Cyber Music Player & YouTube Video Showcase Controller
    const musicModal = document.getElementById('musicModal');
    const closeMusicModalBtn = document.getElementById('closeMusicModalBtn');
    const musicPlayBtn = document.getElementById('musicPlayBtn');
    const musicInfoBtn = document.getElementById('musicInfoBtn');

    function openMusicModal() {
      if (musicModal) musicModal.classList.add('active');
    }

    function closeMusicModal() {
      if (musicModal) musicModal.classList.remove('active');
    }

    if (musicPlayBtn) musicPlayBtn.addEventListener('click', openMusicModal);
    if (musicInfoBtn) musicInfoBtn.addEventListener('click', openMusicModal);
    if (closeMusicModalBtn) closeMusicModalBtn.addEventListener('click', closeMusicModal);
    if (musicModal) {
      musicModal.addEventListener('click', (e) => {
        if (e.target === musicModal) closeMusicModal();
      });
    }

    // Minimize / Expand Floating Music Player Toggle
    const musicPlayer = document.getElementById('musicPlayer');
    const musicToggleBtn = document.getElementById('musicToggleBtn');
    const musicDisc = document.getElementById('musicDisc');

    if (musicPlayer && musicToggleBtn) {
      musicToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        musicPlayer.classList.toggle('minimized');
      });

      if (musicDisc) {
        musicDisc.addEventListener('click', (e) => {
          if (musicPlayer.classList.contains('minimized')) {
            e.stopPropagation();
            musicPlayer.classList.remove('minimized');
          }
        });
      }
    }

    // YouTube Autoplay & Instant Unmute Controller
    const postYTCmd = (func, args) => {
      const iframe = document.getElementById('ytPlayer');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage(JSON.stringify({
          'event': 'command',
          'func': func,
          'args': args || []
        }), '*');
      }
    };

    setTimeout(() => {
      postYTCmd('playVideo');
    }, 500);

    const unmuteYouTube = () => {
      postYTCmd('unMute');
      postYTCmd('setVolume', [100]);
      postYTCmd('playVideo');
    };

    const gestures = ['mousemove', 'mouseenter', 'scroll', 'wheel', 'touchstart', 'touchend', 'click', 'keydown'];
    gestures.forEach(g => {
      window.addEventListener(g, unmuteYouTube, { passive: true });
      document.addEventListener(g, unmuteYouTube, { passive: true });
    });
  }

  // Run initialization
  init();
});
