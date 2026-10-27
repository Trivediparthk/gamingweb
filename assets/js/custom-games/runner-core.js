import {
  COLORS,
  H,
  W,
  clamp,
  fillRoundRect,
  lerp,
  rand,
  randInt,
  shuffle,
} from "./game-utils.js";

const PLAYER_Z = 0.9;
const COLLIDE_MIN = 0.83;
const COLLIDE_MAX = 1.02;

/**
 * Shared, original three-lane endless-runner engine.
 * Jungle Dash and Metro Sprint provide their own environment, obstacle and
 * character drawing while sharing movement, collision and scoring logic.
 */
export function createRunnerGame(shell, config) {
  const ctx = shell.ctx;
  const horizonY = config.horizonY ?? 176;
  const bottomY = config.bottomY ?? 558;
  const centreX = W / 2;
  const jumpDuration = config.jumpDuration ?? 0.8;
  const slideDuration = config.slideDuration ?? 0.62;
  const jumpPeak = config.jumpPeak ?? 112;

  let running = false;
  let paused = false;
  let ended = false;
  let elapsed = 0;
  let distance = 0;
  let coins = 0;
  let score = 0;
  let speed = config.speedStart ?? 0.32;
  let spawnClock = 1.1;
  let coinClock = 0.75;
  let lastShownScore = -1;
  let lastShownDistance = -1;
  let jumpTimer = 0;
  let slideTimer = 0;
  let lane = 1;
  let lanePos = 1;
  let jumpHeight = 0;
  let crashFlash = 0;
  let dustClock = 0;
  let raf = 0;
  let lastTime = performance.now();

  let obstacles = [];
  let coinObjects = [];
  let particles = [];

  const project = (laneIndex, z) => {
    const safeZ = clamp(z, 0, 1.12);
    const t = Math.pow(safeZ, 1.22);
    const spacing = 154 * (0.08 + 0.92 * t);
    const scale = 0.17 + 0.83 * t;
    return {
      x: centreX + laneIndex * spacing,
      y: horizonY + (bottomY - horizonY) * t,
      scale,
      spacing,
      roadHalf: spacing * 1.58,
      t,
    };
  };

  const reset = () => {
    running = false;
    paused = false;
    ended = false;
    elapsed = 0;
    distance = 0;
    coins = 0;
    score = 0;
    speed = config.speedStart ?? 0.32;
    spawnClock = 0.9;
    coinClock = 0.65;
    jumpTimer = 0;
    slideTimer = 0;
    lane = 1;
    lanePos = 1;
    jumpHeight = 0;
    crashFlash = 0;
    dustClock = 0;
    lastShownScore = -1;
    lastShownDistance = -1;
    obstacles = [];
    coinObjects = [];
    particles = [];
    shell.setScore(0);
    updateHud();
  };

  const updateHud = () => {
    const roundedDistance = Math.floor(distance);
    const nextScore = roundedDistance + coins * 25;
    if (nextScore !== lastShownScore) {
      lastShownScore = nextScore;
      score = nextScore;
      shell.setScore(nextScore);
    }
    if (roundedDistance !== lastShownDistance) {
      lastShownDistance = roundedDistance;
      shell.setExtra([
        { label: "Distance", value: `${roundedDistance} m` },
        { label: "Coins", value: coins },
      ]);
    }
  };

  const resetHud = () => {
    lastShownScore = -1;
    lastShownDistance = -1;
    updateHud();
  };

  const chooseObstacleType = () => {
    const roll = Math.random();
    if (roll < 0.46) return "low";
    if (roll < 0.78) return "high";
    return "block";
  };

  const spawnObstaclePattern = () => {
    const difficulty = clamp(elapsed / 70, 0, 1);
    const count = elapsed > 12 && Math.random() < 0.18 + difficulty * 0.18 ? 2 : 1;
    const lanes = shuffle([0, 1, 2]).slice(0, count);
    lanes.forEach((laneIndex, index) => {
      obstacles.push({
        lane: laneIndex,
        z: 0.015 + index * 0.012,
        type: chooseObstacleType(),
        phase: rand(0, Math.PI * 2),
      });
    });
    spawnClock = clamp(1.28 - difficulty * 0.48, 0.66, 1.28) * rand(0.86, 1.16);
  };

  const spawnCoinLine = () => {
    const laneIndex = randInt(0, 2);
    const count = randInt(3, 5);
    for (let index = 0; index < count; index += 1) {
      coinObjects.push({
        lane: laneIndex,
        z: 0.012 + index * 0.07,
        collected: false,
        phase: rand(0, Math.PI * 2),
      });
    }
    coinClock = rand(1.15, 1.8);
  };

  const spawnParticles = (x, y, color, count = 12, strength = 110) => {
    for (let index = 0; index < count; index += 1) {
      particles.push({
        x,
        y,
        vx: rand(-strength, strength),
        vy: rand(-strength * 1.2, -16),
        life: rand(0.25, 0.7),
        max: 0.7,
        size: rand(1.5, 4),
        color,
      });
    }
  };

  const updateParticles = (dt) => {
    particles.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 260 * dt;
      particle.life -= dt;
    });
    particles = particles.filter((particle) => particle.life > 0);
  };

  const showGameOver = () => {
    if (!running && ended) return;
    running = false;
    paused = false;
    ended = true;
    crashFlash = 1;
    shell.setPaused(false);
    shell.setScore(score, true);
    shell.setStatus("Run ended", "paused");
    shell.showOverlay({
      kicker: config.overKicker || "Run complete",
      title: config.overTitle || "Trail lost.",
      text: config.overText || "A clean route is built one safe choice at a time.",
      actionLabel: "Run again",
      onAction: start,
      secondaryLabel: "All games",
      onSecondary: () => {
        window.location.href = "/all-games.html";
      },
      showScore: true,
      bestLabel: "Best score",
      hint: `${Math.floor(distance)} m / ${coins} coins collected`,
      mark: "restart",
    });
    shell.announce(`Run ended at ${Math.floor(distance)} metres. Score ${score}.`);
  };

  const die = () => {
    if (running) showGameOver();
  };

  const collectCoin = (coin, screen) => {
    coin.collected = true;
    coins += 1;
    score = Math.floor(distance) + coins * 25;
    spawnParticles(screen.x, screen.y - 20 * screen.scale, config.palette.coinBurst, 9, 80);
    shell.setScore(score);
    updateHud();
  };

  const handleCollision = (obstacle, screen) => {
    if (obstacle.lane !== lane) return;
    if (obstacle.type === "low" && jumpHeight > 38) return;
    if (obstacle.type === "high" && slideTimer > 0) return;
    if (obstacle.type === "block") {
      // A tall obstacle cannot be cleared with the current move set.
    }
    spawnParticles(screen.x, screen.y - 18 * screen.scale, config.palette.impact, 22, 160);
    die();
  };

  const inputLane = (direction) => {
    if (!running || paused) return;
    lane = clamp(lane + direction, 0, 2);
  };

  const inputJump = () => {
    if (!running || paused) return;
    if (jumpTimer > 0) return;
    slideTimer = 0;
    jumpTimer = jumpDuration;
  };

  const inputSlide = () => {
    if (!running || paused) return;
    if (jumpTimer > 0) return;
    slideTimer = slideDuration;
  };

  const togglePause = () => {
    if (!running) return;
    if (paused) {
      paused = false;
      shell.setPaused(false);
      shell.hideOverlay();
      lastTime = performance.now();
      shell.setStatus("In play", "playing");
      return;
    }
    paused = true;
    shell.setPaused(true);
    shell.showOverlay({
      kicker: "Run paused",
      title: config.pauseTitle || "Take a breath.",
      text: config.pauseText || "The route will wait. Keep an eye on the open lane.",
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
  };

  function start() {
    reset();
    shell.hideOverlay();
    running = true;
    paused = false;
    shell.setPaused(false);
    shell.setStatus("In play", "playing");
    lastTime = performance.now();
    shell.announce(
      `${config.title} started. Switch lanes, jump low obstacles and slide under high ones.`,
    );
  }

  const update = (dt) => {
    elapsed += dt;
    speed = lerp(
      config.speedStart ?? 0.32,
      config.speedMax ?? 0.8,
      clamp(elapsed / (config.rampSeconds ?? 75), 0, 1),
    );
    distance += speed * dt * 19;

    lanePos = lerp(lanePos, lane, 1 - Math.exp(-10 * dt));
    jumpTimer = Math.max(0, jumpTimer - dt);
    slideTimer = Math.max(0, slideTimer - dt);
    const jumpProgress = jumpTimer > 0 ? 1 - jumpTimer / jumpDuration : 0;
    jumpHeight =
      jumpTimer > 0 ? Math.sin(jumpProgress * Math.PI) * jumpPeak : 0;
    crashFlash = Math.max(0, crashFlash - dt * 4);

    spawnClock -= dt;
    if (spawnClock <= 0) spawnObstaclePattern();

    coinClock -= dt;
    if (coinClock <= 0) spawnCoinLine();

    obstacles.forEach((obstacle) => {
      obstacle.z += speed * dt;
    });
    coinObjects.forEach((coin) => {
      coin.z += speed * dt;
    });

    obstacles.forEach((obstacle) => {
      if (obstacle.z > COLLIDE_MIN && obstacle.z < COLLIDE_MAX) {
        const screen = project(obstacle.lane, obstacle.z);
        handleCollision(obstacle, screen);
      }
    });
    if (!running) return;

    coinObjects.forEach((coin) => {
      if (
        !coin.collected &&
        coin.lane === lane &&
        coin.z > COLLIDE_MIN &&
        coin.z < COLLIDE_MAX
      ) {
        collectCoin(coin, project(coin.lane, coin.z));
      }
    });

    obstacles = obstacles.filter((obstacle) => obstacle.z < 1.15);
    coinObjects = coinObjects.filter((coin) => coin.z < 1.12 && !coin.collected);

    updateParticles(dt);

    dustClock -= dt;
    if (dustClock <= 0) {
      dustClock = 0.065;
      const foot = project(lanePos, PLAYER_Z);
      if (jumpHeight < 12) {
        particles.push({
          x: foot.x + rand(-16, 16),
          y: foot.y - rand(0, 5),
          vx: rand(-25, 25),
          vy: rand(-34, -10),
          life: rand(0.22, 0.46),
          max: 0.46,
          size: rand(1, 3),
          color: config.palette.dust,
        });
      }
    }

    updateHud();
  };

  const drawRoad = (state) => {
    const far = project(0, 0);
    const near = project(0, 1);
    const farLeft = project(-1.5, 0);
    const farRight = project(1.5, 0);
    const nearLeft = project(-1.5, 1);
    const nearRight = project(1.5, 1);

    const roadGradient = ctx.createLinearGradient(0, far.y, 0, near.y);
    roadGradient.addColorStop(0, config.palette.roadTop);
    roadGradient.addColorStop(1, config.palette.roadBottom);
    ctx.beginPath();
    ctx.moveTo(farLeft.x, farLeft.y);
    ctx.lineTo(farRight.x, farRight.y);
    ctx.lineTo(nearRight.x, nearRight.y);
    ctx.lineTo(nearLeft.x, nearLeft.y);
    ctx.closePath();
    ctx.fillStyle = roadGradient;
    ctx.fill();

    // Moving lane dividers.
    ctx.save();
    ctx.strokeStyle = config.palette.lane;
    ctx.shadowColor = config.palette.edge;
    ctx.shadowBlur = 10;
    const scroll = (state.distance * 0.034) % 1;
    for (const boundary of [-0.5, 0.5]) {
      for (let index = 0; index < 17; index += 1) {
        const start = (index / 17 + scroll) % 1;
        const end = Math.min(1, start + 0.035);
        if (start < 0.02) continue;
        const p1 = project(boundary, start);
        const p2 = project(boundary, end);
        ctx.lineWidth = Math.max(1, p1.scale * 2.5);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
    // Road edges.
    for (const edge of [-1.5, 1.5]) {
      const p1 = project(edge, 0);
      const p2 = project(edge, 1);
      ctx.lineWidth = 2;
      ctx.strokeStyle = config.palette.edge;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }
    ctx.restore();

    // A soft horizon wash keeps the transition between scenery and track clean.
    const wash = ctx.createLinearGradient(0, horizonY - 8, 0, horizonY + 120);
    wash.addColorStop(0, "rgba(4,7,13,.28)");
    wash.addColorStop(1, "rgba(4,7,13,0)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, horizonY - 8, W, 130);

    if (config.drawRoadDetails) config.drawRoadDetails(ctx, state);
  };

  const draw = (now) => {
    const state = {
      time: now / 1000,
      elapsed,
      speed,
      distance,
      horizonY,
      bottomY,
      project,
      player: {
        x: project(lanePos, PLAYER_Z).x,
        y: project(lanePos, PLAYER_Z).y,
        lane,
        lanePos,
        jumpHeight,
        sliding: slideTimer > 0,
        scale: project(lanePos, PLAYER_Z).scale,
      },
    };

    config.drawBackground(ctx, state);
    drawRoad(state);

    coinObjects.forEach((coin) => {
      if (coin.collected) return;
      const screen = project(coin.lane, coin.z);
      config.drawCoin(ctx, coin, screen, state);
    });

    obstacles
      .slice()
      .sort((a, b) => a.z - b.z)
      .forEach((obstacle) => {
        const screen = project(obstacle.lane, obstacle.z);
        config.drawObstacle(ctx, obstacle, screen, state);
      });

    const playerScreen = project(lanePos, PLAYER_Z);
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "rgba(0,0,0,.7)";
    ctx.beginPath();
    ctx.ellipse(
      playerScreen.x,
      playerScreen.y + 5,
      28 * playerScreen.scale,
      9 * playerScreen.scale,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();

    config.drawPlayer(ctx, {
      x: playerScreen.x,
      y: playerScreen.y - jumpHeight,
      scale: playerScreen.scale,
      jumpHeight,
      sliding: slideTimer > 0,
      lanePos,
      time: now / 1000,
      speed,
    }, state);

    if (config.drawForeground) config.drawForeground(ctx, state);

    particles.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = clamp(particle.life / particle.max, 0, 1);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    if (crashFlash > 0) {
      ctx.save();
      ctx.globalAlpha = crashFlash * 0.2;
      ctx.fillStyle = config.palette.impact;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    if (speed > 0.55) {
      ctx.save();
      ctx.globalAlpha = (speed - 0.55) * 0.45;
      ctx.strokeStyle = config.palette.speedLine;
      ctx.lineWidth = 1.2;
      for (let index = 0; index < 10; index += 1) {
        const x = (index * 107 + now * 0.02 * speed) % W;
        const y = horizonY + ((index * 73 + now * 0.06) % 300);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 20 * speed, y + 18);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  function frame(now) {
    const dt = Math.min(0.045, Math.max(0, (now - lastTime) / 1000));
    lastTime = now;
    if (running && !paused) {
      update(dt);
    } else {
      updateParticles(dt);
      crashFlash = Math.max(0, crashFlash - dt * 4);
    }
    draw(now);
    raf = requestAnimationFrame(frame);
  }

  shell.onKey((event) => {
    if (shell.overlayVisible() || event.repeat) return;
    const key = event.key;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "a", "A", "d", "D", "w", "W", "s", "S"].includes(key)) {
      event.preventDefault();
    }
    if (key === "ArrowLeft" || key === "a" || key === "A") inputLane(-1);
    if (key === "ArrowRight" || key === "d" || key === "D") inputLane(1);
    if (key === "ArrowUp" || key === "w" || key === "W" || key === " ") inputJump();
    if (key === "ArrowDown" || key === "s" || key === "S") inputSlide();
  });

  const handleDirection = (direction) => {
    if (direction === "left") inputLane(-1);
    if (direction === "right") inputLane(1);
    if (direction === "up") inputJump();
    if (direction === "down") inputSlide();
  };
  shell.enableSwipe(handleDirection);
  shell.enableDpad(handleDirection, "↑ jump · ↓ slide<br>← → switch lane");
  shell.setPauseHandler(togglePause);
  shell.setRestartHandler(start);

  reset();
  shell.setStatus("Ready to play");
  shell.showOverlay({
    kicker: config.kicker,
    title: config.title,
    text: config.startText,
    actionLabel: "Start run",
    onAction: start,
    secondaryLabel: "All games",
    onSecondary: () => {
      window.location.href = "/all-games.html";
    },
    hint: config.startHint,
    mark: "play",
  });
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
    },
  };
}
