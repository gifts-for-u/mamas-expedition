/**
 * ============================================================
 * UI.JS — Overlay Controllers (Rotate Gate, Boot, Letter, Flowers, Vouchers)
 * ============================================================
 */

import { CONFIG } from './config.js';
import { sfx } from './sfx.js';

export class ExpeditionUI {
  constructor(handlers = {}) {
    this.handlers = handlers;

    this.bypassRotate = false;
    this.bootStarted = false;
    this.bootCompleted = false;

    this.letterRunId = 0;
    this.endingRunId = 0;
    this.isLetterTyping = false;

    this.el = {
      rotateGate: document.getElementById('rotate-gate'),
      btnBypassRotate: document.getElementById('btn-bypass-rotate'),

      bootScreen: document.getElementById('boot-screen'),
      bootLog: document.getElementById('boot-log'),
      bootAction: document.getElementById('boot-action'),
      btnEnter3D: document.getElementById('btn-enter-3d'),

      hudTop: document.getElementById('hud-top'),
      hudStateLabel: document.getElementById('hud-state-label'),
      btnResetCam: document.getElementById('btn-reset-cam'),
      btnSfxToggle: document.getElementById('btn-sfx-toggle'),

      boxClosedHint: document.getElementById('box-closed-hint'),
      btnOpenBox: document.getElementById('btn-open-box'),

      boxOpenedDock: document.getElementById('box-opened-dock'),
      dockPills: Array.from(document.querySelectorAll('.dock-pill')),

      flowerPanel: document.getElementById('flower-panel'),
      btnFlowerBack: document.getElementById('btn-flower-back'),
      flowerEndingText: document.getElementById('flower-ending-text'),

      letterModal: document.getElementById('letter-modal'),
      btnLetterBack: document.getElementById('btn-letter-back'),
      btnLetterSkip: document.getElementById('btn-letter-skip'),
      letterHeading: document.getElementById('letter-heading'),
      letterBody: document.getElementById('letter-body'),
      letterSignoff: document.getElementById('letter-signoff'),
      btnLetterDone: document.getElementById('btn-letter-done'),

      voucherModal: document.getElementById('voucher-modal'),
      btnVoucherBack: document.getElementById('btn-voucher-back'),
      voucherGrid: document.getElementById('voucher-grid'),

      claimToast: document.getElementById('claim-toast'),
      claimToastText: document.getElementById('claim-toast-text'),
    };

    this._renderVoucherCards();
    this._bindEvents();
  }

  _bindEvents() {
    // Rotate gate bypass
    this.el.btnBypassRotate.addEventListener('click', () => {
      sfx.unlock();
      sfx.tap();
      this.bypassRotate = true;
      this.el.rotateGate.classList.add('is-hidden');
      this.checkBootStart();
    });

    // Enter 3D after boot
    this.el.btnEnter3D.addEventListener('click', () => {
      sfx.unlock();
      sfx.tap();
      if (this.handlers.onEnterStage) this.handlers.onEnterStage();
    });

    // HUD buttons
    this.el.btnResetCam.addEventListener('click', () => {
      sfx.tap();
      if (this.handlers.onResetCamera) this.handlers.onResetCamera();
    });

    this.el.btnSfxToggle.addEventListener('click', () => {
      const enabled = sfx.toggle();
      this.el.btnSfxToggle.textContent = enabled ? '🔊 SFX ON' : '🔇 SFX OFF';
      this.el.btnSfxToggle.setAttribute('aria-pressed', String(enabled));
    });

    // Closed box open button
    this.el.btnOpenBox.addEventListener('click', () => {
      sfx.unlock();
      if (this.handlers.onOpenBox) this.handlers.onOpenBox();
    });

    // Opened dock buttons
    this.el.dockPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        sfx.tap();
        const target = pill.dataset.target;
        if (target === 'letter' && this.handlers.onOpenLetter) this.handlers.onOpenLetter();
        if (target === 'flowers' && this.handlers.onOpenFlowers) this.handlers.onOpenFlowers();
        if (target === 'voucher' && this.handlers.onOpenVoucher) this.handlers.onOpenVoucher();
      });
    });

    // Flower panel actions
    this.el.btnFlowerBack.addEventListener('click', () => {
      sfx.tap();
      this.endingRunId++;
      if (this.handlers.onBackToBox) this.handlers.onBackToBox();
    });

    // Letter modal actions
    const closeLetter = () => {
      sfx.tap();
      this.letterRunId++;
      this.isLetterTyping = false;
      if (this.handlers.onBackToBox) this.handlers.onBackToBox();
    };
    this.el.btnLetterBack.addEventListener('click', closeLetter);
    this.el.btnLetterDone.addEventListener('click', closeLetter);

    this.el.btnLetterSkip.addEventListener('click', () => {
      sfx.tap();
      this.finishLetterImmediately();
    });

    // Voucher modal actions
    this.el.btnVoucherBack.addEventListener('click', () => {
      sfx.tap();
      if (this.handlers.onBackToBox) this.handlers.onBackToBox();
    });

    // Escape key closes active modal/panel on desktop
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (!this.el.letterModal.classList.contains('is-hidden')) closeLetter();
        else if (!this.el.voucherModal.classList.contains('is-hidden')) {
          sfx.tap();
          if (this.handlers.onBackToBox) this.handlers.onBackToBox();
        } else if (!this.el.flowerPanel.classList.contains('is-hidden')) {
          sfx.tap();
          this.endingRunId++;
          if (this.handlers.onBackToBox) this.handlers.onBackToBox();
        }
      }
    });

    // Listen to orientation & viewport changes
    const onOrientation = () => {
      this.updateOrientationGate();
      if (this.handlers.onOrientationChange) this.handlers.onOrientationChange();
    };
    window.addEventListener('resize', onOrientation);
    window.addEventListener('orientationchange', onOrientation);
  }

  /* ============================================================
     ORIENTATION GATE & QUICK BOOT
     ============================================================ */

  isPortraitMobile() {
    return window.innerHeight > window.innerWidth && window.innerWidth < 900;
  }

  updateOrientationGate() {
    const shouldShowGate = this.isPortraitMobile() && !this.bypassRotate;
    if (shouldShowGate) {
      this.el.rotateGate.classList.remove('is-hidden');
    } else {
      this.el.rotateGate.classList.add('is-hidden');
      this.checkBootStart();
    }
  }

  checkBootStart() {
    if (this.bootStarted || this.bootCompleted) return;
    this.bootStarted = true;
    this.runQuickBoot();
  }

  async runQuickBoot() {
    this.el.bootScreen.classList.remove('is-hidden');
    this.el.bootLog.innerHTML = '';
    this.el.bootAction.classList.add('is-hidden');

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    for (const item of CONFIG.bootLines) {
      const line = document.createElement('div');
      line.className = `boot-line boot-line--${item.type}`;
      this.el.bootLog.appendChild(line);

      if (item.type === 'fixing') {
        const base = item.text.replace(/\.+$/, '');
        const frames = ['.', '..', '...', '..', '...'];
        const stepMs = Math.max(120, Math.floor((item.duration || 1000) / frames.length));
        for (const dots of frames) {
          line.textContent = `${base}${dots}`;
          sfx.bootTick();
          await sleep(stepMs);
        }
      } else {
        line.textContent = item.text;
        if (item.type === 'error') sfx.errorBeep();
        else sfx.bootTick();
        await sleep(item.delay || 320);
      }

      this.el.bootLog.scrollTop = this.el.bootLog.scrollHeight;
    }

    this.bootCompleted = true;
    this.el.bootAction.classList.remove('is-hidden');
  }

  /* ============================================================
     STAGE VISIBILITY TRANSITIONS
     ============================================================ */

  showClosedBoxHUD() {
    this.el.bootScreen.classList.add('is-hidden');
    this.el.hudTop.classList.remove('is-hidden');
    this.el.boxClosedHint.classList.remove('is-hidden');
    this.el.boxOpenedDock.classList.add('is-hidden');
    this.el.flowerPanel.classList.add('is-hidden');
    this.el.letterModal.classList.add('is-hidden');
    this.el.voucherModal.classList.add('is-hidden');
    this.el.hudStateLabel.textContent = 'PAKEETT_ARRIVED';
  }

  hideClosedBoxHint() {
    this.el.boxClosedHint.classList.add('is-hidden');
    this.el.hudStateLabel.textContent = 'OPENING_PAKEETT...';
  }

  showOpenedBoxHUD() {
    this.el.boxClosedHint.classList.add('is-hidden');
    this.el.flowerPanel.classList.add('is-hidden');
    this.el.letterModal.classList.add('is-hidden');
    this.el.voucherModal.classList.add('is-hidden');
    this.el.boxOpenedDock.classList.remove('is-hidden');
    this.el.hudStateLabel.textContent = 'SELECT_ITEM';
  }

  markVisited(targetKey) {
    const pill = this.el.dockPills.find((p) => p.dataset.target === targetKey);
    if (pill) pill.classList.add('is-visited');
  }

  /* ============================================================
     BOUQUET MESSAGE PANEL
     ============================================================ */

  showFlowerPanel() {
    this.markVisited('flowers');
    this.el.boxOpenedDock.classList.add('is-hidden');
    this.el.flowerPanel.classList.remove('is-hidden');
    this.el.hudStateLabel.textContent = 'BOUQUET_VIEW';
    this.playBouquetEndingCopy();
  }

  async playBouquetEndingCopy() {
    const runId = ++this.endingRunId;
    this.el.flowerEndingText.textContent = '';

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const lines = CONFIG.bouquetEndingLines;
    let built = '';

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      if (li > 0) built += '\n';

      for (let ci = 0; ci < line.length; ci++) {
        if (runId !== this.endingRunId) return;
        built += line[ci];
        this.el.flowerEndingText.textContent = built;
        if (ci % 2 === 0) sfx.typeTick();
        await sleep(42);
      }
      await sleep(340);
    }
  }

  /* ============================================================
     APOLOGY LETTER MODAL (Staged Typing)
     ============================================================ */

  async showLetterModal() {
    this.markVisited('letter');
    this.el.boxOpenedDock.classList.add('is-hidden');
    this.el.letterModal.classList.remove('is-hidden');
    this.el.hudStateLabel.textContent = 'READING_LETTER';

    this.el.letterHeading.textContent = CONFIG.letter.heading;
    this.el.letterBody.innerHTML = '';
    this.el.letterSignoff.textContent = CONFIG.letter.signoff;
    this.el.letterSignoff.classList.add('is-hidden');
    this.el.btnLetterDone.classList.add('is-hidden');
    this.el.btnLetterSkip.classList.remove('is-hidden');

    const runId = ++this.letterRunId;
    this.isLetterTyping = true;

    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    for (const para of CONFIG.letter.paragraphs) {
      if (runId !== this.letterRunId) return;
      const pEl = document.createElement('p');
      const textNode = document.createTextNode('');
      const cursor = document.createElement('span');
      cursor.className = 'typing-cursor';
      pEl.appendChild(textNode);
      pEl.appendChild(cursor);
      this.el.letterBody.appendChild(pEl);

      for (let i = 0; i < para.length; i++) {
        if (runId !== this.letterRunId) return;
        textNode.nodeValue += para[i];
        if (i % 4 === 0 && para[i] !== ' ') sfx.typeTick();
        this.el.letterBody.scrollTop = this.el.letterBody.scrollHeight;
        await sleep(22);
      }

      cursor.remove();
      await sleep(240);
    }

    if (runId !== this.letterRunId) return;
    this._onLetterFinished();
  }

  finishLetterImmediately() {
    this.letterRunId++;
    this.el.letterBody.innerHTML = '';
    CONFIG.letter.paragraphs.forEach((para) => {
      const p = document.createElement('p');
      p.textContent = para;
      this.el.letterBody.appendChild(p);
    });
    this._onLetterFinished();
  }

  _onLetterFinished() {
    this.isLetterTyping = false;
    this.el.btnLetterSkip.classList.add('is-hidden');
    this.el.letterSignoff.classList.remove('is-hidden');
    this.el.btnLetterDone.classList.remove('is-hidden');
  }

  /* ============================================================
     VOUCHER MODAL (3 Choices -> Direct WhatsApp)
     ============================================================ */

  _renderVoucherCards() {
    this.el.voucherGrid.innerHTML = '';

    CONFIG.vouchers.forEach((v) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'voucher-card';
      card.style.setProperty('--card-accent', v.accent);
      card.innerHTML = `
        <div class="voucher-card-top">
          <span class="voucher-emoji" aria-hidden="true">${v.emoji}</span>
          <span class="voucher-tag">${v.tag}</span>
        </div>
        <h3 class="voucher-name">${v.title}</h3>
        <p class="voucher-desc">${v.description}</p>
        <div class="voucher-cta">
          <span>KLAIM KE WA</span>
          <span>→</span>
        </div>
      `;

      card.addEventListener('click', () => this.claimVoucher(v));
      this.el.voucherGrid.appendChild(card);
    });
  }

  showVoucherModal() {
    this.markVisited('voucher');
    this.el.boxOpenedDock.classList.add('is-hidden');
    this.el.voucherModal.classList.remove('is-hidden');
    this.el.hudStateLabel.textContent = 'CLAIM_VOUCHER';
  }

  claimVoucher(voucher) {
    sfx.voucherClaim();
    const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(voucher.waMessage)}`;

    this.el.claimToastText.textContent = `Voucher ${voucher.title} diklaim! Membuka WhatsApp Mamas...`;
    this.el.claimToast.classList.remove('is-hidden');

    setTimeout(() => {
      this.el.claimToast.classList.add('is-hidden');
      window.location.href = waUrl;
    }, 620);
  }
}
