/**
 * SEMEISTVO TECH — discreet background music controller.
 * Original YouTube track ID retained; no ripped or hosted audio.
 * Browsers may restrict autoplay with sound. We attempt autoplay muted,
 * and expose one-tap unmute without intrusive gesture listeners.
 */
(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const root = document.getElementById('svoMusicPlayer');
    if (!root) return;
    const toggle = document.getElementById('svoMusicCollapse');
    const play = document.getElementById('svoMusicPlay');
    const pause = document.getElementById('svoMusicPause');
    const mute = document.getElementById('svoMusicMute');
    const status = document.getElementById('svoMusicStatus');
    const content = document.getElementById('svoMusicContent');
    const videoId = '8_y6w1V9PXs';
    const SESSION_KEY = 'svo-music-muted-v2';
    let player = null;
    let ready = false;
    let apiLoading = false;
    let pending = false;
    let playing = false;
    let muted = false;
    let error = false;
    let retriedMuted = false;

    // Session preference is only a preference: browser policy takes priority.
    try {
      const previous = sessionStorage.getItem(SESSION_KEY);
      if (previous !== null) muted = previous !== 'false';
    } catch (_) {}
    const setStatus = (message) => { status.textContent = message; };
    function updateControls() {
      root.classList.toggle('is-playing', playing);
      root.classList.toggle('is-muted', muted);
      play.disabled = playing;
      pause.disabled = !playing;
      mute.textContent = muted ? 'Aktifkan suara' : 'Matikan suara';
      mute.setAttribute('aria-pressed', String(!muted));
      root.setAttribute('data-music-state', error ? 'error' : (playing ? (muted ? 'muted' : 'playing') : 'paused'));
    }
    function collapse(value) {
      root.classList.toggle('is-collapsed', value);
      content.hidden = value;
      toggle.setAttribute('aria-expanded', String(!value));
      toggle.setAttribute('aria-label', value ? 'Buka kontrol musik' : 'Sembunyikan kontrol musik');
    }
    function applyMute(shouldMute) {
      muted = shouldMute;
      try { sessionStorage.setItem(SESSION_KEY, String(shouldMute)); } catch (_) {}
      if (player && ready) {
        try { shouldMute ? player.mute() : player.unMute(); } catch (_) {}
      }
      updateControls();
      setStatus(shouldMute ? 'Musik berjalan tanpa suara — ketuk untuk aktifkan suara'
                           : (playing ? 'Musik sedang diputar' : 'Musik siap diputar'));
    }
    function startPlayback() {
      if (!player || !ready) { pending = true; return; }
      try {
        // Mute before autoplay attempt to comply with browser autoplay rules.
        player.mute();
        player.playVideo();
        pending = false;
        if (!muted) {
          // Restore user session intent once ready; browser can still block audio.
          player.unMute();
        }
      } catch (_) {
        setStatus('Autoplay diblokir — tekan Putar untuk memulai.');
      }
    }
    function createPlayer() {
      if (player || !window.YT?.Player) return;
      player = new window.YT.Player('svoMusicVideoSlot', {
        width: '240', height: '200', videoId,
        playerVars: { playsinline: 1, autoplay: 1, mute: 1, controls: 1, loop: 1, playlist: videoId, rel: 0 },
        events: {
          onReady: () => {
            ready = true;
            setStatus('Mempersiapkan musik...');
            startPlayback();
          },
          onStateChange: (e) => {
            if (!window.YT?.PlayerState) return;
            if (e.data === window.YT.PlayerState.PLAYING) {
              playing = true;
              const actualMute = typeof player.isMuted === 'function' ? player.isMuted() : true;
              muted = actualMute;
              setStatus(muted ? 'Musik diputar tanpa suara — ketuk untuk aktifkan suara' : 'Musik sedang diputar');
            } else if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) {
              playing = false; setStatus('Musik dijeda');
            }
            updateControls();
          },
          onAutoplayBlocked: () => {
            playing = false;
            if (!retriedMuted) {
              retriedMuted = true;
              muted = true;
              try { player?.mute(); player?.playVideo(); } catch (_) {}
              setStatus('Autoplay bersuara diblokir; mencoba musik tanpa suara.');
            } else {
              setStatus('Browser menahan autoplay. Ketuk ikon musik untuk memulai.');
            }
            updateControls();
          },
          onError: () => {
            error = true; playing = false; pending = false;
            setStatus('Video tidak tersedia. Buka melalui YouTube.');
            updateControls();
          }
        }
      });
    }
    function loadApi() {
      if (window.YT?.Player) { createPlayer(); return; }
      if (apiLoading) return;
      apiLoading = true;
      const prior = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prior === 'function') prior();
        createPlayer();
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        error = true; apiLoading = false; pending = false;
        setStatus('YouTube tidak dapat dimuat. Buka video secara langsung.');
        updateControls();
      };
      document.head.appendChild(script);
    }
    toggle.addEventListener('click', () => {
      const wasCollapsed = root.classList.contains('is-collapsed');
      collapse(!wasCollapsed);
      if (!wasCollapsed) return;
      if (ready) {
        // The icon is an intentional user gesture; a single tap can enable audio.
        if (muted) applyMute(false);
        if (!playing) startPlayback();
      } else if (!apiLoading) loadApi();
    });
    play.addEventListener('click', () => {
      pending = true;
      if (!ready) { loadApi(); setStatus('Memuat pemutar musik...'); return; }
      startPlayback();
    });
    pause.addEventListener('click', () => {
      pending = false;
      try { player?.pauseVideo(); } catch (_) {}
      playing = false; setStatus('Musik dijeda'); updateControls();
    });
    mute.addEventListener('click', () => {
      applyMute(!muted);
      if (!ready) { pending = true; loadApi(); }
      else if (!playing) { startPlayback(); }
    });
    document.addEventListener('visibilitychange', () => {
      // Never force unmute or resume on unrelated browsing gestures.
      if (document.hidden && !playing) updateControls();
    });
    collapse(true);
    updateControls();
    pending = true;
    loadApi(); // Browser may allow muted autoplay. Sound requires its permission or click.
  });
})();
