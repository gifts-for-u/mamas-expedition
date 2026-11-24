/**
 * ============================================================
 * APP.JS — Main Orchestrator for Mamas Expedition (MamasOS v2)
 * ============================================================
 */

import { ExpeditionScene3D } from './scene3d.js';
import { ExpeditionUI } from './ui.js';
import { sfx } from './sfx.js';

function initApp() {
  const stageEl = document.getElementById('stage-3d');

  let scene3d = null;
  let ui = null;

  const openBoxFlow = () => {
    if (!scene3d || scene3d.isBoxOpen || scene3d.isAnimatingOpen) return;
    sfx.unlock();
    sfx.boxOpen();
    ui.hideClosedBoxHint();
    scene3d.openBox();
  };

  const openFlowersFlow = () => {
    sfx.flowerChime();
    scene3d.focusBouquet();
    ui.showFlowerPanel();
  };

  const openLetterFlow = () => {
    sfx.letterOpen();
    scene3d.focusLetter();
    ui.showLetterModal();
  };

  const openVoucherFlow = () => {
    sfx.tap();
    scene3d.focusVoucher();
    ui.showVoucherModal();
  };

  const backToBoxFlow = () => {
    scene3d.focusOverview();
    ui.showOpenedBoxHUD();
  };

  scene3d = new ExpeditionScene3D(stageEl, {
    onRequestOpenBox: openBoxFlow,
    onBoxOpened: () => {
      ui.showOpenedBoxHUD();
    },
    onOpenFlowers: openFlowersFlow,
    onOpenLetter: openLetterFlow,
    onOpenVoucher: openVoucherFlow,
  });

  ui = new ExpeditionUI({
    onOrientationChange: () => {
      scene3d.handleResize();
    },
    onEnterStage: () => {
      ui.showClosedBoxHUD();
      scene3d.focusOverview();
    },
    onResetCamera: () => {
      if (scene3d.mode === 'FLOWERS') {
        scene3d.focusBouquet();
      } else {
        scene3d.focusOverview();
      }
    },
    onOpenBox: openBoxFlow,
    onOpenFlowers: openFlowersFlow,
    onOpenLetter: openLetterFlow,
    onOpenVoucher: openVoucherFlow,
    onBackToBox: backToBoxFlow,
  });

  // Unlock audio on the very first user gesture anywhere
  const unlockOnce = () => {
    sfx.unlock();
    window.removeEventListener('pointerdown', unlockOnce);
    window.removeEventListener('keydown', unlockOnce);
  };
  window.addEventListener('pointerdown', unlockOnce, { passive: true });
  window.addEventListener('keydown', unlockOnce, { passive: true });

  // Kick off orientation gate check -> quick boot
  ui.updateOrientationGate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
