import {
  COLORS,
  H,
  W,
  clamp,
  fillRoundRect,
  randInt,
  strokeRoundRect,
} from "./game-utils.js";

export default function createNumberMerge(shell) {
  const ctx = shell.ctx;
  const boardSize = 470;
  const boardX = (W - boardSize) / 2;
  const boardY = 104;
  const padding = 16;
  const gap = 10;
  const tileSize = (boardSize - padding * 2 - gap * 3) / 4;

  let board = [];
  let score = 0;
  let moves = 0;
  let bestTile = 0;
  let running = false;
  let paused = false;
  let inputLocked = false;
  let hasWon = false;
  let raf = 0;
  let lastTime = performance.now();
  let pulse = 0;
  let boardGlow = 0;
  let mergedCells = new Set();
  let spawnCell = -1;
  let spawnAt = 0;
  let mergeAt = 0;

  const themes = {
    2: { bg: "#131e31", fg: "#c8ff77", border: "rgba(201,255,74,.25)" },
    4: { bg: "#1b2b44", fg: "#ddffb0", border: "rgba(201,255,74,.3)" },
    8: { bg: "#a5dc35", fg: "#07100a", border: "#c9ff4a" },
    16: { bg: "#c9ff4a", fg: "#07100a", border: "#e0ff90" },
    32: { bg: "#58e5ff", fg: "#04131a", border: "#a6f2ff" },
    64: { bg: "#35b9d6", fg: "#040d12", border: "#87ebff" },
    128: { bg: "#8c70ff", fg: "#fff", border: "#b9a8ff" },
    256: { bg: "#6e50eb", fg: "#fff", border: "#a997ff" },
    512: { bg: "#b34dff", fg: "#fff", border: "#d29dff" },
    1024: { bg: "#ff8666", fg: "#180906", border: "#ffb8a4" },
    2048: { bg: "#c9ff4a", fg: "#07100a", border: "#f0ffc7" },
    4096: { bg: "#f3f6e9", fg: "#07100a", border: "#fff" },
  };

  function themeFor(value) {
    return themes[value] || { bg: "#f3f6e9", fg: "#07100a", border: "#fff" };
  }

  function emptyBoard() {
    return Array.from({ length: 4 }, () => [0, 0, 0, 0]);
  }

  function cellRect(row, col) {
    return {
      x: boardX + padding + col * (tileSize + gap),
      y: boardY + padding + row * (tileSize + gap),
      w: tileSize,
      h: tileSize,
    };
  }

  function randomEmpty() {
    const empties = [];
    board.forEach((row, rowIndex) =>
      row.forEach((value, colIndex) => {
        if (value === 0) empties.push({ row: rowIndex, col: colIndex });
      }),
    );
    return empties.length ? empties[randInt(0, empties.length - 1)] : null;
  }

  function addTile(value = Math.random() > 0.9 ? 4 : 2) {
    const empty = randomEmpty();
    if (!empty) return null;
    board[empty.row][empty.col] = value;
    bestTile = Math.max(bestTile, value);
    spawnCell = empty.row * 4 + empty.col;
    spawnAt = performance.now();
    return empty;
  }

  function updateHud() {
    shell.setScore(score);
    shell.setExtra([
      { label: "Moves", value: moves },
      { label: "Top tile", value: bestTile },
    ]);
  }

  function hasMoves() {
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        if (board[row][col] === 0) return true;
        if (col < 3 && board[row][col] === board[row][col + 1]) return true;
        if (row < 3 && board[row][col] === board[row + 1][col]) return true;
      }
    }
    return false;
  }

  function mergeLine(line) {
    const values = line.filter((value) => value !== 0);
    const result = [];
    let gained = 0;
    let merged = false;
    for (let i = 0; i < values.length; i += 1) {
      if (values[i] === values[i + 1]) {
        const mergedValue = values[i] * 2;
        result.push(mergedValue);
        gained += mergedValue;
        bestTile = Math.max(bestTile, mergedValue);
        merged = true;
        i += 1;
      } else {
        result.push(values[i]);
      }
    }
    while (result.length < 4) result.push(0);
    return { line: result, gained, merged };
  }

  function move(direction) {
    if (!running || paused || inputLocked) return;
    const before = JSON.stringify(board);
    let gained = 0;
    mergedCells.clear();
    spawnCell = -1;

    if (direction === "left" || direction === "right") {
      for (let row = 0; row < 4; row += 1) {
        let line = board[row];
        if (direction === "right") line = [...line].reverse();
        const result = mergeLine(line);
        const output = direction === "right" ? [...result.line].reverse() : result.line;
        board[row] = output;
        gained += result.gained;
        if (result.merged) {
          output.forEach((value, col) => {
            if (value !== 0) mergedCells.add(row * 4 + col);
          });
        }
      }
    } else {
      for (let col = 0; col < 4; col += 1) {
        let line = [board[0][col], board[1][col], board[2][col], board[3][col]];
        if (direction === "down") line = line.reverse();
        const result = mergeLine(line);
        const output = direction === "down" ? [...result.line].reverse() : result.line;
        output.forEach((value, row) => {
          board[row][col] = value;
          if (result.merged && value !== 0) mergedCells.add(row * 4 + col);
        });
        gained += result.gained;
      }
    }

    if (JSON.stringify(board) === before) return;

    score += gained;
    moves += 1;
    mergeAt = performance.now();
    boardGlow = Math.min(1, 0.35 + gained / 128);
    shell.setScore(score, true);
    addTile();
    updateHud();

    if (board.flat().includes(2048) && !hasWon) {
      hasWon = true;
      inputLocked = true;
      shell.setScore(score, true);
      shell.showOverlay({
        kicker: "2048 reached",
        title: "Power grid.",
        text: "You built the 2048 tile. The board is still yours — continue for a higher score or start a fresh run.",
        actionLabel: "Keep playing",
        onAction: () => {
          inputLocked = false;
          shell.setStatus("Keep merging", "playing");
        },
        secondaryLabel: "New board",
        onSecondary: start,
        showScore: true,
        bestLabel: "Best score",
        hint: `Top tile ${bestTile}`,
        mark: "check",
      });
      shell.setStatus("2048 reached", "playing");
      shell.announce(`2048 reached with a score of ${score}.`);
      return;
    }

    if (!hasMoves()) {
      running = false;
      shell.setPaused(false);
      shell.setScore(score, true);
      shell.setStatus("No moves left", "paused");
      shell.showOverlay({
        kicker: "Board locked",
        title: "No moves left.",
        text: "Every direction is blocked. Take the score, reset the grid and build a different path.",
        actionLabel: "New board",
        onAction: start,
        secondaryLabel: "All games",
        onSecondary: () => {
          window.location.href = "/all-games.html";
        },
        showScore: true,
        bestLabel: "Best score",
        hint: `Top tile ${bestTile} / ${moves} moves`,
        mark: "restart",
      });
      shell.announce(`No moves left. Final score ${score}.`);
    } else {
      shell.setStatus("Keep merging", "playing");
    }
  }

  function drawTile(row, col, value, now) {
    const rect = cellRect(row, col);
    const index = row * 4 + col;
    const theme = themeFor(value);
    const isMerged = mergedCells.has(index);
    const isSpawn = spawnCell === index;
    const spawnProgress = clamp((now - spawnAt) / 220, 0, 1);
    const mergeProgress = clamp((now - mergeAt) / 240, 0, 1);
    const scale = isSpawn
      ? 0.78 + spawnProgress * 0.22
      : isMerged
        ? 1 + Math.sin(mergeProgress * Math.PI) * 0.045
        : 1;

    ctx.save();
    ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
    ctx.scale(scale, scale);

    if (value >= 128) {
      ctx.shadowColor = theme.border;
      ctx.shadowBlur = 16;
    }
    const gradient = ctx.createLinearGradient(0, -rect.h / 2, 0, rect.h / 2);
    gradient.addColorStop(0, theme.bg);
    gradient.addColorStop(1, value <= 4 ? "#0b1421" : theme.bg);
    fillRoundRect(ctx, -rect.w / 2, -rect.h / 2, rect.w, rect.h, 10, gradient);
    strokeRoundRect(
      ctx,
      -rect.w / 2 + 0.5,
      -rect.h / 2 + 0.5,
      rect.w - 1,
      rect.h - 1,
      10,
      theme.border,
      1,
    );
    ctx.save();
    ctx.globalAlpha = 0.18;
    fillRoundRect(ctx, -rect.w / 2 + 8, -rect.h / 2 + 8, rect.w - 16, 12, 6, "#ffffff");
    ctx.restore();

    const digits = String(value).length;
    const fontSize = digits <= 2 ? 44 : digits === 3 ? 36 : digits === 4 ? 30 : 25;
    ctx.fillStyle = theme.fg;
    ctx.font = `600 ${fontSize}px Bahnschrift, Arial Narrow, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(value), 0, 3);
    ctx.restore();
  }

  function draw(now) {
    pulse = now / 1000;
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 620);
    bg.addColorStop(0, "#0d1625");
    bg.addColorStop(1, COLORS.ink);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.strokeStyle = "rgba(201,255,74,.06)";
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 270 + i * 38, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    if (boardGlow > 0) {
      ctx.shadowColor = COLORS.lime;
      ctx.shadowBlur = boardGlow * 40;
    }
    fillRoundRect(ctx, boardX, boardY, boardSize, boardSize, 20, "#080f1a");
    ctx.restore();
    strokeRoundRect(
      ctx,
      boardX + 0.5,
      boardY + 0.5,
      boardSize - 1,
      boardSize - 1,
      20,
      "rgba(255,255,255,.11)",
      1,
    );

    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const rect = cellRect(row, col);
        fillRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10, "rgba(255,255,255,.028)");
        if (board[row][col] !== 0) drawTile(row, col, board[row][col], now);
      }
    }

    boardGlow = Math.max(0, boardGlow - 0.018);

    if (hasWon) {
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = COLORS.lime;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("2048 REACHED / KEEP GOING", W / 2, boardY + boardSize + 27);
      ctx.restore();
    }
  }

  function start() {
    board = emptyBoard();
    score = 0;
    moves = 0;
    bestTile = 0;
    hasWon = false;
    inputLocked = false;
    running = true;
    paused = false;
    mergedCells.clear();
    spawnCell = -1;
    addTile(2);
    addTile(2);
    shell.setPaused(false);
    shell.setScore(0);
    shell.setStatus("Keep merging", "playing");
    updateHud();
    lastTime = performance.now();
    shell.announce("Number Merge started. Use arrow keys or swipe to slide the tiles.");
  }

  function pause() {
    if (!running) return;
    if (paused) {
      paused = false;
      shell.setPaused(false);
      shell.hideOverlay();
      lastTime = performance.now();
      shell.setStatus("Keep merging", "playing");
    } else {
      paused = true;
      shell.setPaused(true);
      shell.showOverlay({
        kicker: "Board paused",
        title: "Think it through.",
        text: "The grid is exactly as you left it.",
        actionLabel: "Resume",
        onAction: () => {
          paused = false;
          shell.setPaused(false);
          lastTime = performance.now();
          shell.setStatus("Keep merging", "playing");
        },
        secondaryLabel: "New board",
        onSecondary: start,
        mark: "pause",
      });
    }
  }

  shell.onKey((event) => {
    const map = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
      a: "left",
      A: "left",
      d: "right",
      D: "right",
      w: "up",
      W: "up",
      s: "down",
      S: "down",
    };
    if (map[event.key]) {
      event.preventDefault();
      move(map[event.key]);
    }
  });
  shell.enableSwipe(move);
  shell.setPauseHandler(pause);
  shell.setRestartHandler(start);

  function frame(now) {
    if (running && !paused) {
      lastTime = now;
    }
    draw(now);
    raf = requestAnimationFrame(frame);
  }

  board = emptyBoard();
  board[1][1] = 2;
  board[2][2] = 2;
  bestTile = 2;
  updateHud();
  shell.showOverlay({
    kicker: "Puzzle / Strategy / 005",
    title: "Number Merge",
    text: "Slide the grid, combine equal tiles and build a single tile worth 2048. Every move counts.",
    actionLabel: "Start merging",
    onAction: start,
    secondaryLabel: "All games",
    onSecondary: () => {
      window.location.href = "/all-games.html";
    },
    hint: "Arrow keys / WASD / swipe",
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
