import {
  COLORS,
  H,
  W,
  clamp,
  fillRoundRect,
  shuffle,
  strokeRoundRect,
} from "./game-utils.js";

export default function createMemoryMatrix(shell) {
  const ctx = shell.ctx;
  const symbols = ["orbit", "triad", "prism", "cross", "wave", "signal", "square", "diamond"];
  const cardSize = 104;
  const gap = 14;
  const boardX = (W - (cardSize * 4 + gap * 3)) / 2;
  const boardY = 84;

  let cards = [];
  let selected = [];
  let cursor = 0;
  let keyboardMode = false;
  let moves = 0;
  let elapsed = 0;
  let lock = 0;
  let running = false;
  let paused = false;
  let completed = false;
  let hover = -1;
  let raf = 0;
  let lastTime = performance.now();

  function buildDeck() {
    const deck = shuffle([...symbols, ...symbols]).map((symbol, index) => ({
      symbol,
      flipped: false,
      matched: false,
      flip: 0,
      index,
      pulse: 0,
    }));
    cards = deck;
    selected = [];
    cursor = 0;
    moves = 0;
    elapsed = 0;
    lock = 0;
    completed = false;
    keyboardMode = false;
  }

  function cardRect(index) {
    const row = Math.floor(index / 4);
    const col = index % 4;
    return {
      x: boardX + col * (cardSize + gap),
      y: boardY + row * (cardSize + gap),
      w: cardSize,
      h: cardSize,
    };
  }

  function updateHud() {
    shell.setScore(moves);
    const matchedPairs = cards.filter((card) => card.matched).length / 2;
    shell.setExtra([
      { label: "Pairs", value: `${matchedPairs}/8` },
      { label: "Time", value: formatTime(elapsed) },
    ]);
  }

  function formatTime(seconds) {
    const whole = Math.floor(seconds);
    return `${String(Math.floor(whole / 60)).padStart(2, "0")}:${String(whole % 60).padStart(2, "0")}`;
  }

  function flipCard(index) {
    if (!running || paused || lock > 0 || completed) return;
    const card = cards[index];
    if (!card || card.matched || card.flipped) return;
    card.flipped = true;
    card.pulse = 0.6;
    selected.push(index);
    if (selected.length === 2) {
      moves += 1;
      updateHud();
      const [first, second] = selected.map((position) => cards[position]);
      if (first.symbol === second.symbol) {
        first.matched = true;
        second.matched = true;
        first.pulse = 1;
        second.pulse = 1;
        selected = [];
        shell.announce(`Pair found in ${moves} moves.`);
        if (cards.every((item) => item.matched)) {
          completed = true;
          running = false;
          shell.setScore(moves, true);
          shell.showOverlay({
            kicker: "Matrix clear",
            title: "Perfect memory.",
            text: "Every pair found. The matrix remembers nothing now. Try to clear it in fewer moves.",
            actionLabel: "Shuffle again",
            onAction: start,
            secondaryLabel: "All games",
            onSecondary: () => {
              window.location.href = "/all-games.html";
            },
            showScore: true,
            scoreLabel: "Moves",
            bestLabel: "Best moves",
            hint: `Clear time ${formatTime(elapsed)}`,
            mark: "check",
          });
          shell.setPaused(false);
          shell.setStatus("Matrix cleared", "paused");
          shell.announce(`Matrix cleared in ${moves} moves and ${formatTime(elapsed)}.`);
        }
      } else {
        lock = 0.9;
      }
    }
  }

  function moveCursor(dx, dy) {
    keyboardMode = true;
    const row = Math.floor(cursor / 4);
    const col = cursor % 4;
    cursor = (clamp(row + dy, 0, 3) * 4) + clamp(col + dx, 0, 3);
  }

  function handleKey(event) {
    if (!running || paused) return;
    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveCursor(0, -1);
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      moveCursor(0, 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveCursor(-1, 0);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      moveCursor(1, 0);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      flipCard(cursor);
    }
  }

  function update(dt) {
    if (running && !paused && !completed) elapsed += dt;
    if (lock > 0) {
      lock -= dt;
      if (lock <= 0) {
        selected.forEach((index) => {
          if (!cards[index].matched) cards[index].flipped = false;
        });
        selected = [];
      }
    }
    cards.forEach((card) => {
      const target = card.flipped || card.matched ? 1 : 0;
      card.flip += (target - card.flip) * Math.min(1, dt * 11);
      card.pulse = Math.max(0, card.pulse - dt);
    });
    if (Math.floor(elapsed) !== Math.floor(elapsed - dt)) updateHud();
  }

  function drawSymbol(type, cx, cy, size, color) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const s = size / 2;
    ctx.beginPath();
    if (type === "orbit") {
      ctx.arc(0, 0, s * 0.72, 0, Math.PI * 2);
      ctx.moveTo(s * 0.94, 0);
      ctx.arc(0, 0, s * 0.94, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.moveTo(s * 0.5, 0);
      ctx.arc(s * 0.45, 0, s * 0.1, 0, Math.PI * 2);
    } else if (type === "triad") {
      ctx.moveTo(0, -s * 0.78);
      ctx.lineTo(s * 0.76, s * 0.5);
      ctx.lineTo(-s * 0.76, s * 0.5);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -s * 0.02, s * 0.22, 0, Math.PI * 2);
    } else if (type === "prism") {
      ctx.moveTo(-s * 0.68, -s * 0.68);
      ctx.lineTo(s * 0.5, -s * 0.68);
      ctx.lineTo(s * 0.68, s * 0.68);
      ctx.lineTo(-s * 0.5, s * 0.68);
      ctx.closePath();
      ctx.stroke();
      ctx.moveTo(-s * 0.2, 0);
      ctx.lineTo(s * 0.2, 0);
    } else if (type === "cross") {
      ctx.moveTo(-s * 0.7, 0);
      ctx.lineTo(s * 0.7, 0);
      ctx.moveTo(0, -s * 0.7);
      ctx.lineTo(0, s * 0.7);
      ctx.moveTo(-s * 0.3, -s * 0.3);
      ctx.lineTo(s * 0.3, s * 0.3);
    } else if (type === "wave") {
      ctx.moveTo(-s * 0.8, 0);
      ctx.bezierCurveTo(-s * 0.46, -s * 0.7, -s * 0.2, s * 0.7, 0, 0);
      ctx.bezierCurveTo(s * 0.2, -s * 0.7, s * 0.46, s * 0.7, s * 0.8, 0);
    } else if (type === "signal") {
      for (let i = -1; i <= 1; i += 1) {
        ctx.moveTo(i * s * 0.36 + 2, s * 0.6);
        ctx.lineTo(i * s * 0.36 + 2, -s * 0.6 + (i + 1) * s * 0.24);
      }
    } else if (type === "square") {
      ctx.rect(-s * 0.58, -s * 0.58, s * 1.16, s * 1.16);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.17, 0, Math.PI * 2);
    } else if (type === "diamond") {
      ctx.moveTo(0, -s * 0.78);
      ctx.lineTo(s * 0.64, 0);
      ctx.lineTo(0, s * 0.78);
      ctx.lineTo(-s * 0.64, 0);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.3);
      ctx.lineTo(0, s * 0.3);
    }
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawCard(card, index, now) {
    const rect = cardRect(index);
    const flipped = card.flip > 0.5;
    const scaleX = Math.max(0.06, Math.abs(Math.cos(card.flip * Math.PI)));
    const isSelected = selected.includes(index);
    const isCursor = keyboardMode && cursor === index && running;
    const glow = card.matched ? COLORS.lime : isSelected ? COLORS.cyan : "transparent";

    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.scale(scaleX, 1);
    if (card.matched) ctx.globalAlpha = 0.72;
    if (glow !== "transparent") {
      ctx.shadowColor = glow;
      ctx.shadowBlur = 20 + (card.pulse > 0 ? card.pulse * 15 : 0);
    }
    const gradient = ctx.createLinearGradient(0, -rect.h / 2, 0, rect.h / 2);
    if (flipped) {
      gradient.addColorStop(0, "#152039");
      gradient.addColorStop(1, "#0b1220");
    } else {
      gradient.addColorStop(0, "#111b2c");
      gradient.addColorStop(1, "#080e18");
    }
    fillRoundRect(ctx, -rect.w / 2, -rect.h / 2, rect.w, rect.h, 10, gradient);
    strokeRoundRect(
      ctx,
      -rect.w / 2 + 0.5,
      -rect.h / 2 + 0.5,
      rect.w - 1,
      rect.h - 1,
      10,
      card.matched ? "rgba(201,255,74,.42)" : isSelected ? "rgba(88,229,255,.6)" : "rgba(255,255,255,.11)",
      1,
    );

    if (!flipped) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "rgba(255,255,255,.28)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-24, 24);
      ctx.lineTo(24, -24);
      ctx.moveTo(-24, 2);
      ctx.lineTo(-2, -24);
      ctx.moveTo(2, 24);
      ctx.lineTo(24, 2);
      ctx.stroke();
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 0.42;
      ctx.fillStyle = "rgba(201,255,74,.12)";
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(201,255,74,.55)";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("NX", 0, 3);
      ctx.restore();
    } else {
      const accent = card.matched ? COLORS.lime : COLORS.cyan;
      drawSymbol(card.symbol, 0, 0, 64, accent);
      ctx.save();
      ctx.globalAlpha = 0.26;
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(0, 0, 40 + Math.sin(now / 500 + index) * 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (isCursor) {
      ctx.save();
      ctx.strokeStyle = COLORS.lime;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-rect.w / 2 - 5, -rect.h / 2 - 5, rect.w + 10, rect.h + 10);
      ctx.restore();
    }
    ctx.restore();
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 620);
    bg.addColorStop(0, "#10142a");
    bg.addColorStop(1, COLORS.ink);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,.045)";
    for (let i = 0; i < 40; i += 1) {
      const x = (i * 193 + 71) % W;
      const y = (i * 137 + 41) % H;
      ctx.beginPath();
      ctx.arc(x, y, i % 3 === 0 ? 1.2 : 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = "rgba(140,112,255,.12)";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 282, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 310, 0, Math.PI * 2);
    ctx.setLineDash([4, 12]);
    ctx.stroke();
    ctx.restore();

    cards.forEach((card, index) => drawCard(card, index, now));

    ctx.save();
    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(255,255,255,.38)";
    ctx.fillText(`MATRIX 04 / ${cards.filter((card) => card.matched).length / 2} PAIRS`, boardX, H - 18);
    ctx.textAlign = "right";
    ctx.fillText("ARROWS + ENTER", boardX + cardSize * 4 + gap * 3, H - 18);
    ctx.restore();

    if (hover >= 0 && hover < cards.length && !cards[hover].matched) {
      const rect = cardRect(hover);
      ctx.save();
      ctx.strokeStyle = "rgba(201,255,74,.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8);
      ctx.restore();
    }
  }

  function start() {
    buildDeck();
    running = true;
    paused = false;
    shell.setPaused(false);
    shell.setStatus("Find eight pairs", "playing");
    updateHud();
    lastTime = performance.now();
    shell.announce("Memory Matrix started. Reveal two cards at a time to find matching symbols.");
  }

  function pause() {
    if (!running) return;
    if (paused) {
      paused = false;
      shell.setPaused(false);
      shell.hideOverlay();
      lastTime = performance.now();
      shell.setStatus("Find eight pairs", "playing");
    } else {
      paused = true;
      shell.setPaused(true);
      shell.showOverlay({
        kicker: "Matrix paused",
        title: "Hold the pattern.",
        text: "The cards are frozen exactly where you left them.",
        actionLabel: "Resume",
        onAction: () => {
          paused = false;
          shell.setPaused(false);
          lastTime = performance.now();
          shell.setStatus("Find eight pairs", "playing");
        },
        secondaryLabel: "Shuffle again",
        onSecondary: start,
        mark: "pause",
      });
    }
  }

  function cardAt(x, y) {
    for (let index = 0; index < cards.length; index += 1) {
      const rect = cardRect(index);
      if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
        return index;
      }
    }
    return -1;
  }

  shell.onPointer((x, y) => {
    keyboardMode = false;
    const index = cardAt(x, y);
    if (index >= 0) {
      cursor = index;
      flipCard(index);
    }
  });
  shell.onPointerMove((x, y) => {
    hover = cardAt(x, y);
  });
  shell.onKey(handleKey);
  shell.setPauseHandler(pause);
  shell.setRestartHandler(start);

  function frame(now) {
    const delta = Math.min((now - lastTime) / 1000, 0.04);
    lastTime = now;
    update(delta);
    draw(now);
    raf = requestAnimationFrame(frame);
  }

  buildDeck();
  updateHud();
  shell.showOverlay({
    kicker: "Puzzle / Casual / 004",
    title: "Memory Matrix",
    text: "Flip two cards at a time. Match all eight pairs and clear the matrix in as few moves as possible.",
    actionLabel: "Start matrix",
    onAction: start,
    secondaryLabel: "All games",
    onSecondary: () => {
      window.location.href = "/all-games.html";
    },
    hint: "Mouse / touch / arrow keys + Enter",
    mark: "play",
  });
  shell.setStatus("Ready to play");
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
    },
  };
}

