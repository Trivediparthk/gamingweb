import {
  COLORS,
  H,
  W,
  clamp,
  fillRoundRect,
  glowCircle,
  randInt,
  strokeRoundRect,
} from "./game-utils.js";

export default function createNeonSnake(shell) {
  const ctx = shell.ctx;
  const cols = 21;
  const rows = 12;
  const cell = 40;
  const offsetX = 60;
  const offsetY = 76;
  const dirs = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  let snake = [];
  let direction = dirs.right;
  let queuedDirection = dirs.right;
  let food = { x: 14, y: 6 };
  let score = 0;
  let tick = 145;
  let accumulator = 0;
  let running = false;
  let paused = false;
  let raf = 0;
  let lastTime = performance.now();

  function randomFood() {
    const free = [];
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (!snake.some((segment) => segment.x === x && segment.y === y)) {
          free.push({ x, y });
        }
      }
    }
    return free.length ? free[randInt(0, free.length - 1)] : { x: 0, y: 0 };
  }

  function updateExtra() {
    shell.setExtra([
      { label: "Length", value: snake.length },
      { label: "Pace", value: `${Math.round(1000 / tick)}/s` },
    ]);
  }

  function reset() {
    snake = [
      { x: 8, y: 6 },
      { x: 7, y: 6 },
      { x: 6, y: 6 },
      { x: 5, y: 6 },
    ];
    direction = dirs.right;
    queuedDirection = dirs.right;
    score = 0;
    tick = 145;
    accumulator = 0;
    paused = false;
    shell.setScore(0);
    shell.setBest(shell.best);
    food = randomFood();
    updateExtra();
    draw(performance.now());
  }

  function setDirection(name) {
    const next = dirs[name];
    if (!next || !running || paused) return;
    if (next.x === -direction.x && next.y === -direction.y) return;
    queuedDirection = next;
  }

  function endGame() {
    running = false;
    paused = false;
    shell.setPaused(false);
    shell.setScore(score, true);
    shell.setStatus("Run ended", "paused");
    shell.showOverlay({
      kicker: "Run complete",
      title: "Line lost.",
      text:
        score > 0
          ? "The trail found its edge. Reset, tighten the corners and go again."
          : "A short first run. Keep the trail clear of the walls and itself.",
      actionLabel: "Run again",
      onAction: start,
      secondaryLabel: "View games",
      onSecondary: () => {
        window.location.href = "/all-games.html";
      },
      showScore: true,
      bestLabel: "Best score",
      hint: `${score} points / ${snake.length} segments`,
      mark: "restart",
    });
    shell.announce(`Run over. Score ${score}.`);
  }

  function step() {
    direction = queuedDirection;
    const head = snake[0];
    const next = { x: head.x + direction.x, y: head.y + direction.y };
    if (
      next.x < 0 ||
      next.x >= cols ||
      next.y < 0 ||
      next.y >= rows ||
      snake.some((segment) => segment.x === next.x && segment.y === next.y)
    ) {
      endGame();
      return;
    }
    snake.unshift(next);
    if (next.x === food.x && next.y === food.y) {
      score += 10;
      tick = Math.max(68, tick - 4);
      shell.setScore(score);
      food = randomFood();
      updateExtra();
    } else {
      snake.pop();
    }
  }

  function cellRect(segment, inset = 4) {
    return {
      x: offsetX + segment.x * cell + inset,
      y: offsetY + segment.y * cell + inset,
      w: cell - inset * 2,
      h: cell - inset * 2,
    };
  }

  function draw(time) {
    ctx.clearRect(0, 0, W, H);
    const background = ctx.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, 600);
    background.addColorStop(0, "#0a1220");
    background.addColorStop(1, COLORS.ink);
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,.045)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x += 1) {
      ctx.beginPath();
      ctx.moveTo(offsetX + x * cell + 0.5, offsetY);
      ctx.lineTo(offsetX + x * cell + 0.5, offsetY + rows * cell);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y += 1) {
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY + y * cell + 0.5);
      ctx.lineTo(offsetX + cols * cell, offsetY + y * cell + 0.5);
      ctx.stroke();
    }
    strokeRoundRect(
      ctx,
      offsetX - 1,
      offsetY - 1,
      cols * cell + 2,
      rows * cell + 2,
      10,
      "rgba(201,255,74,.16)",
      1,
    );
    ctx.restore();

    const pulse = 1 + Math.sin(time / 240) * 0.12;
    const foodX = offsetX + food.x * cell + cell / 2;
    const foodY = offsetY + food.y * cell + cell / 2;
    ctx.save();
    ctx.globalAlpha = 0.18;
    glowCircle(ctx, foodX, foodY, 19 * pulse, COLORS.violet, 28);
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = COLORS.violet;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(foodX, foodY, 15 * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(185,168,255,.35)";
    ctx.beginPath();
    ctx.arc(foodX, foodY, 22 * pulse, 0.4, Math.PI * 1.4);
    ctx.stroke();
    glowCircle(ctx, foodX, foodY, 5.5, COLORS.violetSoft, 16);
    ctx.restore();

    const head = snake[0];
    snake.forEach((segment, index) => {
      const rect = cellRect(segment, index === 0 ? 3 : 4.5);
      const t = index / Math.max(1, snake.length - 1);
      ctx.save();
      ctx.shadowColor = index < 5 ? COLORS.lime : "transparent";
      ctx.shadowBlur = index === 0 ? 22 : index < 5 ? 10 : 0;
      fillRoundRect(
        ctx,
        rect.x,
        rect.y,
        rect.w,
        rect.h,
        index === 0 ? 11 : 8,
        index === 0 ? COLORS.limeSoft : `rgba(201,255,74,${clamp(0.88 - t * 0.55, 0.18, 0.9)})`,
      );
      ctx.restore();
      if (index === 0) {
        ctx.save();
        ctx.fillStyle = "#07100a";
        const eyeOffsetX = direction.x * 5;
        const eyeOffsetY = direction.y * 5;
        const sideX = direction.y * 5;
        const sideY = direction.x * 5;
        ctx.beginPath();
        ctx.arc(rect.x + rect.w / 2 + eyeOffsetX + sideX, rect.y + rect.h / 2 + eyeOffsetY - sideY, 2.2, 0, Math.PI * 2);
        ctx.arc(rect.x + rect.w / 2 + eyeOffsetX - sideX, rect.y + rect.h / 2 + eyeOffsetY + sideY, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    if (!running && !paused && shell.overlayVisible()) {
      ctx.save();
      ctx.strokeStyle = "rgba(201,255,74,.18)";
      ctx.setLineDash([4, 9]);
      ctx.strokeRect(offsetX - 10, offsetY - 10, cols * cell + 20, rows * cell + 20);
      ctx.restore();
    }

    if (paused) {
      ctx.save();
      ctx.fillStyle = "rgba(4,7,13,.32)";
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
  }

  function start() {
    reset();
    running = true;
    paused = false;
    shell.setPaused(false);
    shell.setStatus("In play", "playing");
    shell.announce("Neon Snake started. Use arrow keys or swipe to steer.");
    lastTime = performance.now();
  }

  function pause() {
    if (!running) return;
    if (paused) {
      paused = false;
      shell.setPaused(false);
      shell.hideOverlay();
      lastTime = performance.now();
      shell.setStatus("In play", "playing");
    } else {
      paused = true;
      shell.setPaused(true);
      shell.showOverlay({
        kicker: "Game paused",
        title: "Take a breath.",
        text: "The trail will wait. Resume when you are ready, or start a fresh run.",
        actionLabel: "Resume",
        onAction: () => {
          paused = false;
          shell.setPaused(false);
          lastTime = performance.now();
          shell.setStatus("In play", "playing");
        },
        secondaryLabel: "Restart",
        onSecondary: start,
        mark: "pause",
      });
    }
  }

  shell.onKey((event) => {
    const keyMap = {
      ArrowUp: "up",
      w: "up",
      W: "up",
      ArrowDown: "down",
      s: "down",
      S: "down",
      ArrowLeft: "left",
      a: "left",
      A: "left",
      ArrowRight: "right",
      d: "right",
      D: "right",
    };
    if (keyMap[event.key]) {
      event.preventDefault();
      setDirection(keyMap[event.key]);
    }
  });
  shell.enableSwipe(setDirection);
  shell.enableDpad(setDirection);
  shell.setPauseHandler(pause);
  shell.setRestartHandler(start);

  function frame(now) {
    const delta = Math.min(now - lastTime, 60);
    lastTime = now;
    if (running && !paused) {
      accumulator += delta;
      while (accumulator >= tick && running) {
        step();
        accumulator -= tick;
      }
    }
    draw(now);
    raf = requestAnimationFrame(frame);
  }

  reset();
  shell.showOverlay({
    kicker: "Arcade / Classic / 001",
    title: "Neon Snake",
    text: "Collect light nodes. Grow the trail. Keep your line out of the walls and out of its own way.",
    actionLabel: "Start run",
    onAction: start,
    secondaryLabel: "All games",
    onSecondary: () => {
      window.location.href = "/all-games.html";
    },
    hint: "Arrow keys / WASD / swipe to steer",
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
