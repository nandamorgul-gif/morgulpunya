/**
 * SEMEISTVOTECH — renderer ikon kompatibel dengan markup lama.
 * Bekerja tanpa ketergantungan jaringan; bila Feather tersedia gunakan SVG aslinya.
 */
(() => {
  const paths = {
    "home": '<path d="M3 10 12 3l9 7v11h-6v-7H9v7H3z"/>',
    "grid": '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
    "sliders": '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    "download": '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
    "info": '<circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10v1"/>',
    "phone-call": '<path d="M22 16.9v3a2 2 0 0 1-2.2 2A19 19 0 0 1 2 4.2 2 2 0 0 1 4 2h3l2 5-3 2a16 16 0 0 0 9 9l2-3z"/><path d="M15 3a6 6 0 0 1 6 6"/>',
    "menu": '<path d="M4 6h16M4 12h16M4 18h16"/>',
    "x": '<path d="M18 6 6 18M6 6l12 12"/>',
    "cpu": '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v4m6-4v4M9 19v4m6-4v4M1 9h4m-4 6h4m14-6h4m-4 6h4"/>',
    "monitor": '<rect x="2" y="3" width="20" height="15" rx="2"/><path d="M8 22h8m-4-4v4"/>',
    "server": '<rect x="3" y="3" width="18" height="8" rx="2"/><rect x="3" y="13" width="18" height="8" rx="2"/><path d="M7 7h.01M7 17h.01"/>',
    "hard-drive": '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 14h.01M11 14h.01"/>',
    "database": '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 4 18 4 18 0V5M3 12c0 4 18 4 18 0"/>',
    "zap": '<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
    "box": '<path d="m3 7 9-4 9 4v10l-9 4-9-4zM3 7l9 5 9-5m-9 5v9"/>',
    "wind": '<path d="M2 8h14a4 4 0 1 0-4-4M2 12h18a3 3 0 1 1-3 3M2 16h10a3 3 0 1 1-3 3"/>',
    "tag": '<path d="M20 13 11 22 2 13V3h10z"/><circle cx="7" cy="8" r="1"/>',
    "check": '<path d="m4 12 5 5L20 6"/>',
    "check-circle": '<circle cx="12" cy="12" r="10"/><path d="m7 12 3 3 7-7"/>',
    "chevron-down": '<path d="m6 9 6 6 6-6"/>',
    "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    "credit-card": '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>',
    "file-text": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8"/>',
    "film": '<rect x="2" y="2" width="20" height="20" rx="2"/><path d="M7 2v20M17 2v20M2 8h5m-5 8h5m10-8h5m-5 8h5"/>',
    "layers": '<path d="m12 2 10 5-10 5L2 7zm-10 10 10 5 10-5M2 17l10 5 10-5"/>',
    "message-circle": '<path d="M21 11.5a9 9 0 0 1-9.5 9A9 9 0 0 1 7 19l-5 2 2-5a9 9 0 1 1 17-4.5z"/>',
    "minus": '<path d="M5 12h14"/>',
    "music": '<path d="M9 18V5l12-2v13M9 10l12-2"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    "package": '<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5m-9 5v10M7.5 4.5l9 5"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>',
    "printer": '<path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z"/>',
    "rotate-ccw": '<path d="M3 8V2m0 6h6M3 8a9 9 0 1 1 1 9"/>',
    "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4-4"/>',
    "send": '<path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/>',
    "shield": '<path d="m12 22 1-1c5-2 8-6 8-12V5l-9-3-9 3v4c0 6 3 10 8 12z"/>',
    "terminal": '<rect x="2" y="3" width="20" height="18" rx="2"/><path d="m6 9 4 3-4 3m6 0h6"/>',
    "activity": '<path d="M2 12h4l3-8 5 16 3-8h5"/>',
    "youtube": '<rect x="2" y="5" width="20" height="14" rx="5"/><path d="m10 9 5 3-5 3z"/>'
  };
  let queued = false;
  function draw() {
    queued = false;
    document.querySelectorAll('i.feather').forEach(node => {
      const iconName = [...node.classList].find(c => c.startsWith('feather-'))?.slice(8);
      if (!iconName) return;
      let markup = '';
      try {
        if (window.feather?.icons?.[iconName]) {
          markup = window.feather.icons[iconName].toSvg({ width: 18, height: 18, 'stroke-width': 2 });
        }
      } catch { /* gunakan SVG lokal */ }
      if (!markup) {
        markup = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
          (paths[iconName] || paths.info) + '</svg>';
      }
      const slot = document.createElement('span');
      slot.innerHTML = markup;
      const svg = slot.firstElementChild;
      if (!svg) return;
      svg.classList.add(...node.classList, 'icon-svg');
      for (const attr of node.attributes) {
        if (attr.name !== 'class') svg.setAttribute(attr.name, attr.value);
      }
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      node.replaceWith(svg);
    });
  }
  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(draw);
  }
  function initIcons() {
    draw();
    const observer = new MutationObserver(mutations => {
      if (mutations.some(m => [...m.addedNodes].some(n =>
        n.nodeType === 1 && (n.matches?.('i.feather') || n.querySelector?.('i.feather'))))) queue();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIcons);
  } else initIcons();
})();
