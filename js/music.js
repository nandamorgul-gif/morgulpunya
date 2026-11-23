/**
 * SEMEISTVO TECH Music — Restored from the original storefront.
 * Embeds the original YouTube video ID on user interaction only.
 * Audio/video is streamed by YouTube, never hosted or re-uploaded here.
 */
(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('svoMusicPlayer');
    if (!root) return;
    const toggle = document.getElementById('svoMusicCollapse');
    const play = document.getElementById('svoMusicPlay');
    const pause = document.getElementById('svoMusicPause');
    const status = document.getElementById('svoMusicStatus');
    const content = document.getElementById('svoMusicContent');
    const videoId = '8_y6w1V9PXs'; // Existing video reference in pre-rebrand website.
    let player = null;
    let isReady = false;
    let apiLoading = false;
    let wantsPlay = false;
    let started = false;

    function setStatus(text) { status.textContent = text; }
    function setPlaying(playing) {
      root.classList.toggle('is-playing', playing);
      play.disabled = playing;
      pause.disabled = !playing;
      play.setAttribute('aria-pressed', String(playing));
      pause.setAttribute('aria-pressed', String(!playing));
      setStatus(playing ? 'Sedang diputar via YouTube' : (started ? 'Dijeda' : 'Siap diputar'));
    }
    function expand() {
      root.classList.remove('is-collapsed');
      content.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Kecilkan pemutar musik');
    }
    function togglePanel() {
      const collapsed = root.classList.toggle('is-collapsed');
      content.hidden = collapsed;
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.setAttribute('aria-label', collapsed ? 'Buka pemutar musik' : 'Kecilkan pemutar musik');
    }
    function ready() {
      isReady = true;
      setStatus('Siap diputar');
      if (wantsPlay) {
        wantsPlay = false;
        // Some browsers may still require another click on the YouTube control.
        try { player.playVideo(); } catch (_) {}
      }
    }
    function initializePlayer() {
      if (player || !window.YT || typeof window.YT.Player !== 'function') return;
      player = new window.YT.Player('svoMusicVideoSlot', {
        height: '195', width: '346', videoId,
        playerVars: { playsinline: 1, controls: 1, rel: 0, autoplay: 0 },
        events: {
          onReady: ready,
          onStateChange(event) {
            if (!window.YT) return;
            if (event.data === window.YT.PlayerState.PLAYING) {
              started = true; setPlaying(true);
            } else if (event.data === window.YT.PlayerState.PAUSED ||
                       event.data === window.YT.PlayerState.ENDED ||
                       event.data === window.YT.PlayerState.CUED) {
              setPlaying(false);
            }
          },
          onError() {
            wantsPlay = false;
            play.disabled = false;
            pause.disabled = true;
            setStatus('Video tidak tersedia. Buka tautan YouTube.');
          }
        }
      });
    }
    function loadApi() {
      if (window.YT?.Player) { initializePlayer(); return; }
      if (apiLoading) return;
      apiLoading = true;
      setStatus('Menghubungkan pemutar YouTube...');
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousCallback === 'function') previousCallback();
        initializePlayer();
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        apiLoading = false; wantsPlay = false;
        setStatus('Gagal memuat YouTube. Gunakan tautan eksternal.');
        play.disabled = false;
      };
      document.head.appendChild(script);
    }
    toggle.addEventListener('click', togglePanel);
    play.addEventListener('click', () => {
      expand();
      if (!player) {
        wantsPlay = true;
        loadApi();
        return;
      }
      if (!isReady) { wantsPlay = true; setStatus('Memuat video...'); return; }
      try { player.playVideo(); } catch (_) { setStatus('Gunakan tombol play pada video.'); }
    });
    pause.addEventListener('click', () => {
      wantsPlay = false;
      if (player?.pauseVideo) {
        try { player.pauseVideo(); } catch (_) {}
      }
      setPlaying(false);
    });
    setPlaying(false);
  });
})();
