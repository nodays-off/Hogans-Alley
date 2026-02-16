/**
 * 360° Product Viewer
 * Drag-to-rotate, touch-enabled, with auto-play intro spin.
 */
(function () {
  'use strict';

  const FRAME_COUNT = 36;
  const FRAME_PATH = '/Pictures/360-money-web/frame-';
  const FRAME_EXT = '.webp';
  const AUTO_SPIN_SPEED = 120; // ms per frame during intro spin

  function pad(n) {
    return String(n).padStart(3, '0');
  }

  function init() {
    const container = document.getElementById('viewer360');
    if (!container) return;

    const canvas = container.querySelector('.viewer360-canvas');
    const hint = container.querySelector('.viewer360-hint');
    const frames = [];
    let currentFrame = 0;
    let loaded = 0;
    let dragging = false;
    let dragStartX = 0;
    let dragStartFrame = 0;
    let autoSpinId = null;
    let hasInteracted = false;

    // Preload all frames
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = FRAME_PATH + pad(i) + FRAME_EXT;
      img.onload = function () {
        loaded++;
        if (loaded === FRAME_COUNT) onAllLoaded();
      };
      img.onerror = function() {
        loaded++;
        if (loaded === FRAME_COUNT) onAllLoaded();
      };
      frames.push(img);
    }

    // Show first frame immediately if already cached
    if (frames[0].complete) showFrame(0);

    function showFrame(index) {
      currentFrame = ((index % FRAME_COUNT) + FRAME_COUNT) % FRAME_COUNT;
      canvas.src = frames[currentFrame].src;
      canvas.alt = 'Money Rain Parka - 360° view (angle ' + (currentFrame * 10) + '°)';
    }

    function onAllLoaded() {
      container.classList.add('loaded');
      showFrame(0);
      startAutoSpin();
    }

    function startAutoSpin() {
      let spinFrame = 0;
      autoSpinId = setInterval(function () {
        spinFrame++;
        showFrame(spinFrame);
        if (spinFrame >= FRAME_COUNT) {
          clearInterval(autoSpinId);
          autoSpinId = null;
          showFrame(0);
        }
      }, AUTO_SPIN_SPEED);
    }

    function stopAutoSpin() {
      if (autoSpinId) {
        clearInterval(autoSpinId);
        autoSpinId = null;
      }
    }

    function onDragStart(x) {
      stopAutoSpin();
      dragging = true;
      dragStartX = x;
      dragStartFrame = currentFrame;
      container.classList.add('grabbing');
      if (!hasInteracted && hint) {
        hasInteracted = true;
        hint.classList.add('hidden');
      }
    }

    function onDragMove(x) {
      if (!dragging) return;
      var dx = x - dragStartX;
      // 5px per frame step
      var frameDelta = Math.round(dx / 5);
      showFrame(dragStartFrame - frameDelta);
    }

    function onDragEnd() {
      dragging = false;
      container.classList.remove('grabbing');
    }

    // Mouse events
    canvas.addEventListener('mousedown', function (e) {
      e.preventDefault();
      onDragStart(e.clientX);
    });
    window.addEventListener('mousemove', function (e) {
      onDragMove(e.clientX);
    });
    window.addEventListener('mouseup', onDragEnd);

    // Touch events
    canvas.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        onDragStart(e.touches[0].clientX);
      }
    }, { passive: true });
    canvas.addEventListener('touchmove', function (e) {
      if (e.touches.length === 1) {
        onDragMove(e.touches[0].clientX);
      }
    }, { passive: true });
    canvas.addEventListener('touchend', onDragEnd);
    canvas.addEventListener('touchcancel', onDragEnd);

    // Prevent image drag
    canvas.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  // Boot after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
