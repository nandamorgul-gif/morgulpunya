(() => {
  const controls = document.createElement('div');
  controls.className = 'svo-scroll-controls';
  controls.setAttribute('role', 'group');
  controls.setAttribute('aria-label', 'Gulir halaman');
  controls.innerHTML = `
    <button type="button" data-svo-scroll="top" aria-label="Ke atas halaman" title="Ke atas halaman">
      <i class="feather feather-chevron-down" aria-hidden="true"></i>
    </button>
    <button type="button" data-svo-scroll="bottom" aria-label="Ke bawah halaman" title="Ke bawah halaman">
      <i class="feather feather-chevron-down" aria-hidden="true"></i>
    </button>`;

  const [up, down] = controls.querySelectorAll('button');
  up.addEventListener('click', () => window.scrollTo({ top: 0 }));
  down.addEventListener('click', () => window.scrollTo({ top: document.scrollingElement.scrollHeight }));
  document.body.append(controls);

  const player = document.getElementById('svoMusicPlayer');
  if (player) {
    const updateClearance = () => {
      const music = player.getBoundingClientRect();
      const arrows = controls.getBoundingClientRect();
      const sharesColumn = music.right > arrows.left && music.left < arrows.right;
      const clearance = sharesColumn ? Math.ceil(window.innerHeight - music.top) + 10 : 0;
      controls.style.setProperty('--svo-scroll-player-clearance', `${clearance}px`);
    };

    updateClearance();
    window.addEventListener('resize', updateClearance);
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(updateClearance).observe(player);
  }
})();
