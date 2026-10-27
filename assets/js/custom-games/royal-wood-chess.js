import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Chess } from "../../vendor/chess/chess.js";
import { createStage, show3DError } from "./three-kit.js";
import { icon } from "../icons.js";
import { prefersReducedMotion, storageGet, storageSet } from "../utilities.js";
import {
  createChessMaterials,
  createChessBoard,
  createPiece,
  squareToWorld,
  worldToSquare,
  PIECE_LABELS,
} from "./chess/pieces.js";
import { createEnvironments } from "./chess/environments.js";
import { ChessEngine } from "./chess/engine.js";
import { ChessAudio } from "./chess/audio.js";

const SETTINGS_KEY = "robloxsplay:royal-wood-chess:settings";
const SOUND_KEY = "robloxsplay:royal-wood-chess:sound";
const WOOD_BASE = "/assets/games/royal-wood-chess/wood";
const BACKDROP_LABELS = {
  study: "Wooden Study",
  forest: "Forest Nature",
  royal: "Dark Royal Room",
};
const DIFFICULTY_LABELS = {
  easy: "Easy / Club",
  medium: "Medium / Rival",
  hard: "Hard / Stockfish",
};
const PROMO_LABELS = { q: "Queen", r: "Rook", b: "Bishop", n: "Knight" };

const SPEAKER_SVG = `<svg class="chess-sound-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h4l5-4v14l-5-4H4V9Z"/><path d="M16 8.5c1.7 1.8 1.7 5.2 0 7M19 6c3 3.2 3 8.8 0 12"/></svg>`;
const MUTED_SVG = `<svg class="chess-sound-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h4l5-4v14l-5-4H4V9Z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>`;

const CROWN_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M10 23l8 8 14-17 14 17 8-8-4 27H14L10 23Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M16 50h32M22 57h20" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><circle cx="10" cy="21" r="3" fill="currentColor"/><circle cx="32" cy="11" r="3" fill="currentColor"/><circle cx="54" cy="21" r="3" fill="currentColor"/></svg>`;

function pieceAbbrev(type) {
  return type === "n" ? "N" : type.toUpperCase();
}

function loadImageTexture(loader, url, srgb = false) {
  return new Promise((resolve) => {
    loader.load(
      url,
      (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = 8;
        texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        resolve(texture);
      },
      undefined,
      () => resolve(null),
    );
  });
}

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export default function createRoyalWoodChess(shell) {
  let stage;
  try {
    stage = createStage(shell, {
      fov: 45,
      near: 0.1,
      far: 150,
      background: "#110c08",
      fogColor: "#1c130d",
      fogNear: 20,
      fogFar: 48,
      shadows: true,
    });
  } catch (error) {
    show3DError(shell, error.message);
    return { destroy() {} };
  }

  const { renderer, scene, camera } = stage;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMappingExposure = 1.05;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  camera.position.set(0, 8.45, 10.8);
  camera.lookAt(0, 0.05, -0.25);

  shell.root.classList.add("game-shell--chess");
  const hud = shell.root.querySelector(".game-hud");
  if (hud) hud.style.display = "none";
  const pause = shell.root.querySelector("[data-pause]");
  if (pause) pause.style.display = "none";
  if (shell.touch) {
    shell.touch.hidden = true;
    shell.touch.style.display = "none";
  }
  const footerLast = shell.root.querySelector(".game-shell__footer span:last-child");
  if (footerLast) footerLast.innerHTML = "<kbd>Drag</kbd> orbit <kbd>Scroll</kbd> zoom";

  const saved = storageGet(SETTINGS_KEY, {}) || {};
  const settings = {
    mode: saved.mode === "local" ? "local" : "computer",
    side: saved.side === "b" ? "b" : "w",
    difficulty: ["easy", "medium", "hard"].includes(saved.difficulty) ? saved.difficulty : "medium",
    background: ["study", "forest", "royal"].includes(saved.background) ? saved.background : "study",
  };
  let soundOn = storageGet(SOUND_KEY, true) !== false;
  const reducedMotion = prefersReducedMotion();

  const game = new Chess();
  const audio = new ChessAudio(soundOn);
  const engine = new ChessEngine({
    onStatus: (status, message) => {
      engineStatus = { status, message };
      renderEngineStatus();
      if (status === "thinking") setThinkingLabel(true);
      if (status === "ready") setThinkingLabel(false);
    },
    onInfo: (info) => {
      engineInfo = info;
      renderEngineStatus();
    },
  });

  const app = document.createElement("div");
  app.className = "chess-app";
  app.innerHTML = `
    <div class="chess-ui is-hidden" data-chess-ui>
      <header class="chess-hud">
        <div class="chess-player-card" data-player-card="w">
          <span class="chess-disc chess-disc--white" aria-hidden="true"></span>
          <div class="chess-player-card__copy">
            <span class="chess-kicker">White</span>
            <strong data-player-name="w">You</strong>
            <small data-player-lost="w">0 captured</small>
          </div>
        </div>
        <div class="chess-versus">vs</div>
        <div class="chess-player-card" data-player-card="b">
          <span class="chess-disc chess-disc--black" aria-hidden="true"></span>
          <div class="chess-player-card__copy">
            <span class="chess-kicker">Black</span>
            <strong data-player-name="b">Stockfish</strong>
            <small data-player-lost="b">0 captured</small>
          </div>
        </div>
        <div class="chess-turn-panel">
          <span class="chess-kicker" data-mode-label>Computer / Medium</span>
          <strong data-turn-label>White to move</strong>
          <span class="chess-engine-status" data-engine-status>Stockfish on standby</span>
        </div>
        <div class="chess-top-actions">
          <div class="chess-bg-switch" role="group" aria-label="Environment">
            <button class="chess-chip" type="button" data-bg="study" aria-pressed="true">Study</button>
            <button class="chess-chip" type="button" data-bg="forest" aria-pressed="false">Forest</button>
            <button class="chess-chip" type="button" data-bg="royal" aria-pressed="false">Royal</button>
          </div>
          <button class="chess-icon-button" type="button" data-sound aria-pressed="true" aria-label="Mute sound">${SPEAKER_SVG}</button>
          <button class="chess-icon-button" type="button" data-flip aria-label="Flip camera">${icon("restart")}</button>
          <button class="chess-icon-button" type="button" data-camera aria-label="Reset camera">${icon("grid")}</button>
          <button class="chess-icon-button" type="button" data-history aria-label="Open move history">${icon("menu")}</button>
        </div>
      </header>

      <div class="chess-bottom">
        <div class="chess-captured-row">
          <span class="chess-kicker">White lost</span>
          <span class="chess-captured-list" data-captured-lost="w">None</span>
        </div>
        <div class="chess-captured-row">
          <span class="chess-kicker">Black lost</span>
          <span class="chess-captured-list" data-captured-lost="b">None</span>
        </div>
        <div class="chess-actions">
          <button class="chess-action" type="button" data-new-game>${icon("restart")}<span>New game</span></button>
          <button class="chess-action" type="button" data-restart>${icon("play")}<span>Restart</span></button>
          <button class="chess-action" type="button" data-undo>${icon("arrowLeft")}<span>Undo</span></button>
          <button class="chess-action chess-action--danger" type="button" data-resign>${icon("close")}<span>Resign</span></button>
        </div>
      </div>

      <div class="chess-drawer-scrim" data-drawer-scrim aria-hidden="true"></div>
      <aside class="chess-drawer" data-drawer aria-label="Move history" aria-hidden="true">
        <div class="chess-drawer__head">
          <div>
            <p class="chess-kicker">Match record</p>
            <h2>Move history</h2>
          </div>
          <button class="chess-icon-button chess-drawer__close" type="button" data-drawer-close aria-label="Close move history"><span>Close</span>${icon("close")}</button>
        </div>
        <div class="chess-drawer__body">
          <section>
            <p class="chess-kicker">Moves</p>
            <ol class="chess-history" data-history-list></ol>
          </section>
          <section>
            <p class="chess-kicker">Captured wood</p>
            <div class="chess-captured-detail" data-captured-detail></div>
          </section>
        </div>
      </aside>

      <div class="chess-toast" data-toast role="status" aria-live="polite"></div>
    </div>

    <div class="chess-start" data-start>
      <div class="chess-start__scrim" aria-hidden="true"></div>
      <div class="chess-start__panel">
        <p class="chess-kicker">Robloxsplay original / 3D chess</p>
        <h1>Royal Wood <span>3D Chess</span></h1>
        <p class="chess-start__intro">A carved maple and walnut set, lit as a photographed object. Choose an opponent, a side and a room, then take the board.</p>
        <div class="chess-start__grid">
          <div class="chess-start__field">
            <span class="chess-label">Opponent</span>
            <div class="chess-segmented" role="group" aria-label="Opponent">
              <button class="chess-segment is-active" type="button" data-start-mode="computer" aria-pressed="true">Computer</button>
              <button class="chess-segment" type="button" data-start-mode="local" aria-pressed="false">Two players</button>
            </div>
          </div>
          <div class="chess-start__field" data-side-field>
            <span class="chess-label">Your side</span>
            <div class="chess-segmented" role="group" aria-label="Your side">
              <button class="chess-segment is-active" type="button" data-start-side="w" aria-pressed="true">White</button>
              <button class="chess-segment" type="button" data-start-side="b" aria-pressed="false">Black</button>
            </div>
          </div>
          <div class="chess-start__field" data-difficulty-field>
            <span class="chess-label">Difficulty</span>
            <div class="chess-segmented chess-segmented--three" role="group" aria-label="Difficulty">
              <button class="chess-segment" type="button" data-start-difficulty="easy" aria-pressed="false">Easy</button>
              <button class="chess-segment is-active" type="button" data-start-difficulty="medium" aria-pressed="true">Medium</button>
              <button class="chess-segment" type="button" data-start-difficulty="hard" aria-pressed="false">Hard</button>
            </div>
          </div>
        </div>
        <div class="chess-start__field">
          <span class="chess-label">Room</span>
          <div class="chess-start__rooms">
            <button class="chess-room is-active" type="button" data-start-bg="study" aria-pressed="true"><span class="chess-room__swatch chess-room__swatch--study"></span><strong>Wooden Study</strong><small>Warm books and lamplight</small></button>
            <button class="chess-room" type="button" data-start-bg="forest" aria-pressed="false"><span class="chess-room__swatch chess-room__swatch--forest"></span><strong>Forest Nature</strong><small>Daylight and green quiet</small></button>
            <button class="chess-room" type="button" data-start-bg="royal" aria-pressed="false"><span class="chess-room__swatch chess-room__swatch--royal"></span><strong>Dark Royal Room</strong><small>Gold, walnut and shadow</small></button>
          </div>
        </div>
        <div class="chess-start__footer">
          <p class="chess-start__status" data-start-status>Preparing the set</p>
          <button class="button chess-start__begin" type="button" data-start-begin disabled>Begin game ${icon("arrow")}</button>
          <a class="chess-start__all" href="/all-games.html">All games ${icon("arrow")}</a>
        </div>
        <p class="chess-credit">Stockfish 10 is used under GPL-3.0. Engine source and licence are recorded in THIRD_PARTY_LICENSES.md.</p>
      </div>
    </div>

    <div class="chess-modal chess-promotion" data-promotion hidden>
      <div class="chess-modal__scrim"></div>
      <div class="chess-modal__panel" role="dialog" aria-modal="true" aria-labelledby="chess-promotion-title">
        <p class="chess-kicker">Pawn reaches the last rank</p>
        <h2 id="chess-promotion-title">Promote your pawn.</h2>
        <p>Choose the piece that will carry the line.</p>
        <div class="chess-promotion__options">
          <button type="button" data-promote="q"><span class="chess-promo-mark">Q</span><strong>Queen</strong><small>Power</small></button>
          <button type="button" data-promote="r"><span class="chess-promo-mark">R</span><strong>Rook</strong><small>Structure</small></button>
          <button type="button" data-promote="b"><span class="chess-promo-mark">B</span><strong>Bishop</strong><small>Angle</small></button>
          <button type="button" data-promote="n"><span class="chess-promo-mark">N</span><strong>Knight</strong><small>Surprise</small></button>
        </div>
      </div>
    </div>

    <div class="chess-modal chess-result" data-result hidden>
      <div class="chess-modal__scrim"></div>
      <div class="chess-modal__panel" role="dialog" aria-modal="true" aria-labelledby="chess-result-title">
        <div class="chess-result__crest">${CROWN_SVG}</div>
        <p class="chess-kicker" data-result-kicker>Checkmate</p>
        <h2 id="chess-result-title" data-result-title>White wins</h2>
        <p data-result-text>The king has no square.</p>
        <div class="chess-result__actions">
          <button class="button" type="button" data-rematch>Rematch ${icon("restart")}</button>
          <button class="button button--ghost" type="button" data-result-new>New game</button>
          <a class="button button--ghost" href="/index.html">Home</a>
        </div>
      </div>
    </div>

    <div class="chess-modal chess-confirm" data-confirm hidden>
      <div class="chess-modal__scrim"></div>
      <div class="chess-modal__panel" role="dialog" aria-modal="true" aria-labelledby="chess-confirm-title">
        <p class="chess-kicker">End the game</p>
        <h2 id="chess-confirm-title">Resign this game?</h2>
        <p>The current position will be recorded as a loss. You can start again from the table.</p>
        <div class="chess-result__actions">
          <button class="button" type="button" data-confirm-resign>Resign</button>
          <button class="button button--ghost" type="button" data-confirm-cancel>Keep playing</button>
        </div>
      </div>
    </div>
  `;
  shell.stage.insertBefore(app, shell.overlay);
  shell.hideOverlay();

  const ui = app.querySelector("[data-chess-ui]");
  const start = app.querySelector("[data-start]");
  const startStatus = app.querySelector("[data-start-status]");
  const startBegin = app.querySelector("[data-start-begin]");
  const sideField = app.querySelector("[data-side-field]");
  const difficultyField = app.querySelector("[data-difficulty-field]");
  const turnLabel = app.querySelector("[data-turn-label]");
  const modeLabel = app.querySelector("[data-mode-label]");
  const engineStatusEl = app.querySelector("[data-engine-status]");
  const nameEls = {
    w: app.querySelector('[data-player-name="w"]'),
    b: app.querySelector('[data-player-name="b"]'),
  };
  const playerCards = {
    w: app.querySelector('[data-player-card="w"]'),
    b: app.querySelector('[data-player-card="b"]'),
  };
  const lostEls = {
    w: app.querySelector("[data-player-lost='w']"),
    b: app.querySelector("[data-player-lost='b']"),
  };
  const capturedEls = {
    w: app.querySelector('[data-captured-lost="w"]'),
    b: app.querySelector('[data-captured-lost="b"]'),
  };
  const historyList = app.querySelector("[data-history-list]");
  const capturedDetail = app.querySelector("[data-captured-detail]");
  const drawer = app.querySelector("[data-drawer]");
  const drawerScrim = app.querySelector("[data-drawer-scrim]");
  const toastEl = app.querySelector("[data-toast]");
  const promotionModal = app.querySelector("[data-promotion]");
  const resultModal = app.querySelector("[data-result]");
  const confirmModal = app.querySelector("[data-confirm]");
  const resultKicker = app.querySelector("[data-result-kicker]");
  const resultTitle = app.querySelector("[data-result-title]");
  const resultText = app.querySelector("[data-result-text]");
  const soundButton = app.querySelector("[data-sound]");

  let pieceRoot = null;
  let highlightsRoot = null;
  let markersRoot = null;
  let board = null;
  let materials = null;
  let environments = null;
  let pieceGroups = new Map();
  let piecePickables = [];
  let selectedSquare = "";
  let legalMoves = [];
  let lastMove = null;
  let pendingPromotion = null;
  let busy = false;
  let gameStarted = false;
  let gameOver = false;
  let resigned = false;
  let humanColor = settings.side;
  let mode = settings.mode;
  let difficulty = settings.difficulty;
  let background = settings.background;
  let aiThinking = false;
  let aiToken = 0;
  let engineInfo = null;
  let engineStatus = { status: "idle", message: "Stockfish on standby" };
  let resultInfo = null;
  let loadReady = false;
  let startSelectionReady = false;
  let beginPending = false;
  let colorUpdateToken = 0;
  let cameraSpin = null;
  let toastTimer = 0;
  let drag = null;
  let pendingClickMove = null;
  let hoverSquare = "";
  let destroyed = false;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const boardPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.1);
  const clock = stage.clock;

  function persistSettings() {
    storageSet(SETTINGS_KEY, {
      mode,
      side: humanColor,
      difficulty,
      background,
    });
  }

  function setStartStatus(message) {
    if (startStatus) startStatus.textContent = message;
  }

  function setThinkingLabel(thinking) {
    aiThinking = thinking;
    ui.classList.toggle("is-thinking", thinking);
    if (thinking) turnLabel.textContent = "Stockfish is calculating";
    else if (gameStarted) updateTurn();
  }

  function renderEngineStatus() {
    if (!engineStatusEl) return;
    engineStatusEl.textContent = engineInfo?.depth
      ? `Stockfish Â· depth ${engineInfo.depth}`
      : engineStatus.message;
    engineStatusEl.dataset.state = engineStatus.status;
  }

  function showToast(message) {
    if (!toastEl) return;
    window.clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    toastTimer = window.setTimeout(() => toastEl.classList.remove("is-visible"), 2600);
  }

  function playerName(color) {
    if (mode === "local") return color === "w" ? "White" : "Black";
    return color === humanColor ? "You" : "Stockfish";
  }

  function turnName() {
    const turn = game.turn();
    return playerName(turn);
  }

  function updateNames() {
    nameEls.w.textContent = playerName("w");
    nameEls.b.textContent = playerName("b");
    modeLabel.textContent =
      mode === "local"
        ? "Local two-player"
        : `Computer / ${difficulty === "hard" ? "Hard" : difficulty === "easy" ? "Easy" : "Medium"}`;
    renderEngineStatus();
    app.querySelectorAll("[data-player-card]").forEach((card) => {
      const color = card.dataset.playerCard;
      const isTurn = !gameOver && game.turn() === color;
      card.classList.toggle("is-active", isTurn);
      card.classList.toggle("is-human", mode === "local" || color === humanColor);
    });
  }

  function updatePromotionModal() {
    const open = Boolean(pendingPromotion);
    promotionModal.hidden = !open;
    if (open) {
      app.querySelector("[data-promotion] [data-promote='q']")?.focus({ preventScroll: true });
    }
  }

  function updateStatus() {
    if (!gameStarted) {
      turnLabel.textContent = "Ready to play";
      return;
    }
    if (gameOver && resultInfo) {
      turnLabel.textContent =
        resultInfo.winner === "draw"
          ? "Draw"
          : `${playerName(resultInfo.winner)} wins`;
      return;
    }
    if (aiThinking) {
      turnLabel.textContent = "Stockfish is calculating";
      return;
    }
    const inCheck = game.inCheck();
    turnLabel.textContent = inCheck
      ? `${turnName()} in check`
      : `${turnName()} to move`;
  }

  function updateTurn() {
    updateNames();
    ui.classList.toggle("is-thinking", aiThinking);
    updateStatus();
    const turn = game.turn();
    const activeColor = gameOver && resultInfo?.winner !== "draw" ? resultInfo.winner : turn;
    playerCards.w.classList.toggle("is-active", activeColor === "w" && !gameOver);
    playerCards.b.classList.toggle("is-active", activeColor === "b" && !gameOver);
    if (gameOver) {
      playerCards.w.classList.remove("is-active");
      playerCards.b.classList.remove("is-active");
    }
    shell.setStatus(
      gameOver && resultInfo
        ? resultInfo.winner === "draw"
          ? "Draw"
          : `${resultInfo.winner === "w" ? "White" : "Black"} wins`
        : aiThinking
          ? "Computer thinking"
          : `${turnName()} to move`,
      "playing",
    );
  }

  function updateCaptured() {
    const verbose = game.history({ verbose: true });
    const lost = { w: [], b: [] };
    for (const move of verbose) {
      if (!move.captured) continue;
      const victim = move.color === "w" ? "b" : "w";
      lost[victim].push(move.captured);
    }
    for (const color of ["w", "b"]) {
      const counts = lost[color].reduce((acc, type) => {
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});
      const text = Object.entries(counts)
        .map(([type, count]) => `${pieceAbbrev(type)}${count > 1 ? ` x${count}` : ""}`)
        .join("  ");
      lostEls[color].textContent = lost[color].length ? `${lost[color].length} captured` : "0 captured";
      capturedEls[color].textContent = text || "None";
      if (capturedDetail) {
        capturedDetail.innerHTML = ["w", "b"]
          .map(
            (side) =>
              `<div><span>${side === "w" ? "White lost" : "Black lost"}</span><strong>${escapeHTML(
                Object.entries(lost[side].reduce((acc, type) => { acc[type] = (acc[type] || 0) + 1; return acc; }, {}))
                  .map(([type, count]) => `${pieceAbbrev(type)}${count > 1 ? ` x${count}` : ""}`)
                  .join("  ") || "None",
              )}</strong></div>`,
          )
          .join("");
      }
    }
  }

  function escapeHTML(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function renderHistory() {
    const verbose = game.history({ verbose: true });
    if (!verbose.length) {
      historyList.innerHTML = '<li class="chess-history__empty">No moves yet. The board is waiting.</li>';
      return;
    }
    const rows = [];
    for (let i = 0; i < verbose.length; i += 2) {
      const number = i / 2 + 1;
      rows.push(
        `<li><span class="chess-history__number">${number}.</span><span class="chess-history__move${i === verbose.length - 1 ? " is-last" : ""}">${escapeHTML(
          verbose[i].san,
        )}</span><span class="chess-history__move${i + 1 === verbose.length - 1 ? " is-last" : ""}">${escapeHTML(
          verbose[i + 1]?.san || "",
        )}</span></li>`,
      );
    }
    historyList.innerHTML = rows.join("");
    historyList.querySelector(".is-last")?.scrollIntoView({ block: "nearest" });
  }

  function buildArrow(row, col) {
    return `${"abcdefgh"[col]}${8 - row}`;
  }

  function renderCapturedAndHistory() {
    updateCaptured();
    renderHistory();
  }

  function updateDrawerState(open) {
    drawer.classList.toggle("is-open", open);
    drawerScrim.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    app.querySelector("[data-history]")?.setAttribute("aria-expanded", String(open));
  }

  function boardSquareFromEvent(event) {
    const rect = shell.canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    scene.updateMatrixWorld(true);
    const pieces = raycaster.intersectObjects(piecePickables, true);
    if (pieces.length) {
      const root = pieces[0].object.userData.pieceRoot;
      if (root) return { type: "piece", root, square: root.userData.square };
    }
    if (!board) return null;
    const squares = raycaster.intersectObjects([...board.squares.values()], false);
    if (squares.length) return { type: "square", square: squares[0].object.userData.square };
    return null;
  }

  function pointerOnBoard(event) {
    const rect = shell.canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const point = new THREE.Vector3();
    if (!raycaster.ray.intersectPlane(boardPlane, point)) return null;
    return worldToSquare(point.x, point.z);
  }

  function clearMarkers() {
    if (!markersRoot) return;
    while (markersRoot.children.length) {
      const child = markersRoot.children.pop();
      markersRoot.remove(child);
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    }
  }

  function squareCenter(square) {
    const pos = squareToWorld(square);
    return new THREE.Vector3(pos.x, board.topY + 0.015, pos.z);
  }

  function updateHighlights() {
    if (!highlightsRoot) return;
    while (highlightsRoot.children.length) {
      const child = highlightsRoot.children.pop();
      highlightsRoot.remove(child);
      child.geometry?.dispose?.();
      child.material?.dispose?.();
    }
    const addPlane = (square, color, opacity) => {
      const center = squareCenter(square);
      const geometry = new THREE.PlaneGeometry(0.94, 0.94);
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const plane = new THREE.Mesh(geometry, material);
      plane.rotation.x = -Math.PI / 2;
      plane.position.set(center.x, board.topY + 0.018, center.z);
      plane.renderOrder = 2;
      highlightsRoot.add(plane);
    };
    if (lastMove) {
      addPlane(lastMove.from, "#d5aa64", 0.14);
      addPlane(lastMove.to, "#f1c875", 0.19);
    }
    if (selectedSquare) addPlane(selectedSquare, "#63d8ff", 0.22);
    if (hoverSquare && !selectedSquare && !gameOver && canHumanInteract()) {
      addPlane(hoverSquare, "#f3d39b", 0.08);
    }
    if (gameStarted && !gameOver && game.inCheck()) {
      const king = findKingSquare(game.turn());
      if (king) addPlane(king, "#ff6557", 0.28);
    }
  }

  function findKingSquare(color) {
    const rows = game.board();
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const piece = rows[row][col];
        if (piece && piece.type === "k" && piece.color === color) {
          return `${"abcdefgh"[col]}${8 - row}`;
        }
      }
    }
    return null;
  }

  function showLegalMarkers() {
    clearMarkers();
    if (!selectedSquare) return;
    const seen = new Set();
    for (const move of legalMoves) {
      if (seen.has(move.to)) continue;
      seen.add(move.to);
      const center = squareCenter(move.to);
      const capture = Boolean(move.captured || move.flags.includes("e"));
      const geometry = capture
        ? new THREE.RingGeometry(0.34, 0.42, 24)
        : new THREE.CircleGeometry(0.12, 24);
      const material = new THREE.MeshBasicMaterial({
        color: capture ? "#ffb37a" : "#f0cb7d",
        transparent: true,
        opacity: capture ? 0.85 : 0.58,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const marker = new THREE.Mesh(geometry, material);
      marker.rotation.x = -Math.PI / 2;
      marker.position.set(center.x, board.topY + 0.016, center.z);
      marker.renderOrder = 3;
      markersRoot.add(marker);
    }
  }

  function canHumanInteract() {
    if (!gameStarted || gameOver || busy || aiThinking || pendingPromotion) return false;
    return mode === "local" || game.turn() === humanColor;
  }

  function selectSquare(square) {
    if (!canHumanInteract()) return;
    const piece = game.get(square);
    if (!piece || piece.color !== game.turn()) {
      clearSelection();
      return;
    }
    if (selectedSquare === square) {
      clearSelection();
      return;
    }
    selectedSquare = square;
    legalMoves = game.moves({ square, verbose: true });
    showLegalMarkers();
    updateHighlights();
  }

  function clearSelection() {
    selectedSquare = "";
    legalMoves = [];
    clearMarkers();
    updateHighlights();
  }

  function pieceFor(square) {
    return pieceGroups.get(square) || null;
  }

  function animatePieceRoot(root, target, duration = 0.36, lift = 0.46) {
    return new Promise((resolve) => {
      if (!root) {
        resolve();
        return;
      }
      if (reducedMotion || duration <= 0) {
        root.position.set(target.x, board.topY, target.z);
        resolve();
        return;
      }
      const from = root.position.clone();
      const started = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - started) / (duration * 1000));
        const eased = easeInOut(t);
        root.position.x = from.x + (target.x - from.x) * eased;
        root.position.z = from.z + (target.z - from.z) * eased;
        root.position.y = board.topY + Math.sin(Math.PI * t) * lift;
        if (t < 1) requestAnimationFrame(step);
        else {
          root.position.set(target.x, board.topY, target.z);
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  function animateCaptured(root) {
    return new Promise((resolve) => {
      if (!root) {
        resolve();
        return;
      }
      if (reducedMotion) {
        resolve();
        return;
      }
      const fromScale = root.scale.x;
      const started = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - started) / 330);
        root.scale.setScalar(fromScale * (1 - t * 0.72));
        root.position.y = board.topY - t * 0.32;
        if (t < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
  }

  function addPieceAt(square, type, color) {
    const root = createPiece(type, color, materials);
    const pos = squareToWorld(square);
    root.position.set(pos.x, board.topY, pos.z);
    root.userData.square = square;
    root.traverse((object) => {
      if (object.isMesh) {
        object.userData.pieceRoot = root;
        if (piecePickables.indexOf(root) === -1 && object.parent === root) piecePickables.push(root);
      }
    });
    pieceRoot.add(root);
    pieceGroups.set(square, root);
    return root;
  }

  function rebuildPieces() {
    if (!pieceRoot) return;
    for (const child of [...pieceRoot.children]) pieceRoot.remove(child);
    pieceGroups.clear();
    piecePickables = [];
    const rows = game.board();
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const piece = rows[row][col];
        if (!piece) continue;
        addPieceAt(`${"abcdefgh"[col]}${8 - row}`, piece.type, piece.color);
      }
    }
    clearSelection();
    updateHighlights();
    scene.updateMatrixWorld(true);
  }

  function capturedGroupFor(result) {
    if (!result.captured) return null;
    if (result.flags.includes("e")) {
      const file = result.to[0];
      const rank = result.from[1];
      return pieceGroups.get(`${file}${rank}`) || null;
    }
    return pieceGroups.get(result.to) || null;
  }

  function promoteRoot(square, type) {
    const old = pieceGroups.get(square);
    if (old) {
      pieceRoot.remove(old);
      pieceGroups.delete(square);
    }
    const color = game.get(square)?.color || game.turn();
    addPieceAt(square, type, color);
  }

  async function applyMove(move, { ai = false } = {}) {
    if (gameOver) return false;
    let result;
    try {
      result = game.move(move);
    } catch {
      return false;
    }
    if (!result) return false;
    busy = true;
    aiThinking = false;
    pendingPromotion = null;
    updatePromotionModal();
    clearSelection();
    updateTurn();
    updateCaptured();
    renderHistory();
    const capturedRoot = capturedGroupFor(result);
    if (capturedRoot) {
      pieceGroups.delete(result.flags.includes("e") ? `${result.to[0]}${result.from[1]}` : result.to);
    }
    const movingRoot = pieceGroups.get(result.from);
    const movingTarget = squareToWorld(result.to);
    const animations = [];
    if (capturedRoot) {
      animations.push(animateCaptured(capturedRoot).then(() => capturedRoot.removeFromParent()));
    }
    if (movingRoot) {
      pieceGroups.delete(result.from);
      pieceGroups.set(result.to, movingRoot);
      movingRoot.userData.square = result.to;
      animations.push(animatePieceRoot(movingRoot, movingTarget, reducedMotion ? 0 : 0.34, 0.42));
    }
    if (result.flags.includes("k") || result.flags.includes("q")) {
      const rank = result.color === "w" ? "1" : "8";
      const rookFrom = result.flags.includes("k") ? `h${rank}` : `a${rank}`;
      const rookTo = result.flags.includes("k") ? `f${rank}` : `d${rank}`;
      const rook = pieceGroups.get(rookFrom);
      if (rook) {
        pieceGroups.delete(rookFrom);
        pieceGroups.set(rookTo, rook);
        rook.userData.square = rookTo;
        animations.push(animatePieceRoot(rook, squareToWorld(rookTo), reducedMotion ? 0 : 0.34, 0.28));
      }
    }
    await Promise.all(animations);
    if (result.promotion) promoteRoot(result.to, result.promotion);
    lastMove = { from: result.from, to: result.to };
    busy = false;
    updateTurn();
    updateCaptured();
    renderHistory();
    updateHighlights();
    if (game.inCheck() && !game.isGameOver()) audio.check();
    const ended = checkGameEnd();
    if (!ended && mode === "computer" && game.turn() === other(humanColor)) {
      requestAiMove();
    }
    if (!ended && mode === "local") {
      // Keep the board interactive for the next player.
    }
    return true;
  }

  function other(color) {
    return color === "w" ? "b" : "w";
  }

  function checkGameEnd() {
    if (game.isCheckmate()) {
      finishGame(other(game.turn()), "Checkmate");
      return true;
    }
    if (game.isStalemate()) {
      finishGame("draw", "Stalemate");
      return true;
    }
    if (game.isInsufficientMaterial()) {
      finishGame("draw", "Insufficient material");
      return true;
    }
    if (game.isThreefoldRepetition()) {
      finishGame("draw", "Threefold repetition");
      return true;
    }
    if (game.isDrawByFiftyMoves()) {
      finishGame("draw", "Fifty-move rule");
      return true;
    }
    if (game.isDraw()) {
      finishGame("draw", "Draw");
      return true;
    }
    return false;
  }

  function finishGame(winner, reason) {
    if (winner === "draw") audio.draw();
    else if (mode === "computer") {
      if (winner === humanColor) audio.win();
      else audio.lose();
    } else {
      audio.win();
    }
    gameOver = true;
    aiThinking = false;
    aiToken += 1;
    engine.stop();
    resultInfo = { winner, reason, resigned };
    updateTurn();
    updateCaptured();
    renderHistory();
    updateHighlights();
    shell.setStatus(
      winner === "draw" ? "Draw" : `${winner === "w" ? "White" : "Black"} wins`,
      "paused",
    );
    showResult();
  }

  function resultTitleText() {
    if (resultInfo.winner === "draw") return "Draw";
    if (mode === "computer") return resultInfo.winner === humanColor ? "You win" : "Stockfish wins";
    return resultInfo.winner === "w" ? "White wins" : "Black wins";
  }

  function resultReasonText() {
    const reason = resultInfo.reason;
    if (reason === "Resignation") return "The board is conceded. The result is recorded.";
    if (reason === "Checkmate") return "The king has no legal escape. The line is complete.";
    if (reason === "Stalemate") return "No legal move, but no check. The game is drawn.";
    if (reason === "Threefold repetition") return "The same position arrived three times. The game is drawn.";
    if (reason === "Fifty-move rule") return "Fifty moves without a pawn move or capture. The game is drawn.";
    if (reason === "Insufficient material") return "Neither side has the material to force mate. The game is drawn.";
    return "The game is over. Set the table for another line.";
  }

  function showResult() {
    if (!resultInfo) return;
    resultKicker.textContent = resultInfo.reason;
    resultTitle.textContent = resultTitleText();
    resultText.textContent = resultReasonText();
    resultModal.hidden = false;
    ui.inert = true;
    requestAnimationFrame(() => {
      resultModal.classList.add("is-open");
      resultModal.querySelector("[data-rematch]")?.focus({ preventScroll: true });
    });
    shell.announce(`${resultTitleText()}. ${resultReasonText()}`);
  }

  function hideResult() {
    resultModal.classList.remove("is-open");
    resultModal.hidden = true;
    ui.inert = false;
  }

  function setPromotion(from, to) {
    pendingPromotion = { from, to };
    updatePromotionModal();
    clearSelection();
    updateHighlights();
  }

  function choosePromotion(type) {
    if (!pendingPromotion) return;
    const { from, to } = pendingPromotion;
    pendingPromotion = null;
    updatePromotionModal();
    audio.click();
    applyMove({ from, to, promotion: type });
  }

  function makeHumanMove(from, to) {
    if (!canHumanInteract()) return false;
    const candidates = game.moves({ square: from, verbose: true }).filter((move) => move.to === to);
    if (!candidates.length) {
      clearSelection();
      return false;
    }
    if (candidates[0].promotion) {
      setPromotion(from, to);
      return true;
    }
    clearSelection();
    return applyMove({ from, to });
  }

  async function requestAiMove() {
    if (mode !== "computer" || gameOver || !gameStarted || game.turn() === humanColor) return;
    const token = ++aiToken;
    aiThinking = true;
    setThinkingLabel(true);
    updateTurn();
    const aiColor = other(humanColor);
    void aiColor;
    try {
      await engine.ensure();
      if (token !== aiToken || gameOver) return;
      const uci = await engine.bestMove(game.fen(), difficulty);
      if (token !== aiToken || gameOver) return;
      const from = uci.slice(0, 2);
      const to = uci.slice(2, 4);
      const promotion = uci.length > 4 ? uci[4] : undefined;
      const legal = game.moves({ verbose: true }).some(
        (move) => move.from === from && move.to === to && (!promotion || move.promotion === promotion),
      );
      if (!legal) throw new Error("Engine returned an illegal move.");
      aiThinking = false;
      setThinkingLabel(false);
      await applyMove({ from, to, promotion });
    } catch (error) {
      if (token !== aiToken || gameOver) return;
      aiThinking = false;
      setThinkingLabel(false);
      const moves = game.moves({ verbose: true });
      if (moves.length) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        showToast("Engine unavailable. Club opponent moved.");
        await applyMove({ from: move.from, to: move.to, promotion: move.promotion });
      } else {
        showToast("The engine could not move. Start a new game.");
        updateTurn();
      }
      console.warn("Chess engine move failed:", error);
    }
  }

  function rebuildFromGame({ keepStart = false } = {}) {
    gameOver = false;
    resigned = false;
    resultInfo = null;
    busy = false;
    aiThinking = false;
    pendingPromotion = null;
    aiToken += 1;
    engine.stop();
    hideResult();
    confirmModal.hidden = true;
    updatePromotionModal();
    rebuildPieces();
    lastMove = null;
    updateHighlights();
    updateTurn();
    updateCaptured();
    renderHistory();
    if (!keepStart) start.classList.add("is-hidden");
  }

  async function beginGame() {
    if (!loadReady || beginPending) return;
    mode = settings.mode;
    humanColor = settings.side;
    difficulty = settings.difficulty;
    background = settings.background;
    if (mode === "computer" && !engine.ready) {
      beginPending = true;
      syncStartUI();
      setStartStatus("Preparing Stockfish...");
      renderer.setAnimationLoop(null);
      try {
        await engine.ensure();
        setStartStatus("Engine ready. Set the table.");
      } catch (error) {
        console.warn("Stockfish could not start; using the club fallback.", error);
        setStartStatus("Engine unavailable. Club fallback ready.");
        showToast("Stockfish unavailable. Club fallback will move.");
      }
      beginPending = false;
      if (destroyed) return;
      renderer.setAnimationLoop(animate);
      startBegin.disabled = false;
    }
    persistSettings();
    gameStarted = true;
    resigned = false;
    gameOver = false;
    resultInfo = null;
    game.reset();
    updateDrawerState(false);
    rebuildFromGame();
    start.classList.add("is-hidden");
    ui.classList.remove("is-hidden");
    controls.autoRotate = false;
    controls.enabled = true;
    setView(humanColor);
    audio.ensure();
    audio.click();
    engine.newGame();
    setStartStatus("Ready");
    shell.setStatus("White to move", "playing");
    shell.announce("Royal Wood 3D Chess started. White to move.");
    if (mode === "computer") {
      engine.ensure().catch(() => {});
      if (game.turn() !== humanColor) requestAiMove();
    }
  }

  function restartGame() {
    if (!loadReady) return;
    mode = settings.mode;
    humanColor = settings.side;
    difficulty = settings.difficulty;
    background = settings.background;
    gameStarted = true;
    game.reset();
    updateDrawerState(false);
    rebuildFromGame();
    start.classList.add("is-hidden");
    ui.classList.remove("is-hidden");
    controls.autoRotate = false;
    controls.enabled = true;
    setView(humanColor);
    audio.click();
    engine.newGame();
    shell.setStatus("White to move", "playing");
    if (mode === "computer" && game.turn() !== humanColor) requestAiMove();
  }

  function openNewGame() {
    aiToken += 1;
    engine.stop();
    gameStarted = false;
    gameOver = false;
    resultInfo = null;
    hideResult();
    confirmModal.hidden = true;
    pendingPromotion = null;
    updateDrawerState(false);
    updatePromotionModal();
    start.classList.remove("is-hidden");
    ui.classList.add("is-hidden");
    controls.autoRotate = true;
    controls.enabled = true;
    game.reset();
    rebuildFromGame({ keepStart: true });
    startSelectionReady = false;
    syncStartUI();
    setStartStatus(loadReady ? "Choose a table" : "Preparing the set");
  }

  function undoMove() {
    if (busy || pendingPromotion) return;
    aiToken += 1;
    engine.stop();
    aiThinking = false;
    hideResult();
    gameOver = false;
    resigned = false;
    resultInfo = null;
    const verbose = game.history({ verbose: true });
    if (!verbose.length) {
      showToast("There is no move to take back.");
      return;
    }
    if (mode === "computer") {
      if (!verbose.some((move) => move.color === humanColor)) {
        showToast("Wait for your first move before undoing.");
        return;
      }
      let plies = 0;
      for (let index = verbose.length - 1; index >= 0; index -= 1) {
        plies += 1;
        game.undo();
        if (verbose[index].color === humanColor) break;
      }
      void plies;
    } else {
      game.undo();
    }
    rebuildFromGame();
    audio.click();
    shell.setStatus("Move taken back", "playing");
    showToast("Move undone.");
  }

  function resignGame() {
    if (!gameStarted || gameOver) return;
    if (confirmModal.hidden) {
      confirmModal.hidden = false;
      requestAnimationFrame(() => confirmModal.querySelector("[data-confirm-resign]")?.focus());
      return;
    }
    confirmModal.hidden = true;
    resigned = true;
    const loser = game.turn();
    finishGame(other(loser), "Resignation");
  }

  function spinCamera(angle, duration = 560) {
    if (reducedMotion || duration <= 0) {
      controls.rotateLeft(angle);
      controls.update();
      return;
    }
    cameraSpin = {
      angle: Math.abs(angle),
      sign: Math.sign(angle),
      duration: duration / 1000,
      start: performance.now(),
      progress: 0,
    };
    const spin = cameraSpin;
    window.setTimeout(() => {
      if (cameraSpin !== spin) return;
      const remaining = (1 - spin.progress) * spin.angle;
      if (remaining > 0.0001) controls.rotateLeft(remaining * spin.sign);
      cameraSpin = null;
    }, duration + 30);
    audio.click();
  }

  function setView(color) {
    cameraSpin = null;
    camera.position.set(0, 8.45, color === "b" ? -10.8 : 10.8);
    controls.target.set(0, 0.25, 0);
    camera.lookAt(0, 0.25, 0);
    controls.update();
  }

  function flipCamera() {
    cameraSpin = null;
    const z = camera.position.z >= 0 ? -10.8 : 10.8;
    camera.position.set(0, 8.45, z);
    camera.lookAt(0, 0.25, 0);
    controls.update();
    audio.click();
  }

  function resetCamera() {
    setView(mode === "computer" ? humanColor : "w");
    audio.click();
  }

  function applyBackground(next) {
    if (!environments || !BACKDROP_LABELS[next]) return;
    background = next;
    settings.background = next;
    persistSettings();
    environments.applyTheme(next);
    app.querySelectorAll("[data-bg]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.bg === next);
      button.setAttribute("aria-pressed", String(button.dataset.bg === next));
    });
    app.querySelectorAll("[data-start-bg]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.startBg === next);
      button.setAttribute("aria-pressed", String(button.dataset.startBg === next));
    });
    audio.click();
    showToast(`${BACKDROP_LABELS[next]} lit.`);
  }

  function syncStartUI() {
    app.querySelectorAll("[data-start-mode]").forEach((button) => {
      const active = button.dataset.startMode === settings.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    app.querySelectorAll("[data-start-side]").forEach((button) => {
      const active = button.dataset.startSide === settings.side;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    app.querySelectorAll("[data-start-difficulty]").forEach((button) => {
      const active = button.dataset.startDifficulty === settings.difficulty;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    app.querySelectorAll("[data-start-bg]").forEach((button) => {
      const active = button.dataset.startBg === settings.background;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    sideField.classList.toggle("is-hidden", settings.mode !== "computer");
    difficultyField.classList.toggle("is-hidden", settings.mode !== "computer");
    startBegin.disabled = !loadReady || beginPending;
    startBegin.innerHTML = loadReady ? (beginPending ? "Preparing Stockfish" : `Begin game ${icon("arrow")}`) : "Preparing set";
  }

  function setBackground(next) {
    applyBackground(next);
  }

  function onStartChoice(event) {
    const modeButton = event.target.closest("[data-start-mode]");
    if (modeButton) {
      settings.mode = modeButton.dataset.startMode;
      syncStartUI();
      persistSettings();
      return;
    }
    const sideButton = event.target.closest("[data-start-side]");
    if (sideButton) {
      settings.side = sideButton.dataset.startSide;
      syncStartUI();
      persistSettings();
      return;
    }
    const difficultyButton = event.target.closest("[data-start-difficulty]");
    if (difficultyButton) {
      settings.difficulty = difficultyButton.dataset.startDifficulty;
      syncStartUI();
      persistSettings();
      return;
    }
    const bgButton = event.target.closest("[data-start-bg]");
    if (bgButton) {
      settings.background = bgButton.dataset.startBg;
      applyBackground(settings.background);
      syncStartUI();
    }
  }

  function handleUiClick(event) {
    if (event.target.closest("[data-bg]")) {
      applyBackground(event.target.closest("[data-bg]").dataset.bg);
      return;
    }
    if (event.target.closest("[data-sound]")) {
      soundOn = !soundOn;
      audio.setEnabled(soundOn);
      storageSet(SOUND_KEY, soundOn);
      soundButton.setAttribute("aria-pressed", String(soundOn));
      soundButton.innerHTML = soundOn ? SPEAKER_SVG : MUTED_SVG;
      soundButton.setAttribute("aria-label", soundOn ? "Mute sound" : "Unmute sound");
      if (soundOn) audio.click();
      return;
    }
    if (event.target.closest("[data-flip]")) {
      flipCamera();
      return;
    }
    if (event.target.closest("[data-camera]")) {
      resetCamera();
      return;
    }
    if (event.target.closest("[data-history]")) {
      updateDrawerState(!drawer.classList.contains("is-open"));
      return;
    }
    if (event.target.closest("[data-drawer-close]")) {
      updateDrawerState(false);
      return;
    }
    if (event.target.closest("[data-drawer-scrim]")) {
      updateDrawerState(false);
      return;
    }
    if (event.target.closest("[data-new-game]")) {
      openNewGame();
      return;
    }
    if (event.target.closest("[data-restart]")) {
      restartGame();
      return;
    }
    if (event.target.closest("[data-undo]")) {
      undoMove();
      return;
    }
    if (event.target.closest("[data-resign]")) {
      resignGame();
      return;
    }
    if (event.target.closest("[data-rematch]")) {
      hideResult();
      restartGame();
      return;
    }
    if (event.target.closest("[data-result-new]")) {
      hideResult();
      openNewGame();
      return;
    }
    if (event.target.closest("[data-confirm-resign]")) {
      resignGame();
      return;
    }
    if (event.target.closest("[data-confirm-cancel]")) {
      confirmModal.hidden = true;
      return;
    }
    const promoteButton = event.target.closest("[data-promote]");
    if (promoteButton) {
      choosePromotion(promoteButton.dataset.promote);
      return;
    }
    if (event.target.closest("[data-start]") && event.target === start) {
      return;
    }
    if (event.target.closest("[data-start-begin]")) {
      beginGame();
    }
  }

  async function loadTextures() {
    const loader = new THREE.TextureLoader();
    const [mapleDiffuse, mapleNormal, mapleRoughness, mapleAO, walnutDiffuse, walnutNormal, walnutRoughness, walnutAO] =
      await Promise.all([
        loadImageTexture(loader, `${WOOD_BASE}/maple_diff_1k.jpg`, true),
        loadImageTexture(loader, `${WOOD_BASE}/maple_nor_1k.jpg`),
        loadImageTexture(loader, `${WOOD_BASE}/maple_rough_1k.jpg`),
        loadImageTexture(loader, `${WOOD_BASE}/maple_ao_1k.jpg`),
        loadImageTexture(loader, `${WOOD_BASE}/walnut_diff_1k.jpg`, true),
        loadImageTexture(loader, `${WOOD_BASE}/walnut_nor_1k.jpg`),
        loadImageTexture(loader, `${WOOD_BASE}/walnut_rough_1k.jpg`),
        loadImageTexture(loader, `${WOOD_BASE}/walnut_ao_1k.jpg`),
      ]);
    return {
      maple: { diffuse: mapleDiffuse, normal: mapleNormal, roughness: mapleRoughness, ao: mapleAO },
      walnut: { diffuse: walnutDiffuse, normal: walnutNormal, roughness: walnutRoughness, ao: walnutAO },
    };
  }

  async function buildWorld() {
    materials = createChessMaterials(await loadTextures());
    board = createChessBoard(materials);
    scene.add(board.group);
    pieceRoot = new THREE.Group();
    pieceRoot.name = "Pieces";
    scene.add(pieceRoot);
    highlightsRoot = new THREE.Group();
    scene.add(highlightsRoot);
    markersRoot = new THREE.Group();
    scene.add(markersRoot);
    environments = createEnvironments(scene, materials, renderer, {
      lowDetail: window.innerWidth < 900,
    });
    environments.applyTheme(background);
    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      const room = new RoomEnvironment();
      const env = pmrem.fromScene(room, 0.04);
      scene.environment = env.texture;
      scene.environmentIntensity = 0.4;
    } catch {
      // Lights still carry the scene if PMREM is unavailable.
    }
    pmrem.dispose();
    rebuildPieces();
    loadReady = true;
    syncStartUI();
    setStartStatus("Choose a table");
    startBegin.focus({ preventScroll: true });
  }

  const controls = new OrbitControls(camera, shell.canvas);
  controls.target.set(0, 0.25, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.enablePan = false;
  controls.minDistance = 8;
  controls.maxDistance = 14;
  controls.minPolarAngle = 0.32;
  controls.maxPolarAngle = 1.3;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.35;
  controls.enabled = true;
  controls.update();

  const uiController = new AbortController();
  const signal = uiController.signal;
  app.addEventListener("click", handleUiClick, { signal });
  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape" && drawer.classList.contains("is-open")) {
        event.preventDefault();
        updateDrawerState(false);
        app.querySelector("[data-history]")?.focus({ preventScroll: true });
      }
    },
    { signal },
  );
  start.addEventListener("click", onStartChoice, { signal });
  app.addEventListener("change", () => {}, { signal });

  // Pointer input is captured before OrbitControls so a piece drag does not rotate the camera.
  shell.canvas.addEventListener(
    "pointerdown",
    (event) => {
      if (!gameStarted || gameOver || busy || aiThinking || pendingPromotion) return;
      if (!canHumanInteract()) return;
      const hit = boardSquareFromEvent(event);
      if (!hit) return;
      if (hit.type === "piece") {
        if (selectedSquare && hit.root.userData.color !== game.turn() && legalMoves.some((move) => move.to === hit.square)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          controls.enabled = false;
          pendingClickMove = { from: selectedSquare, to: hit.square };
          return;
        }
        if (hit.root.userData.color !== game.turn()) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        controls.enabled = false;
        if (selectedSquare !== hit.square) selectSquare(hit.square);
        drag = { root: hit.root, from: hit.square, startX: event.clientX, startY: event.clientY, moved: false };
        shell.canvas.setPointerCapture?.(event.pointerId);
        return;
      }
      if (selectedSquare && hit.type === "square") {
        const legal = legalMoves.some((move) => move.to === hit.square);
        if (legal) {
          event.preventDefault();
          event.stopImmediatePropagation();
          controls.enabled = false;
          pendingClickMove = { from: selectedSquare, to: hit.square };
        }
      }
    },
    { capture: true, signal },
  );

  window.addEventListener(
    "pointermove",
    (event) => {
      if (drag) {
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) > 4) drag.moved = true;
        if (!drag.moved) return;
        const square = pointerOnBoard(event);
        if (square) {
          hoverSquare = square;
          const pos = squareToWorld(square);
          drag.root.position.set(pos.x, board.topY + 0.32, pos.z);
          updateHighlights();
        }
        event.preventDefault();
        return;
      }
      if (!gameStarted || gameOver || busy || aiThinking || pendingPromotion) return;
      const square = pointerOnBoard(event);
      if (square !== hoverSquare) {
        hoverSquare = square || "";
        updateHighlights();
        const hit = square ? boardSquareFromEvent(event) : null;
        shell.canvas.style.cursor = hit?.type === "piece" ? "grab" : selectedSquare ? "pointer" : "grab";
      }
    },
    { signal },
  );

  function finishPointer() {
    if (drag) {
      const square = hoverSquare;
      const from = drag.from;
      const moved = drag.moved;
      const root = drag.root;
      drag = null;
      hoverSquare = "";
      if (moved && square && square !== from) {
        const legal = legalMoves.some((move) => move.to === square);
        if (legal) {
          controls.enabled = true;
          makeHumanMove(from, square);
          return;
        }
      }
      if (root) {
        const pos = squareToWorld(from);
        animatePieceRoot(root, pos, reducedMotion ? 0 : 0.18, 0.04);
      }
      controls.enabled = true;
      updateHighlights();
      return;
    }
    if (pendingClickMove) {
      const move = pendingClickMove;
      pendingClickMove = null;
      controls.enabled = true;
      makeHumanMove(move.from, move.to);
    }
  }

  window.addEventListener("pointerup", finishPointer, { signal });
  window.addEventListener("pointercancel", finishPointer, { signal });

  function animate() {
    const dt = Math.min(0.05, clock.getDelta());
    controls.update();
    environments?.update(dt);
    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(animate);

  shell.setRestartHandler(() => {
    if (gameStarted) restartGame();
    else beginGame();
  });

  if (soundOn === false) {
    soundButton.setAttribute("aria-pressed", "false");
    soundButton.innerHTML = MUTED_SVG;
    soundButton.setAttribute("aria-label", "Unmute sound");
  }

  syncStartUI();
  setStartStatus("Carving the set...");
  buildWorld().catch((error) => {
    console.error("Royal Wood 3D Chess failed to build:", error);
    setStartStatus("The set could not be built. Reload to try again.");
    startBegin.disabled = true;
  });

  if (new URLSearchParams(window.location.search).get("debugchess") === "1") {
    window.__chess = {
      state: () => ({
        fen: game.fen(),
        turn: game.turn(),
        history: game.history(),
        inCheck: game.inCheck(),
        gameOver: game.isGameOver() || gameOver,
        result: resultInfo,
        settings: { ...settings },
        pieces: pieceGroups.size,
        busy,
        aiThinking,
        pendingPromotion: Boolean(pendingPromotion),
        selected: selectedSquare,
        legal: legalMoves.map((move) => move.to),
        started: gameStarted,
        engine: { ...engineStatus, usingAsm: engine.usingAsm, ready: engine.ready },
        background,
      }),
      start: beginGame,
      move: (from, to, promotion) => { clearSelection(); return applyMove({ from, to, promotion }); },
      load: async (fen) => {
        game.load(fen);
        gameStarted = true;
        gameOver = false;
        resultInfo = null;
        hideResult();
        start.classList.add("is-hidden");
        ui.classList.remove("is-hidden");
        controls.autoRotate = false;
        rebuildFromGame();
        return true;
      },
      undo: undoMove,
      resign: () => { resignGame(); if (!confirmModal.hidden) confirmModal.hidden = true; resignGame(); },
      restart: restartGame,
      newGame: openNewGame,
      setMode: (next) => { settings.mode = next === "local" ? "local" : "computer"; mode = settings.mode; syncStartUI(); },
      setSide: (next) => { settings.side = next === "b" ? "b" : "w"; humanColor = settings.side; settings.side = humanColor; syncStartUI(); },
      setDifficulty: (next) => { if (["easy", "medium", "hard"].includes(next)) { settings.difficulty = next; difficulty = next; syncStartUI(); } },
      setBackground: (next) => setBackground(next),
      flip: flipCamera,
      screen: (square, lift = 0.35) => {
        const pos = squareToWorld(square);
        const point = new THREE.Vector3(pos.x, board.topY + lift, pos.z).project(camera);
        const rect = shell.canvas.getBoundingClientRect();
        return {
          x: rect.left + (point.x * 0.5 + 0.5) * rect.width,
          y: rect.top + (-point.y * 0.5 + 0.5) * rect.height,
        };
      },
      camera: () => ({ x: camera.position.x, y: camera.position.y, z: camera.position.z, target: controls.target.toArray() }),
      hitAt: (x, y) => {
        const hit = boardSquareFromEvent({ clientX: x, clientY: y });
        return hit ? { type: hit.type, square: hit.square, piece: hit.root?.userData?.pieceType || null, color: hit.root?.userData?.color || null } : null;
      },
      pickables: () => piecePickables.length,
      pieceInfo: () => {
        let meshes = 0;
        const types = {};
        for (const root of pieceGroups.values()) {
          root.traverse((o) => { if (o.isMesh) meshes += 1; });
          const key = root.userData.color + root.userData.pieceType;
          types[key] = (types[key] || 0) + 1;
        }
        return { squares: [...pieceGroups.keys()], meshes, types };
      },
      pauseRender: () => renderer.setAnimationLoop(null),
      resumeRender: () => renderer.setAnimationLoop(animate),
      renderOnce: () => renderer.render(scene, camera),
      backgroundInfo: () => ({
        current: environments?.current,
        visible: environments ? Object.fromEntries(Object.entries(environments.groups).map(([key, item]) => [key, item.group.visible])) : {},
      }),
      engineStatus: () => ({ ...engineStatus, info: engineInfo }),
    };
  }

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      aiToken += 1;
      uiController.abort();
      engine.destroy();
      audio.dispose();
      controls.dispose();
      stage.dispose();
      app.remove();
      shell.root.classList.remove("game-shell--chess");
    },
  };
}




