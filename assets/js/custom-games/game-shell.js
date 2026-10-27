import { icon } from "../icons.js";
import { isTouchDevice, storageGet, storageSet } from "../utilities.js";

const formatNumber = (value) => {
  const number = Number(value) || 0;
  return number.toLocaleString("en-GB");
};

export class GameShell {
  constructor(
    root,
    game,
    { bestMode = "higher", bestLabel = "Best", scoreLabel = "Score", renderer = "2d" } = {},
  ) {
    this.root = root;
    this.game = game;
    this.rendererMode = renderer;
    this.is3D = renderer === "3d";
    this.isDom = renderer === "dom";
    this.bestMode = bestMode;
    this.bestLabel = bestLabel;
    this.scoreLabel = scoreLabel;
    this.bestKey = `robloxsplay:best:${game.slug}`;
    this.score = 0;
    this.best = Number(storageGet(this.bestKey, 0)) || 0;
    this.pauseHandler = null;
    this.restartHandler = null;
    this.screenHandlers = {};
    this.controller = new AbortController();
    this.isTouch = isTouchDevice();

    root.innerHTML = this.markup();
    this.shell = root.querySelector(".game-shell");
    this.shell.classList.toggle("game-shell--3d", this.is3D);
    this.shell.classList.toggle("game-shell--dom", this.isDom);
    this.canvas = root.querySelector(".game-canvas");
    this.ctx = this.is3D || this.isDom ? null : this.canvas.getContext("2d");
    this.stage = root.querySelector(".game-stage");
    this.overlay = root.querySelector("[data-overlay]");
    this.scoreEl = root.querySelector("[data-score]");
    this.bestEl = root.querySelector("[data-best]");
    this.extraEl = root.querySelector("[data-extra]");
    this.statusText = root.querySelector("[data-status-text]");
    this.statusDot = root.querySelector("[data-status-dot]");
    this.pauseButton = root.querySelector("[data-pause]");
    this.pauseLabel = root.querySelector("[data-pause-label]");
    this.restartButton = root.querySelector("[data-restart]");
    this.fullscreenButton = root.querySelector("[data-fullscreen]");
    this.touch = root.querySelector("[data-touch]");
    this.live = root.querySelector("[data-game-live]");

    this.overlay.innerHTML = `
      <div class="game-overlay__panel">
        <div class="embed-loader" aria-hidden="true"></div>
        <p class="game-overlay__kicker">Preparing game</p>
        <h2>${this.game.title}</h2>
        <p>Loading the ${this.is3D ? "3D scene" : "game"}?</p>
      </div>
    `;

    this.setScore(0);
    this.setBest(this.best);
    this.bindGlobalControls();
    this.bindFullscreen();
  }

  markup() {
    const title = this.game.title;
    return `
      <div class="game-shell" data-game-frame>
        <div class="game-toolbar">
          <div class="game-toolbar__status">
            <span class="status-dot" data-status-dot aria-hidden="true"></span>
            <span data-status-text>Ready to play</span>
          </div>
          <div class="game-toolbar__actions">
            <button class="game-tool" type="button" data-pause aria-label="Pause game">
              <span data-pause-icon>${icon("pause")}</span><span class="game-tool__label" data-pause-label>Pause</span>
            </button>
            <button class="game-tool" type="button" data-restart aria-label="Restart game">
              ${icon("restart")}<span class="game-tool__label">Restart</span>
            </button>
            <button class="game-tool" type="button" data-fullscreen aria-label="Enter fullscreen">
              ${icon("fullscreen")}<span class="game-tool__label" data-fullscreen-label>Fullscreen</span>
            </button>
          </div>
        </div>
        <div class="game-hud">
          <div class="game-hud__item game-hud__item--accent"><span>${this.scoreLabel}</span><strong data-score>0</strong></div>
          <div class="game-hud__item"><span>${this.bestLabel}</span><strong data-best>0</strong></div>
          <div data-extra style="display:contents"></div>
        </div>
        <div class="game-stage" data-game-stage>
          <canvas class="game-canvas" width="960" height="600" tabindex="0" role="application" aria-label="${title} game. Select Play to begin."></canvas>
          <div class="game-overlay" data-overlay>
            <div class="game-overlay__panel">
              <span class="game-overlay__mark" aria-hidden="true">${icon("play")}</span>
              <p class="game-overlay__kicker">${this.game.renderer === "3d" ? "Robloxsplay 3D" : "Robloxsplay original"}</p>
              <h2>${title}</h2>
              <p>${this.game.tagline}</p>
              <div class="game-overlay__actions">
                <button class="button" type="button" data-screen-primary>Play</button>
              </div>
            </div>
          </div>
          <p class="game-live" data-game-live aria-live="polite"></p>
        </div>
        <div class="game-touch" data-touch hidden>
          <div class="touch-dpad" aria-label="Directional controls">
            <button type="button" data-dir="up" aria-label="Move up">↑</button>
            <button type="button" data-dir="left" aria-label="Move left">←</button>
            <button type="button" data-dir="down" aria-label="Move down">↓</button>
            <button type="button" data-dir="right" aria-label="Move right">→</button>
          </div>
          <p class="touch-note" data-touch-note>Use the pad or swipe<br>to move</p>
        </div>
        <div class="game-shell__footer">
          <span>${icon("spark")} ${this.game.title} / ${this.game.renderer === "3d" ? "Original Robloxsplay 3D build" : "Original Robloxsplay build"}</span>
          <span><kbd>P</kbd> pause <kbd>R</kbd> restart</span>
        </div>
      </div>
    `;
  }

  bindGlobalControls() {
    this.pauseButton.addEventListener("click", () => this.pauseHandler?.());
    this.restartButton.addEventListener("click", () => this.restartHandler?.());
    this.overlay.addEventListener("click", (event) => {
      if (event.target.closest("[data-screen-primary]")) {
        const handler = this.screenHandlers.primary;
        this.hideOverlay();
        this.canvas.focus({ preventScroll: true });
        handler?.();
      }
      if (event.target.closest("[data-screen-secondary]")) {
        const handler = this.screenHandlers.secondary;
        this.hideOverlay();
        handler?.();
      }
    });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden && this.pauseHandler && !this.overlayVisible()) {
          this.pauseHandler();
        }
      },
      { signal: this.controller.signal },
    );
    window.addEventListener(
      "keydown",
      (event) => {
        if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
        if (event.key.toLowerCase() === "p" && !event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          this.pauseHandler?.();
        }
        if (event.key.toLowerCase() === "r" && !event.metaKey && !event.ctrlKey) {
          event.preventDefault();
          this.restartHandler?.();
        }
        if (event.key.toLowerCase() === "f" && !event.metaKey && !event.ctrlKey) {
          const tag = document.activeElement?.tagName;
          if (tag !== "BUTTON") {
            event.preventDefault();
            this.toggleFullscreen();
          }
        }
      },
      { signal: this.controller.signal },
    );
  }

  bindFullscreen() {
    this.fullscreenButton.addEventListener("click", () => this.toggleFullscreen());
    document.addEventListener(
      "fullscreenchange",
      () => {
        const active = document.fullscreenElement === this.shell;
        const label = this.root.querySelector("[data-fullscreen-label]");
        if (label) label.textContent = active ? "Exit" : "Fullscreen";
        this.fullscreenButton.setAttribute(
          "aria-label",
          active ? "Exit fullscreen" : "Enter fullscreen",
        );
      },
      { signal: this.controller.signal },
    );
  }

  async toggleFullscreen() {
    try {
      if (document.fullscreenElement === this.shell) {
        await document.exitFullscreen();
      } else if (this.shell.requestFullscreen) {
        await this.shell.requestFullscreen();
      } else {
        this.announce("Fullscreen is not supported in this browser.");
      }
    } catch {
      this.announce("Fullscreen is not available right now.");
    }
  }

  setScore(value, record = false) {
    this.score = Number(value) || 0;
    this.scoreEl.textContent = formatNumber(this.score);
    if (record) this.recordBest(this.score);
  }

  setBest(value) {
    this.best = Number(value) || 0;
    this.bestEl.textContent = formatNumber(this.best);
  }

  recordBest(score) {
    const better =
      this.bestMode === "lower"
        ? score > 0 && (this.best === 0 || score < this.best)
        : score > this.best;
    if (better) {
      this.best = score;
      storageSet(this.bestKey, score);
      this.setBest(score);
      return true;
    }
    return false;
  }

  setExtra(items = []) {
    if (!this.extraEl) return;
    this.extraEl.innerHTML = items
      .map(
        (item) =>
          `<div class="game-hud__item"><span>${item.label}</span><strong>${item.value}</strong></div>`,
      )
      .join("");
  }

  setStatus(text, state = "ready") {
    if (this.statusText) this.statusText.textContent = text;
    if (this.statusDot) {
      this.statusDot.classList.toggle("status-dot--paused", state === "paused");
    }
  }

  setPaused(paused) {
    this.pauseLabel.textContent = paused ? "Resume" : "Pause";
    this.pauseButton.setAttribute("aria-label", paused ? "Resume game" : "Pause game");
    const pauseIcon = this.root.querySelector("[data-pause-icon]");
    if (pauseIcon) {
      pauseIcon.innerHTML = paused ? icon("play") : icon("pause");
    }
    this.setStatus(paused ? "Paused" : "In play", paused ? "paused" : "playing");
  }

  setPauseHandler(handler) {
    this.pauseHandler = handler;
  }

  setRestartHandler(handler) {
    this.restartHandler = handler;
  }

  showOverlay({
    kicker = "Robloxsplay original",
    title,
    text,
    actionLabel = "Play",
    onAction,
    secondaryLabel = "",
    onSecondary,
    showScore = false,
    scoreLabel = "Score",
    bestLabel = this.bestLabel,
    hint = "",
    mark = "play",
  }) {
    this.screenHandlers = { primary: onAction, secondary: onSecondary };
    this.overlay.innerHTML = `
      <div class="game-overlay__panel">
        <span class="game-overlay__mark" aria-hidden="true">${icon(mark)}</span>
        <p class="game-overlay__kicker">${kicker}</p>
        <h2>${title}</h2>
        <p>${text}</p>
        ${
          showScore
            ? `<div class="game-overlay__score">
                <div><span>${scoreLabel}</span><strong>${formatNumber(this.score)}</strong></div>
                <div><span>${bestLabel}</span><strong>${formatNumber(this.best)}</strong></div>
              </div>`
            : ""
        }
        <div class="game-overlay__actions">
          <button class="button" type="button" data-screen-primary>${actionLabel}</button>
          ${secondaryLabel ? `<button class="button button--ghost" type="button" data-screen-secondary>${secondaryLabel}</button>` : ""}
        </div>
        ${hint ? `<p class="game-overlay__hint">${hint}</p>` : ""}
      </div>
    `;
    this.overlay.hidden = false;
    requestAnimationFrame(() => {
      this.overlay.querySelector("[data-screen-primary]")?.focus({ preventScroll: true });
    });
  }

  hideOverlay() {
    this.overlay.hidden = true;
    this.screenHandlers = {};
  }

  overlayVisible() {
    return !this.overlay.hidden;
  }

  announce(message) {
    if (!this.live) return;
    this.live.textContent = "";
    window.setTimeout(() => {
      this.live.textContent = message;
    }, 30);
  }

  enableDpad(handler, note = "Use the pad or swipe<br>to move") {
    if (!this.isTouch) return;
    this.touch.hidden = false;
    this.touch.classList.add("is-ready", "is-visible");
    const noteEl = this.touch.querySelector("[data-touch-note]");
    if (noteEl) noteEl.innerHTML = note;
    this.touch.addEventListener(
      "pointerdown",
      (event) => {
        const button = event.target.closest("[data-dir]");
        if (!button) return;
        event.preventDefault();
        handler(button.dataset.dir);
      },
      { signal: this.controller.signal },
    );
  }

  enableSwipe(handler) {
    let start = null;
    this.stage.addEventListener(
      "pointerdown",
      (event) => {
        if (event.target.closest("button") || this.overlayVisible()) return;
        start = { x: event.clientX, y: event.clientY };
      },
      { signal: this.controller.signal },
    );
    this.stage.addEventListener(
      "pointerup",
      (event) => {
        if (!start) return;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        start = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          handler(dx > 0 ? "right" : "left");
        } else {
          handler(dy > 0 ? "down" : "up");
        }
      },
      { signal: this.controller.signal },
    );
  }

  onPointer(handler) {
    this.canvas.addEventListener(
      "pointerdown",
      (event) => {
        if (this.overlayVisible()) return;
        const rect = this.canvas.getBoundingClientRect();
        handler(
          ((event.clientX - rect.left) / rect.width) * this.canvas.width,
          ((event.clientY - rect.top) / rect.height) * this.canvas.height,
          event,
        );
      },
      { signal: this.controller.signal },
    );
  }

  onPointerMove(handler) {
    this.canvas.addEventListener(
      "pointermove",
      (event) => {
        if (this.overlayVisible()) return;
        const rect = this.canvas.getBoundingClientRect();
        handler(
          ((event.clientX - rect.left) / rect.width) * this.canvas.width,
          ((event.clientY - rect.top) / rect.height) * this.canvas.height,
          event,
        );
      },
      { signal: this.controller.signal },
    );
  }

  onKey(handler) {
    window.addEventListener(
      "keydown",
      (event) => {
        if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
        handler(event);
      },
      { signal: this.controller.signal },
    );
  }

  clear(color = "#04070d") {
    if (!this.ctx) return;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  destroy() {
    this.controller.abort();
    this.root.innerHTML = "";
  }
}
