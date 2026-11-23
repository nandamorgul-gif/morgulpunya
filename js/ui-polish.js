/** SEMEISTVO TECH — minimal UI fallbacks.
 * Does not alter music, form submission, PC Builder or cart state.
 */
document.addEventListener('DOMContentLoaded', () => {
  // External Wikimedia logo links can fail on ad-blocked/offline devices.
  // Fall back to readable bank-name text, never an invented brand emblem.
  document.querySelectorAll('.svo-payment-logo-frame img').forEach(img => {
    const frame = img.closest('.svo-payment-logo-frame');
    if (!frame) return;
    const failed = () => {
      frame.classList.add('is-fallback');
      frame.setAttribute('title', 'Logo tidak dapat dimuat; nama metode pembayaran tetap tersedia');
    };
    img.addEventListener('error', failed);
    img.addEventListener('load', () => {
      if (img.naturalWidth > 0) frame.classList.remove('is-fallback');
      else failed();
    });
    if (img.complete && img.naturalWidth === 0) failed();
  });
});
