import {
  COLORS,
  H,
  W,
  clamp,
  fillRoundRect,
  randInt,
  strokeRoundRect,
} from "./game-utils.js";

export default function createLogicTiles(shell) {
  const ctx = shell.ctx;
  const levels = [4, 5, 6];
  const boardMax = 456;
  const boardX = (W - boardMax) / 2;
  const boardY = 82;

  let levelIndex = 0;
  let size = levels[0];
  let board = [];
  let pulses = [];
  let cursor = 0;
  let keyboardMode = false;
  let hover = -1;
  let moves = 0;
  let levelMoves = 0;
  let running = false;
  let paused = false;
  let clearing = false;
  let clearTimer = 0;
  let completed = false;
  let raf = 0;
  let lastTime = performance.now();
  let levelFlash = 0;

  function cellMetrics() {
    const gap = size === 6 ? 8 : size === 5 ? 10 : 12;
    const cell = (boardMax - gap * (size - 1)) / size;
    return { cell, gap };
  }

  function cellRect(index) {
    const { cell, gap } = cellMetrics();
    const row = Math.floor(index / size);
    const col = index % size;
    return {
      x: boardX + col * (cell + gap),
      y: boardY + row * (cell + gap),
      w: cell,
      h: cell,
    };
  }

  function litCount() {
    return board.filter(Boolean).length;
  }

  function updateHud() {
    shell.setScore(moves);
    shell.setExtra([
      { label: "Level", value: `${levelIndex + 1}/${levels.length}` },
      { label: "Lights", value: litCount() },
    ]);
  }

  function toggleAt(index) {
    const row = Math.floor(index / size);
    const col = index % size;
    const targets = [
      [row, col],
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];
    targets.forEach(([r, c]) => {
      if (r < 0 || r >= size || c < 0 || c >= size) return;
      const targetIndex = r * size + c;
      board[targetIndex] = !board[targetIndex];
      pulses[targetIndex] = 1;
    });
    levelFlash = 0.35;
  }

  function select(index) {
    if (!running || paused || clearing || completed) return;
    if (index < 0 || index >= board.length) return;
    cursor = index;
    toggleAt(index);
    moves += 1;
    levelMoves += 1;
    shell.setScore(moves);
    updateHud();

    if (litCount() === 0) {
      clearing = true;
      clearTimer = 1.15;
      shell.setStatus("Sector cleared", "playing");
      shell.announce(`Level ${levelIndex + 1} cleared in ${levelMoves} moves.`);
    }
  }

  function levelClear() {
    if (levelIndex < levels.length - 1) {
      levelIndex += 1;
      levelMoves = 0;
      loadLevel();
      clearing = false;
      shell.setStatus(`Level ${levelIndex + 1}`, "playing");
      shell.announce(`Level ${levelIndex + 1} started. The grid is now ${size} by ${size}.`);
    } else {
      completed = true;
      running = false;
      shell.setPaused(false);
      shell.setScore(moves, true);
      shell.setStatus("Arc complete", "paused");
      shell.showOverlay({
        kicker: "All sectors clear",
        title: "Logic complete.",
        text: "Three grids, every light off. The best players do it in fewer moves — the move count is your score.",
        actionLabel: "Play the arc again",
        onAction: start,
        secondaryLabel: "All games",
        onSecondary: () => {
          window.location.href = "/all-games.html";
        },
        showScore: true,
        scoreLabel: "Total moves",
        bestLabel: "Best moves",
        hint: "Three levels / every light switched off",
        mark: "check",
      });
      shell.announce(`All levels complete in ${moves} moves.`);
    }
  }

  function generatePuzzle(order) {
    const total = order * order;
    let generated;
    do {
      generated = Array(total).fill(false);
      const scrambleCount = order * 2 + 3;
      for (let i = 0; i < scrambleCount; i += 1) {
        const index = randInt(0, total - 1);
        const row = Math.floor(index / order);
        const col = index % order;
        [
          [row, col],
          [row - 1, col],
          [row + 1, col],
          [row, col - 1],
          [row, col + 1],
        ].forEach(([r, c]) => {
          if (r >= 0 && r < order && c >= 0 && c < order) {
            const target = r * order + c;
            generated[target] = !generated[target];
          }
        });
      }
    } while (!generated.some(Boolean));
    return generated;
  }

  function loadLevel() {
    size = levels[levelIndex];
    board = generatePuzzle(size);
    pulses = Array(size * size).fill(0);
    cursor = Math.floor((size * size) / 2);
    hover = -1;
    levelFlash = 0.5;
    updateHud();
  }

  function moveCursor(dx, dy) {
    keyboardMode = true;
    const row = Math.floor(cursor / size);
    const col = cursor % size;
    cursor = clamp(row + dy, 0, size - 1) * size + clamp(col + dx, 0, size - 1);
  }

  function update(dt) {
    if (!running || paused) return;
    pulses = pulses.map((value) => Math.max(0, value - dt * 3.2));
    levelFlash = Math.max(0, levelFlash - dt);
    if (clearing) {
      clearTimer -= dt;
      if (clearTimer <= 0) levelClear();
    }
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W / 2, H / 2, 90, W / 2, H / 2, 630);
    bg.addColorStop(0, "#10132a");
    bg.addColorStop(1, COLORS.ink);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.strokeStyle = "rgba(140,112,255,.08)";
    for (let i = 0; i < 22; i += 1) {
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 130 + i * 19, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    const { cell, gap } = cellMetrics();
    fillRoundRect(ctx, boardX - 16, boardY - 16, boardMax + 32, boardMax + 32, 16, "rgba(6,10,18,.55)");
    strokeRoundRect(
      ctx,
      boardX - 15.5,
      boardY - 15.5,
      boardMax + 31,
      boardMax + 31,
      16,
      "rgba(255,255,255,.08)",
      1,
    );

    for (let row = 0; row < size; row += 1) {
      for (let col = 0; col < size; col += 1) {
        const index = row * size + col;
        const rect = cellRect(index);
        const on = board[index];
        const pulse = pulses[index] || 0;
        const isCursor = keyboardMode && cursor === index && running;
        const isHover = hover === index;

        ctx.save();
        ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
        const scale = 1 + pulse * 0.05;
        ctx.scale(scale, scale);

        if (on) {
          const gradient = ctx.createLinearGradient(-rect.w / 2, -rect.h / 2, rect.w / 2, rect.h / 2);
          gradient.addColorStop(0, COLORS.violetSoft);
          gradient.addColorStop(1, COLORS.violet);
          ctx.shadowColor = COLORS.violet;
          ctx.shadowBlur = 18 + pulse * 18;
          fillRoundRect(ctx, -rect.w / 2, -rect.h / 2, rect.w, rect.h, cell * 0.12, gradient);
          ctx.shadowBlur = 0;
          strokeRoundRect(
            ctx,
            -rect.w / 2 + 0.5,
            -rect.h / 2 + 0.5,
            rect.w - 1,
            rect.h - 1,
            cell * 0.12,
            "rgba(255,255,255,.25)",
            1,
          );
          ctx.save();
          ctx.strokeStyle = "rgba(8,6,20,.32)";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(-cell * 0.18, -cell * 0.18);
          ctx.lineTo(cell * 0.18, cell * 0.18);
          ctx.moveTo(cell * 0.18, -cell * 0.18);
          ctx.lineTo(-cell * 0.18, cell * 0.18);
          ctx.stroke();
          ctx.restore();
        } else {
          const gradient = ctx.createLinearGradient(-rect.w / 2, -rect.h / 2, rect.w / 2, rect.h / 2);
          gradient.addColorStop(0, "#101a2b");
          gradient.addColorStop(1, "#0a111d");
          fillRoundRect(ctx, -rect.w / 2, -rect.h / 2, rect.w, rect.h, cell * 0.12, gradient);
          strokeRoundRect(
            ctx,
            -rect.w / 2 + 0.5,
            -rect.h / 2 + 0.5,
            rect.w - 1,
            rect.h - 1,
            cell * 0.12,
            isHover ? "rgba(201,255,74,.36)" : "rgba(255,255,255,.08)",
            1,
          );
          ctx.save();
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = COLORS.lime;
          ctx.beginPath();
          ctx.arc(0, 0, Math.max(2, cell * 0.035), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        if (isCursor) {
          ctx.save();
          ctx.strokeStyle = COLORS.lime;
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.5;
          ctx.strokeRect(-rect.w / 2 - 5, -rect.h / 2 - 5, rect.w + 10, rect.h + 10);
          ctx.restore();
        }
        ctx.restore();
      }
    }

    if (clearing) {
      ctx.save();
      ctx.fillStyle = "rgba(4,7,13,.42)";
      ctx.fillRect(boardX - 16, boardY - 16, boardMax + 32, boardMax + 32);
      ctx.fillStyle = COLORS.lime;
      ctx.font = "600 34px Bahnschrift, Arial Narrow, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(levelIndex === levels.length - 1 ? "ARC COMPLETE" : "SECTOR CLEAR", W / 2, H / 2 + 8);
      ctx.fillStyle = "rgba(255,255,255,.5)";
      ctx.font = "10px monospace";
      ctx.fillText(`LEVEL ${levelIndex + 1} / ${levels.length}`, W / 2, H / 2 + 38);
      ctx.restore();
    }

    if (levelFlash > 0) {
      ctx.save();
      ctx.globalAlpha = levelFlash * 0.09;
      ctx.fillStyle = COLORS.violet;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    void now;
    void gap;
  }

  function indexAt(x, y) {
    for (let index = 0; index < board.length; index += 1) {
      const rect = cellRect(index);
      if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
        return index;
      }
    }
    return -1;
  }

  function start() {
    levelIndex = 0;
    moves = 0;
    levelMoves = 0;
    clearing = false;
    completed = false;
    running = true;
    paused = false;
    keyboardMode = false;
    shell.setPaused(false);
    shell.setScore(0);
    loadLevel();
    shell.setStatus("Switch every light off", "playing");
    lastTime = performance.now();
    shell.announce("Logic Tiles started. Each tile toggles itself and its neighbours. Turn every light off.");
  }

  function pause() {
    if (!running) return;
    if (paused) {
      paused = false;
      shell.setPaused(false);
      shell.hideOverlay();
      lastTime = performance.now();
      shell.setStatus("Switch every light off", "playing");
    } else {
      paused = true;
      shell.setPaused(true);
      shell.showOverlay({
        kicker: "Puzzle paused",
        title: "Think in crosses.",
        text: "Selecting a tile flips it and the four tiles directly beside it.",
        actionLabel: "Resume",
        onAction: () => {
          paused = false;
          shell.setPaused(false);
          lastTime = performance.now();
          shell.setStatus("Switch every light off", "playing");
        },
        secondaryLabel: "Restart",
        onSecondary: start,
        mark: "pause",
      });
    }
  }

  shell.onPointer((x, y) => {
    keyboardMode = false;
    const index = indexAt(x, y);
    if (index >= 0) select(index);
  });
  shell.onPointerMove((x, y) => {
    hover = indexAt(x, y);
  });
  shell.onKey((event) => {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      const map = {
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
      };
      moveCursor(...map[event.key]);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(cursor);
    }
  });
  shell.setPauseHandler(pause);
  shell.setRestartHandler(start);

  function frame(now) {
    const delta = Math.min((now - lastTime) / 1000, 0.04);
    lastTime = now;
    update(delta);
    draw(now);
    raf = requestAnimationFrame(frame);
  }

  size = levels[0];
  board = generatePuzzle(size);
  pulses = Array(size * size).fill(0);
  cursor = Math.floor((size * size) / 2);
  updateHud();
  shell.showOverlay({
    kicker: "Strategy / Puzzle / 010",
    title: "Logic Tiles",
    text: "Turn every light off. Selecting a tile flips it and the four adjacent tiles. Clear three grids, each larger than the last.",
    actionLabel: "Start logic",
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
