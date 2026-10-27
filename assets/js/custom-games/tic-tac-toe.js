import { icon } from "../icons.js";
import { prefersReducedMotion, storageGet, storageSet } from "../utilities.js";

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const MARK_SVG = {
  X: `<svg class="ttt-symbol__svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><path pathLength="100" d="M27 27 73 73"/><path pathLength="100" d="M73 27 27 73"/></svg>`,
  O: `<svg class="ttt-symbol__svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><circle pathLength="100" cx="50" cy="50" r="27"/></svg>`,
};

const SPEAKER_SVG = `<svg class="ttt-sound__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h4l5-4v14l-5-4H4V9Z"/><path d="M16 8.5c1.7 1.8 1.7 5.2 0 7M19 6c3 3.2 3 8.8 0 12"/></svg>`;
const MUTED_SVG = `<svg class="ttt-sound__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9h4l5-4v14l-5-4H4V9Z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>`;

const SCORES_KEY = "robloxsplay:ttt:scores";
const SETTINGS_KEY = "robloxsplay:ttt:settings";
const SOUND_KEY = "robloxsplay:ttt:sound";

const pad = (value) => String(value).padStart(2, "0");
const other = (mark) => (mark === "X" ? "O" : "X");
const scoreValue = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number < 10000 ? Math.floor(number) : 0;
};

function createAudio(enabled) {
  let context = null;
  let master = null;
  let soundOn = enabled;

  const ensure = () => {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = soundOn ? 0.72 : 0;
      master.connect(context.destination);
    }
    if (context.state === "suspended") context.resume().catch(() => {});
    return context;
  };

  const setMuted = (muted) => {
    soundOn = !muted;
    if (master && context) {
      master.gain.setTargetAtTime(soundOn ? 0.72 : 0, context.currentTime, 0.015);
    }
  };

  const tone = (frequency, duration = 0.12, type = "sine", delay = 0, gain = 0.07) => {
    if (!soundOn) return;
    const audio = ensure();
    if (!audio || !master) return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const envelope = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  };

  return {
    ensure,
    setMuted,
    move(mark) {
      if (mark === "X") {
        tone(540, 0.09, "triangle", 0, 0.075);
        tone(760, 0.07, "sine", 0.035, 0.045);
      } else {
        tone(350, 0.12, "sine", 0, 0.075);
        tone(470, 0.08, "triangle", 0.045, 0.04);
      }
    },
    click() {
      tone(660, 0.05, "triangle", 0, 0.04);
    },
    win() {
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        tone(frequency, 0.24, "triangle", index * 0.085, 0.07);
      });
    },
    draw() {
      tone(392, 0.2, "sine", 0, 0.06);
      tone(329.63, 0.26, "sine", 0.11, 0.055);
    },
    close() {
      if (context && context.state !== "closed") {
        context.close().catch(() => {});
      }
    },
  };
}

export default function createTicTacToe(shell) {
  const controller = new AbortController();
  const reducedMotion = prefersReducedMotion();
  const debugEnabled = new URLSearchParams(window.location.search).get("debugttt") === "1";
  const savedScores = storageGet(SCORES_KEY, {}) || {};
  const savedSettings = storageGet(SETTINGS_KEY, {}) || {};
  const savedSound = storageGet(SOUND_KEY, true);

  let scores = {
    x: scoreValue(savedScores.x),
    o: scoreValue(savedScores.o),
    draws: scoreValue(savedScores.draws),
  };
  let lastScores = { ...scores };
  let mode = savedSettings.mode === "cpu" ? "cpu" : "pvp";
  let humanMark = savedSettings.mark === "O" ? "O" : "X";
  let difficulty = ["easy", "medium", "impossible"].includes(savedSettings.difficulty)
    ? savedSettings.difficulty
    : "impossible";
  let soundOn = savedSound !== false;

  let board = Array(9).fill("");
  let current = "X";
  let phase = "ready";
  let winner = "";
  let winningLine = [];
  let round = 1;
  let roundStarted = false;
  let busy = false;
  let aiToken = 0;
  let aiTimer = 0;
  let resultTimer = 0;
  let confettiTimer = 0;

  const audio = createAudio(soundOn);

  shell.root.classList.add("game-shell--ttt");
  const hud = shell.root.querySelector(".game-hud");
  if (hud) hud.style.display = "none";
  const pause = shell.root.querySelector("[data-pause]");
  if (pause) pause.style.display = "none";
  if (shell.touch) {
    shell.touch.hidden = true;
    shell.touch.style.display = "none";
  }
  const footerLast = shell.root.querySelector(".game-shell__footer span:last-child");
  if (footerLast) footerLast.innerHTML = "<kbd>R</kbd> restart round <kbd>F</kbd> fullscreen";

  const app = document.createElement("div");
  app.className = "ttt-app";
  app.innerHTML = `
    <div class="ttt-app__fx" aria-hidden="true">
      <span class="ttt-app__orb ttt-app__orb--one"></span>
      <span class="ttt-app__orb ttt-app__orb--two"></span>
      <span class="ttt-app__grid"></span>
    </div>
    <div class="ttt-layout" data-ttt-layout>
      <section class="ttt-board-card ttt-glass" aria-label="Tic Tac Toe board">
        <header class="ttt-board-head">
          <div class="ttt-turn" data-turn>
            <span class="ttt-turn__symbol is-x" data-turn-symbol>${MARK_SVG.X}</span>
            <span class="ttt-turn__copy">
              <span class="ttt-eyebrow">Current turn</span>
              <strong data-turn-label>Player X to move</strong>
            </span>
          </div>
          <div class="ttt-round">
            <span>Round</span>
            <strong data-round>01</strong>
          </div>
        </header>
        <div class="ttt-board-wrap">
          <div class="ttt-board-shell">
          <div class="ttt-board" role="grid" aria-label="Tic Tac Toe board" aria-rowcount="3" aria-colcount="3" data-board>
            ${Array.from({ length: 9 }, (_, index) => {
              const row = Math.floor(index / 3) + 1;
              const column = (index % 3) + 1;
              return `<button class="ttt-cell" type="button" role="gridcell" data-cell="${index}" aria-label="Row ${row}, column ${column}, empty">
                <span class="ttt-cell__index" aria-hidden="true">${pad(index + 1)}</span>
                <span class="ttt-ghost" aria-hidden="true"></span>
                <span class="ttt-cell__flash" aria-hidden="true"></span>
              </button>`;
            }).join("")}
          </div>
          <svg class="ttt-winline" viewBox="0 0 300 300" aria-hidden="true" focusable="false">
            <defs>
              <linearGradient id="ttt-win-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stop-color="#58e5ff"/>
                <stop offset="0.52" stop-color="#c9ff4a"/>
                <stop offset="1" stop-color="#b9a8ff"/>
              </linearGradient>
            </defs>
            <line class="ttt-winline__stroke" x1="50" y1="50" x2="250" y2="250"/>
          </svg>
          <div class="ttt-confetti" data-confetti aria-hidden="true"></div>
          </div>
        </div>
        <div class="ttt-scoreboard" aria-label="Match scoreboard">
          <div class="ttt-score ttt-score--x" data-score-card="x">
            <span class="ttt-score__mark is-x">${MARK_SVG.X}</span>
            <span class="ttt-score__copy"><span>X wins</span><small data-score-tag="x">Player</small></span>
            <strong data-score-value="x">0</strong>
          </div>
          <div class="ttt-score ttt-score--o" data-score-card="o">
            <span class="ttt-score__mark is-o">${MARK_SVG.O}</span>
            <span class="ttt-score__copy"><span>O wins</span><small data-score-tag="o">Player</small></span>
            <strong data-score-value="o">0</strong>
          </div>
          <div class="ttt-score ttt-score--draw" data-score-card="draws">
            <span class="ttt-score__mark ttt-score__mark--draw" aria-hidden="true">=</span>
            <span class="ttt-score__copy"><span>Draws</span><small>Stalemate</small></span>
            <strong data-score-value="draws">0</strong>
          </div>
        </div>
      </section>

      <aside class="ttt-side">
        <section class="ttt-brand-card ttt-glass">
          <div class="ttt-brand__mark" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
          <p class="ttt-eyebrow">Original strategy game</p>
          <h2>Tic Tac Toe</h2>
          <p class="ttt-brand__tagline">Three in a row. No mercy.</p>
          <div class="ttt-mode-status"><span class="ttt-live-dot" aria-hidden="true"></span><span data-mode-label>Local duel</span></div>
        </section>

        <section class="ttt-controls-card ttt-glass" aria-label="Match settings">
          <div class="ttt-control-block">
            <span class="ttt-control-label">Match mode</span>
            <div class="ttt-segmented" role="group" aria-label="Match mode">
              <button class="ttt-segment is-active" type="button" data-mode="pvp" aria-pressed="true">2 Players</button>
              <button class="ttt-segment" type="button" data-mode="cpu" aria-pressed="false">vs Computer</button>
            </div>
          </div>

          <div class="ttt-cpu-settings" data-cpu-settings>
            <div class="ttt-control-block">
              <span class="ttt-control-label">Your mark</span>
              <div class="ttt-segmented ttt-segmented--compact" role="group" aria-label="Your mark">
                <button class="ttt-segment is-active" type="button" data-mark="X" aria-pressed="true" aria-label="Play as X"><span class="ttt-mini-mark is-x">X</span><span>Play X</span></button>
                <button class="ttt-segment" type="button" data-mark="O" aria-pressed="false" aria-label="Play as O"><span class="ttt-mini-mark is-o">O</span><span>Play O</span></button>
              </div>
            </div>
            <div class="ttt-control-block">
              <span class="ttt-control-label">Difficulty</span>
              <div class="ttt-segmented ttt-segmented--three" role="group" aria-label="Computer difficulty">
                <button class="ttt-segment" type="button" data-difficulty="easy" aria-pressed="false">Easy</button>
                <button class="ttt-segment" type="button" data-difficulty="medium" aria-pressed="false">Medium</button>
                <button class="ttt-segment is-active" type="button" data-difficulty="impossible" aria-pressed="true">Impossible</button>
              </div>
            </div>
          </div>

          <div class="ttt-actions">
            <button class="ttt-action" type="button" data-new-round>${icon("restart")}<span>Restart round</span></button>
            <button class="ttt-action ttt-action--quiet" type="button" data-reset-scores>Reset scores</button>
          </div>

          <button class="ttt-sound" type="button" data-sound aria-pressed="true">
            <span class="ttt-sound__icon-wrap">${SPEAKER_SVG}</span>
            <span data-sound-label>Sound on</span>
          </button>
        </section>

        <p class="ttt-hint" data-hint>Tap an empty cell to place X.</p>
      </aside>
    </div>

    <div class="ttt-result" data-result hidden>
      <div class="ttt-result__scrim"></div>
      <div class="ttt-result__panel" role="dialog" aria-modal="true" aria-labelledby="ttt-result-title">
        <button class="ttt-result__close" type="button" data-result-close aria-label="Close result">${icon("close")}</button>
        <div class="ttt-result__glow" aria-hidden="true"></div>
        <div class="ttt-result__symbol" data-result-symbol></div>
        <p class="ttt-result__kicker" data-result-kicker>Round complete</p>
        <h2 id="ttt-result-title" data-result-title>X takes the line.</h2>
        <p class="ttt-result__text" data-result-text></p>
        <div class="ttt-result__scores" data-result-scores></div>
        <div class="ttt-result__actions">
          <button class="button ttt-result__play" type="button" data-result-play>Play again ${icon("play")}</button>
          <a class="button button--ghost" href="/index.html" data-result-home>Home</a>
        </div>
      </div>
    </div>
  `;
  shell.stage.insertBefore(app, shell.overlay);

  const layout = app.querySelector("[data-ttt-layout]");
  const boardEl = app.querySelector("[data-board]");
  const cells = [...app.querySelectorAll("[data-cell]")];
  const winline = app.querySelector(".ttt-winline");
  const winlineStroke = app.querySelector(".ttt-winline__stroke");
  const confetti = app.querySelector("[data-confetti]");
  const turnEl = app.querySelector("[data-turn]");
  const turnSymbol = app.querySelector("[data-turn-symbol]");
  const turnLabel = app.querySelector("[data-turn-label]");
  const roundEl = app.querySelector("[data-round]");
  const modeLabel = app.querySelector("[data-mode-label]");
  const cpuSettings = app.querySelector("[data-cpu-settings]");
  const hintEl = app.querySelector("[data-hint]");
  const soundButton = app.querySelector("[data-sound]");
  const soundLabel = app.querySelector("[data-sound-label]");
  const result = app.querySelector("[data-result]");
  const resultSymbol = app.querySelector("[data-result-symbol]");
  const resultKicker = app.querySelector("[data-result-kicker]");
  const resultTitle = app.querySelector("[data-result-title]");
  const resultText = app.querySelector("[data-result-text]");
  const resultScores = app.querySelector("[data-result-scores]");
  const resultPlay = app.querySelector("[data-result-play]");
  const scoreCards = [...app.querySelectorAll("[data-score-card]")];

  const announce = (message) => shell.announce(message);

  function persistScores() {
    storageSet(SCORES_KEY, scores);
  }

  function persistSettings() {
    storageSet(SETTINGS_KEY, { mode, mark: humanMark, difficulty });
  }

  function saveSound() {
    storageSet(SOUND_KEY, soundOn);
  }

  function center(index) {
    return { x: 50 + (index % 3) * 100, y: 50 + Math.floor(index / 3) * 100 };
  }

  function winnerFor(state) {
    for (const line of WIN_LINES) {
      const [a, b, c] = line;
      if (state[a] && state[a] === state[b] && state[a] === state[c]) {
        return { mark: state[a], line };
      }
    }
    return null;
  }

  function nameFor(mark) {
    if (mode === "pvp") return `Player ${mark}`;
    return mark === humanMark ? "You" : "Rival";
  }

  function markForScoreCard(card) {
    if (card === "draws") return "";
    return card.toUpperCase();
  }

  function cellLabel(index, mark) {
    const row = Math.floor(index / 3) + 1;
    const column = (index % 3) + 1;
    return `Row ${row}, column ${column}, ${mark || "empty"}`;
  }

  function updateScoreTags() {
    const tags = {
      x: mode === "pvp" ? "Player" : humanMark === "X" ? "You" : "Rival",
      o: mode === "pvp" ? "Player" : humanMark === "O" ? "You" : "Rival",
    };
    app.querySelector('[data-score-tag="x"]').textContent = tags.x;
    app.querySelector('[data-score-tag="o"]').textContent = tags.o;
  }

  function bump(element) {
    if (!element) return;
    element.classList.remove("is-bumped");
    void element.offsetWidth;
    element.classList.add("is-bumped");
    window.setTimeout(() => element.classList.remove("is-bumped"), 520);
  }

  function renderScores(animate = false) {
    for (const key of ["x", "o", "draws"]) {
      const value = app.querySelector(`[data-score-value="${key}"]`);
      if (value) {
        value.textContent = String(scores[key]);
        if (animate && scores[key] !== lastScores[key]) bump(value);
      }
    }
    lastScores = { ...scores };
    updateScoreTags();
    updateActiveScore();
  }

  function renderMode() {
    app.querySelectorAll("[data-mode]").forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    app.querySelectorAll("[data-mark]").forEach((button) => {
      const active = button.dataset.mark === humanMark;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    app.querySelectorAll("[data-difficulty]").forEach((button) => {
      const active = button.dataset.difficulty === difficulty;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (cpuSettings) cpuSettings.hidden = mode !== "cpu";
    modeLabel.textContent =
      mode === "pvp"
        ? "Local duel"
        : `You vs Computer / ${difficulty === "impossible" ? "Unbeaten" : difficulty[0].toUpperCase() + difficulty.slice(1)}`;
    updateScoreTags();
    renderSound();
  }

  function renderSound() {
    if (!soundButton) return;
    soundButton.setAttribute("aria-pressed", String(soundOn));
    soundButton.classList.toggle("is-muted", !soundOn);
    soundButton.querySelector(".ttt-sound__icon-wrap").innerHTML = soundOn ? SPEAKER_SVG : MUTED_SVG;
    soundLabel.textContent = soundOn ? "Sound on" : "Sound off";
  }

  function renderTurn() {
    const displayMark = winner || current;
    const isDraw = winner === "draw";
    turnEl.classList.toggle("is-o", displayMark === "O");
    turnEl.classList.toggle("is-x", displayMark === "X");
    turnEl.classList.toggle("is-thinking", busy);
    if (isDraw) {
      turnSymbol.innerHTML = `<span class="ttt-turn__draw">=</span>`;
      turnSymbol.className = "ttt-turn__symbol ttt-turn__symbol--draw";
      turnLabel.textContent = "Draw";
    } else {
      turnSymbol.innerHTML = MARK_SVG[displayMark];
      turnSymbol.className = `ttt-turn__symbol is-${displayMark.toLowerCase()}`;
      if (phase === "ready") turnLabel.textContent = "Set the table";
      else if (winner) turnLabel.textContent = `${nameFor(winner)} wins`;
      else if (busy) turnLabel.textContent = "Rival is calculating";
      else turnLabel.textContent = `${nameFor(current)} to move`;
    }
    roundEl.textContent = pad(round);
    updateActiveScore();
  }

  function updateActiveScore() {
    const activeMark = winner && winner !== "draw" ? winner : current;
    scoreCards.forEach((card) => {
      const key = card.dataset.scoreCard;
      card.classList.toggle(
        "is-active",
        phase !== "ready" && (key === "draws" ? winner === "draw" : key.toUpperCase() === activeMark),
      );
    });
  }

  function updateHint() {
    if (!hintEl) return;
    if (phase === "ready") hintEl.textContent = "Tap an empty cell to place X.";
    else if (winner === "draw") hintEl.textContent = "Nine squares. No way through. Start the next round.";
    else if (winner) hintEl.textContent = `${nameFor(winner)} found the line. Start the next round.`;
    else if (busy) hintEl.textContent = "Rival is scanning the grid.";
    else if (mode === "cpu" && current !== humanMark) hintEl.textContent = "Rival opens the round.";
    else hintEl.textContent = mode === "cpu" ? "Your move. Three in a row takes it." : `${nameFor(current)} to move.`;
  }

  function setStatus() {
    if (phase === "ready") {
      shell.setStatus("Ready to play");
      return;
    }
    if (winner === "draw") {
      shell.setStatus("Round drawn", "paused");
      return;
    }
    if (winner) {
      shell.setStatus(`${winner} wins`, "playing");
      return;
    }
    shell.setStatus(busy ? "Computer thinking" : `${current} to move`, "playing");
  }

  function updateAll() {
    renderTurn();
    renderScores();
    updateHint();
    setStatus();
    updateGhosts();
    updateCells();
  }

  function updateGhosts() {
    const canShow =
      phase === "playing" &&
      !busy &&
      !winner &&
      !(mode === "cpu" && current !== humanMark);
    cells.forEach((cell, index) => {
      if (board[index]) return;
      const ghost = cell.querySelector(".ttt-ghost");
      if (!ghost) return;
      ghost.innerHTML = canShow ? MARK_SVG[current] : "";
      cell.dataset.preview = canShow ? current.toLowerCase() : "";
    });
  }

  function updateCells() {
    const canPlay =
      phase === "playing" &&
      !busy &&
      !winner &&
      !(mode === "cpu" && current !== humanMark);
    cells.forEach((cell, index) => {
      const occupied = Boolean(board[index]);
      const disabled = !canPlay || occupied;
      cell.disabled = disabled;
      cell.setAttribute("aria-disabled", String(disabled));
      cell.setAttribute(
        "aria-label",
        cellLabel(index, board[index] || (disabled && !occupied ? "unavailable" : "")),
      );
      cell.classList.toggle("is-filled", occupied);
      cell.classList.toggle("is-x", board[index] === "X");
      cell.classList.toggle("is-o", board[index] === "O");
    });
  }

  function resetCells() {
    cells.forEach((cell, index) => {
      cell.className = "ttt-cell";
      cell.disabled = false;
      cell.removeAttribute("aria-disabled");
      cell.innerHTML = `<span class="ttt-cell__index" aria-hidden="true">${pad(index + 1)}</span><span class="ttt-ghost" aria-hidden="true"></span><span class="ttt-cell__flash" aria-hidden="true"></span>`;
      cell.setAttribute("aria-label", cellLabel(index, ""));
    });
    boardEl.classList.remove("is-draw", "is-over");
    winline.classList.remove("is-on");
    winlineStroke.style.removeProperty("--ttt-line-length");
  }

  function paintCell(index, mark) {
    const cell = cells[index];
    cell.classList.add("is-filled", "is-placed", mark === "X" ? "is-x" : "is-o");
    cell.dataset.filled = mark;
    cell.innerHTML = `<span class="ttt-symbol ttt-symbol--${mark.toLowerCase()}">${MARK_SVG[mark]}</span><span class="ttt-cell__flash" aria-hidden="true"></span>`;
    cell.setAttribute("aria-label", cellLabel(index, mark));
    cell.disabled = true;
    cell.setAttribute("aria-disabled", "true");
    window.setTimeout(() => cell.classList.remove("is-placed"), 560);
  }

  function clearWinLine() {
    winline.classList.remove("is-on");
    winlineStroke.removeAttribute("style");
    cells.forEach((cell) => cell.classList.remove("is-win"));
  }

  function showWinLine(line) {
    const first = center(line[0]);
    const last = center(line[2]);
    winlineStroke.setAttribute("x1", String(first.x));
    winlineStroke.setAttribute("y1", String(first.y));
    winlineStroke.setAttribute("x2", String(last.x));
    winlineStroke.setAttribute("y2", String(last.y));
    winlineStroke.style.setProperty("--ttt-line-length", String(Math.hypot(last.x - first.x, last.y - first.y)));
    winline.classList.remove("is-on");
    void winline.getBoundingClientRect();
    winline.classList.add("is-on");
    line.forEach((index) => cells[index].classList.add("is-win"));
  }

  function clearConfetti() {
    window.clearTimeout(confettiTimer);
    confetti.replaceChildren();
  }

  function spawnConfetti(line, draw = false) {
    clearConfetti();
    if (reducedMotion) return;
    const palette = ["#58e5ff", "#c9ff4a", "#b9a8ff", "#ff8666", "#f3f6e9"];
    const count = draw ? 26 : 48;
    const fragment = document.createDocumentFragment();
    const origins = draw
      ? [{ x: 50, y: 50 }]
      : line.map((index) => ({ x: 16.66 + (index % 3) * 33.33, y: 16.66 + Math.floor(index / 3) * 33.33 }));
    for (let index = 0; index < count; index += 1) {
      const piece = document.createElement("span");
      const origin = origins[Math.floor(Math.random() * origins.length)];
      const angle = Math.random() * Math.PI * 2;
      const distance = 42 + Math.random() * 145;
      piece.className = "ttt-confetti__piece";
      piece.style.setProperty("--x", `${origin.x + (Math.random() - 0.5) * 8}%`);
      piece.style.setProperty("--y", `${origin.y + (Math.random() - 0.5) * 8}%`);
      piece.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      piece.style.setProperty("--dy", `${Math.sin(angle) * distance - 50}px`);
      piece.style.setProperty("--rot", `${Math.round(Math.random() * 720 - 360)}deg`);
      piece.style.setProperty("--delay", `${(Math.random() * 0.16).toFixed(2)}s`);
      piece.style.setProperty("--duration", `${(0.95 + Math.random() * 0.6).toFixed(2)}s`);
      piece.style.setProperty("--color", palette[index % palette.length]);
      piece.style.setProperty("--w", `${4 + Math.random() * 6}px`);
      piece.style.setProperty("--h", `${7 + Math.random() * 9}px`);
      fragment.appendChild(piece);
    }
    confetti.appendChild(fragment);
    confettiTimer = window.setTimeout(() => confetti.replaceChildren(), 1900);
  }

  function cancelAi() {
    aiToken += 1;
    window.clearTimeout(aiTimer);
    aiTimer = 0;
    busy = false;
  }

  function scheduleAi() {
    if (mode !== "cpu" || phase !== "playing" || current === humanMark) return;
    cancelAi();
    busy = true;
    const token = aiToken;
    updateAll();
    aiTimer = window.setTimeout(() => {
      if (token !== aiToken || phase !== "playing" || current === humanMark) return;
      busy = false;
      const choice = chooseAiMove();
      if (choice === null || board[choice]) {
        updateAll();
        return;
      }
      placeMark(choice, "ai");
    }, reducedMotion ? 140 : 420 + Math.random() * 380);
  }

  function emptyCells(state = board) {
    return state.reduce((list, value, index) => {
      if (!value) list.push(index);
      return list;
    }, []);
  }

  function randomMove(state = board) {
    const available = emptyCells(state);
    if (!available.length) return null;
    return available[Math.floor(Math.random() * available.length)];
  }

  function tacticalMove(mark) {
    for (const index of emptyCells()) {
      board[index] = mark;
      const win = winnerFor(board);
      board[index] = "";
      if (win && win.mark === mark) return index;
    }
    return null;
  }

  function minimax(state, turn, cpuMark, playerMark, depth, alpha, beta) {
    const terminal = winnerFor(state);
    if (terminal) return terminal.mark === cpuMark ? 10 - depth : depth - 10;
    if (state.every(Boolean)) return 0;
    const maximizing = turn === cpuMark;
    let best = maximizing ? -Infinity : Infinity;
    for (const index of emptyCells(state)) {
      state[index] = turn;
      const score = minimax(state, other(turn), cpuMark, playerMark, depth + 1, alpha, beta);
      state[index] = "";
      if (maximizing) {
        best = Math.max(best, score);
        alpha = Math.max(alpha, score);
      } else {
        best = Math.min(best, score);
        beta = Math.min(beta, score);
      }
      if (beta <= alpha) break;
    }
    return best;
  }

  function bestMove() {
    const cpuMark = mode === "cpu" ? other(humanMark) : other(current);
    const playerMark = other(cpuMark);
    let bestScore = -Infinity;
    let choices = [];
    for (const index of emptyCells()) {
      board[index] = cpuMark;
      const score = minimax(board, playerMark, cpuMark, playerMark, 1, -Infinity, Infinity);
      board[index] = "";
      if (score > bestScore) {
        bestScore = score;
        choices = [index];
      } else if (score === bestScore) {
        choices.push(index);
      }
    }
    return choices.length ? choices[Math.floor(Math.random() * choices.length)] : null;
  }

  function chooseAiMove() {
    if (difficulty === "easy") return randomMove();
    if (difficulty === "medium") {
      const cpuMark = other(humanMark);
      const winNow = tacticalMove(cpuMark);
      if (winNow !== null) return winNow;
      const block = tacticalMove(humanMark);
      if (block !== null && Math.random() < 0.8) return block;
      return Math.random() < 0.55 ? bestMove() : randomMove();
    }
    return bestMove();
  }

  function finishRound(mark, line) {
    phase = "over";
    winner = mark;
    winningLine = line || [];
    busy = false;
    cancelAi();
    if (mark === "draw") scores.draws += 1;
    else scores[mark.toLowerCase()] += 1;
    persistScores();
    renderScores(true);
    renderTurn();
    updateHint();
    setStatus();
    updateCells();
    updateGhosts();
    boardEl.classList.add("is-over");
    if (mark === "draw") {
      boardEl.classList.add("is-draw");
      spawnConfetti(null, true);
      audio.draw();
      shell.announce(`Round drawn. X ${scores.x}, O ${scores.o}, draws ${scores.draws}.`);
    } else {
      showWinLine(line);
      spawnConfetti(line);
      audio.win();
      shell.announce(`${nameFor(mark)} wins the round. X ${scores.x}, O ${scores.o}, draws ${scores.draws}.`);
    }
    window.clearTimeout(resultTimer);
    resultTimer = window.setTimeout(showResult, reducedMotion ? 120 : 900);
  }

  function placeMark(index, source = "player") {
    if (phase !== "playing" || winner || board[index]) return false;
    if (source !== "ai" && (busy || (mode === "cpu" && current !== humanMark))) return false;
    board[index] = current;
    paintCell(index, current);
    audio.move(current);
    const terminal = winnerFor(board);
    if (terminal) {
      finishRound(terminal.mark, terminal.line);
      return true;
    }
    if (board.every(Boolean)) {
      finishRound("draw", []);
      return true;
    }
    current = other(current);
    busy = false;
    updateAll();
    if (mode === "cpu" && current !== humanMark) scheduleAi();
    return true;
  }

  function startRound(advance = true) {
    cancelAi();
    window.clearTimeout(resultTimer);
    hideResult();
    clearConfetti();
    clearWinLine();
    if (advance && roundStarted) round += 1;
    roundStarted = true;
    board = Array(9).fill("");
    current = "X";
    phase = "playing";
    winner = "";
    winningLine = [];
    busy = false;
    resetCells();
    boardEl.classList.remove("is-resetting");
    void boardEl.offsetWidth;
    boardEl.classList.add("is-resetting");
    window.setTimeout(() => boardEl.classList.remove("is-resetting"), 420);
    renderScores();
    renderTurn();
    updateHint();
    setStatus();
    updateGhosts();
    updateCells();
    shell.setPaused(false);
    shell.hideOverlay();
    audio.ensure();
    audio.click();
    if (mode === "cpu" && current !== humanMark) {
      scheduleAi();
      announce(`Round ${round}. Rival opens.`);
    } else {
      announce(`Round ${round}. ${nameFor(current)} starts.`);
      requestAnimationFrame(() => {
        const target = cells.find((cell) => !cell.disabled);
        target?.focus({ preventScroll: true });
      });
    }
  }

  function restartRound() {
    startRound();
  }

  function resetScores() {
    scores = { x: 0, o: 0, draws: 0 };
    lastScores = { ...scores };
    persistScores();
    renderScores(false);
    audio.click();
    announce("Scores reset. The board is unchanged.");
    bump(app.querySelector('[data-score-value="x"]'));
    bump(app.querySelector('[data-score-value="o"]'));
    bump(app.querySelector('[data-score-value="draws"]'));
  }

  function resultCopy(mark) {
    if (mark === "draw") {
      return {
        kicker: `Round ${pad(round)} / Draw`,
        title: "Deadlocked.",
        text: "Nine squares. No way through. Reset the grid and make the next line count.",
      };
    }
    const won = mode === "cpu" ? mark === humanMark : true;
    if (mode === "cpu" && !won) {
      return {
        kicker: `Round ${pad(round)} / Rival wins`,
        title: "Rival takes the line.",
        text: "The grid closed before your next move. Read the board again and answer with a cleaner line.",
      };
    }
    if (mode === "cpu") {
      return {
        kicker: `Round ${pad(round)} / You win`,
        title: "You take the line.",
        text: "Three in a row against the machine. The board is yours. See if it can answer.",
      };
    }
    return {
      kicker: `Round ${pad(round)} / ${mark} wins`,
      title: `${mark} takes the line.`,
      text: "Three in a row. The board is yours. Keep the score moving or hand the next round back.",
    };
  }

  function showResult() {
    if (phase !== "over") return;
    const copy = resultCopy(winner);
    resultKicker.textContent = copy.kicker;
    resultTitle.textContent = copy.title;
    resultText.textContent = copy.text;
    if (winner === "draw") {
      resultSymbol.innerHTML = `<span class="ttt-result__draw-mark">=</span>`;
      resultSymbol.className = "ttt-result__symbol is-draw";
    } else {
      resultSymbol.innerHTML = MARK_SVG[winner];
      resultSymbol.className = `ttt-result__symbol is-${winner.toLowerCase()}`;
    }
    resultScores.innerHTML = `
      <span class="ttt-result__score is-x"><b>${scores.x}</b> X</span>
      <span class="ttt-result__score is-o"><b>${scores.o}</b> O</span>
      <span class="ttt-result__score is-draw"><b>${scores.draws}</b> Draws</span>
    `;
    result.hidden = false;
    layout.inert = true;
    requestAnimationFrame(() => {
      result.classList.add("is-open");
      resultPlay.focus({ preventScroll: true });
    });
    audio.click();
    announce(copy.title);
  }

  function hideResult() {
    result.classList.remove("is-open");
    result.hidden = true;
    layout.inert = false;
  }

  function enterArena() {
    shell.hideOverlay();
    audio.ensure();
    startRound(false);
  }

  function toggleSound() {
    soundOn = !soundOn;
    saveSound();
    audio.setMuted(!soundOn);
    if (soundOn) {
      audio.ensure();
      audio.click();
    }
    renderSound();
    announce(soundOn ? "Sound on." : "Sound off.");
  }

  function setMode(nextMode) {
    if (nextMode !== "pvp" && nextMode !== "cpu") return;
    if (mode === nextMode) return;
    mode = nextMode;
    persistSettings();
    renderMode();
    audio.click();
    if (phase === "ready") {
      updateAll();
      return;
    }
    startRound();
    shell.setStatus("Mode changed. New round", "playing");
    announce(`Mode changed to ${mode === "cpu" ? "versus computer" : "two players"}. New round.`);
  }

  function setMark(mark) {
    if (mark !== "X" && mark !== "O") return;
    if (humanMark === mark) return;
    humanMark = mark;
    persistSettings();
    renderMode();
    audio.click();
    if (phase !== "ready") startRound();
    announce(mode === "cpu" ? `You are ${humanMark}. New round.` : `Mark ${humanMark} selected.`);
  }

  function setDifficulty(nextDifficulty) {
    if (!["easy", "medium", "impossible"].includes(nextDifficulty)) return;
    if (difficulty === nextDifficulty) return;
    difficulty = nextDifficulty;
    persistSettings();
    renderMode();
    audio.click();
    announce(`Difficulty set to ${difficulty}.`);
    if (mode === "cpu" && phase !== "ready") {
      if (phase === "over") {
        startRound();
      } else if (current !== humanMark && !busy) {
        scheduleAi();
      }
    }
    updateHint();
    setStatus();
  }

  function closeResult() {
    if (result.hidden) return;
    hideResult();
    audio.click();
    const target = cells.find((cell) => !cell.disabled) || app.querySelector("[data-new-round]");
    target?.focus({ preventScroll: true });
  }

  function handleAppClick(event) {
    const cell = event.target.closest("[data-cell]");
    if (cell) {
      placeMark(Number(cell.dataset.cell));
      return;
    }
    const modeButton = event.target.closest("[data-mode]");
    if (modeButton) {
      setMode(modeButton.dataset.mode);
      return;
    }
    const markButton = event.target.closest("[data-mark]");
    if (markButton) {
      setMark(markButton.dataset.mark);
      return;
    }
    const difficultyButton = event.target.closest("[data-difficulty]");
    if (difficultyButton) {
      setDifficulty(difficultyButton.dataset.difficulty);
      return;
    }
    if (event.target.closest("[data-new-round]")) {
      restartRound();
      return;
    }
    if (event.target.closest("[data-reset-scores]")) {
      resetScores();
      return;
    }
    if (event.target.closest("[data-sound]")) {
      toggleSound();
      return;
    }
    if (event.target.closest("[data-result-play]")) {
      audio.click();
      startRound();
      return;
    }
    if (event.target.closest("[data-result-close]")) {
      closeResult();
    }
  }

  app.addEventListener("click", handleAppClick, { signal: controller.signal });
  app.addEventListener(
    "keydown",
    (event) => {
      if (result.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeResult();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [
        result.querySelector("[data-result-close]"),
        resultPlay,
        result.querySelector("[data-result-home]"),
      ].filter(Boolean);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    { signal: controller.signal },
  );

  renderScores();
  renderMode();
  renderTurn();
  updateHint();
  shell.setStatus("Ready to play");
  shell.setRestartHandler(restartRound);
  layout.inert = true;

  shell.showOverlay({
    kicker: "Original strategy game",
    title: "Tic Tac Toe",
    text: "Three in a row. Choose a local duel or take on the unbeatable minimax rival. The first clean line takes the round.",
    actionLabel: "Enter arena",
    onAction: enterArena,
    secondaryLabel: "All games",
    onSecondary: () => {
      window.location.href = "/all-games.html";
    },
    hint: "Local 2P / Minimax AI / Sound + motion controls",
    mark: "grid",
  });

  if (debugEnabled) {
    window.__ttt = {
      state: () => ({
        board: [...board],
        current,
        phase,
        winner,
        winningLine: [...winningLine],
        scores: { ...scores },
        mode,
        humanMark,
        difficulty,
        round,
        busy,
        soundOn,
      }),
      start: () => startRound(false),
      move: (index) => placeMark(Number(index)),
      restart: restartRound,
      resetScores,
      setMode,
      setMark,
      setDifficulty,
      closeResult,
    };
  }

  return {
    destroy() {
      cancelAi();
      window.clearTimeout(resultTimer);
      clearConfetti();
      controller.abort();
      audio.close();
      app.remove();
      shell.root.classList.remove("game-shell--ttt");
    },
  };
}
