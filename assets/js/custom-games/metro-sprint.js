import { W, clamp, fillRoundRect, rand } from "./game-utils.js";
import { createRunnerGame } from "./runner-core.js";

const neonWindow = (ctx, x, y, width, height, color, alpha) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width, height);
  ctx.restore();
};

function drawSkyline(ctx, state) {
  const { distance, time } = state;
  const horizon = state.horizonY;
  const scroll = distance * 0.18;

  const sky = ctx.createLinearGradient(0, 0, 0, horizon + 80);
  sky.addColorStop(0, "#030b15");
  sky.addColorStop(0.55, "#071b2e");
  sky.addColorStop(1, "#0d3544");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, horizon + 70);

  const glow = ctx.createRadialGradient(490, horizon - 12, 4, 490, horizon - 12, 280);
  glow.addColorStop(0, "rgba(34,211,238,.19)");
  glow.addColorStop(0.48, "rgba(124,97,255,.08)");
  glow.addColorStop(1, "rgba(34,211,238,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(180, 0, 620, 400);

  for (let index = 0; index < 46; index += 1) {
    const x = (index * 113 - scroll * 0.2) % (W + 120);
    const y = 18 + ((index * 47) % 118);
    ctx.save();
    ctx.globalAlpha = 0.25 + (index % 4) * 0.12;
    ctx.fillStyle = index % 3 === 0 ? "#a5f3fc" : "#b9a8ff";
    ctx.fillRect(x, y, 1.4, 1.4);
    ctx.restore();
  }

  // Distant skyline.
  for (let layer = 0; layer < 2; layer += 1) {
    const alpha = layer === 0 ? 0.32 : 0.7;
    const speed = layer === 0 ? 0.12 : 0.32;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let index = 0; index < 22; index += 1) {
      const x = ((index * 79 - scroll * speed) % (W + 160)) - 80;
      const width = 34 + (index % 5) * 13;
      const height = 35 + (index % 7) * 15 + layer * 22;
      const y = horizon - height;
      ctx.fillStyle = layer === 0 ? "#061b2a" : "#082333";
      ctx.fillRect(x, y, width, height);
      ctx.fillStyle = layer === 0 ? "rgba(103,232,249,.16)" : "rgba(103,232,249,.3)";
      for (let row = 0; row < Math.floor(height / 16); row += 1) {
        for (let column = 0; column < 2; column += 1) {
          if ((row + column + index) % 3 === 0) {
            ctx.fillRect(x + 7 + column * 14, y + 8 + row * 16, 5, 3);
          }
        }
      }
      if (index % 4 === 0) {
        ctx.fillStyle = index % 8 === 0 ? "#f472b6" : "#22d3ee";
        ctx.fillRect(x + width * 0.5 - 1, y - 12, 2, 12);
      }
    }
    ctx.restore();
  }

  // Elevated station silhouette and line lights.
  ctx.save();
  ctx.strokeStyle = "rgba(103,232,249,.26)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, horizon + 4);
  ctx.lineTo(W, horizon - 8);
  ctx.stroke();
  ctx.strokeStyle = "rgba(124,97,255,.26)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, horizon + 12);
  ctx.lineTo(W, horizon - 2);
  ctx.stroke();
  ctx.restore();

  // Rain streaks.
  ctx.save();
  ctx.strokeStyle = "rgba(165,243,252,.16)";
  ctx.lineWidth = 1;
  for (let index = 0; index < 42; index += 1) {
    const x = (index * 91 + time * 95) % (W + 140) - 70;
    const y = (index * 67 + time * 180) % 430;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 5, y + 24);
    ctx.stroke();
  }
  ctx.restore();

  // Platform lights and canopy structure.
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "#04121e";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, 20);
  ctx.lineTo(0, 32);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#22d3ee";
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 12;
  for (let index = 0; index < 8; index += 1) {
    const x = 30 + index * 132;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(x, 22, 44, 2);
  }
  ctx.restore();

  for (let index = 0; index < 7; index += 1) {
    const x = 70 + index * 150;
    const pulse = 0.35 + Math.sin(time * 1.4 + index) * 0.12;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#f472b6";
    ctx.shadowColor = "#f472b6";
    ctx.shadowBlur = 13;
    ctx.beginPath();
    ctx.arc(x, 88 + (index % 3) * 18, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawRoadDetails(ctx, state) {
  const { project, distance } = state;
  const scroll = (distance * 0.036) % 1;

  // Moving sleepers under the running surface.
  ctx.save();
  ctx.strokeStyle = "rgba(103,232,249,.17)";
  for (let index = 0; index < 22; index += 1) {
    const z = (index / 22 + scroll) % 1;
    if (z < 0.018) continue;
    const left = project(-1.43, z);
    const right = project(1.43, z);
    ctx.globalAlpha = 0.25 + left.scale * 0.65;
    ctx.lineWidth = Math.max(1, 3.2 * left.scale);
    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.stroke();
  }
  ctx.restore();

  // Trackside pylons and hazard lights.
  for (const side of [-1, 1]) {
    for (let index = 0; index < 8; index += 1) {
      const z = (index / 8 + (distance * 0.024) % 1) % 1;
      if (z < 0.04) continue;
      const point = project(side * 1.72, z);
      const height = 48 * point.scale;
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.globalAlpha = 0.35 + point.scale * 0.45;
      ctx.strokeStyle = "#155e75";
      ctx.lineWidth = Math.max(1, 2.4 * point.scale);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -height);
      ctx.stroke();
      ctx.fillStyle = index % 3 === 0 ? "#f472b6" : "#22d3ee";
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10 * point.scale;
      ctx.beginPath();
      ctx.arc(0, -height, 2.8 * point.scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawCoin(ctx, coin, screen, state) {
  const size = 10 * screen.scale;
  const pulse = 0.8 + Math.sin(state.time * 4.6 + coin.phase) * 0.18;
  ctx.save();
  ctx.translate(screen.x, screen.y - 22 * screen.scale);
  ctx.globalAlpha = 0.5 + pulse * 0.3;
  ctx.shadowColor = "#67e8f9";
  ctx.shadowBlur = 18 * screen.scale;
  ctx.fillStyle = "#67e8f9";
  ctx.beginPath();
  for (let side = 0; side < 6; side += 1) {
    const angle = (Math.PI / 3) * side - Math.PI / 2;
    const x = Math.cos(angle) * size;
    const y = Math.sin(angle) * size;
    if (side === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#04121e";
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.33, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#cffafe";
  ctx.lineWidth = Math.max(1, 1.2 * screen.scale);
  ctx.beginPath();
  ctx.moveTo(-size * 0.32, 0);
  ctx.lineTo(size * 0.32, 0);
  ctx.moveTo(0, -size * 0.32);
  ctx.lineTo(0, size * 0.32);
  ctx.stroke();
  ctx.restore();
}

function drawObstacle(ctx, obstacle, screen) {
  const s = screen.scale;
  const x = screen.x;
  const y = screen.y;

  if (obstacle.type === "low") {
    const width = 104 * s;
    const height = 26 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,.4)";
    ctx.beginPath();
    ctx.ellipse(0, 3 * s, width * 0.55, 6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    fillRoundRect(ctx, -width / 2, -height, width, height, 5 * s);
    const barrier = ctx.createLinearGradient(0, -height, 0, 0);
    barrier.addColorStop(0, "#1e5b70");
    barrier.addColorStop(1, "#0c2f3e");
    ctx.fillStyle = barrier;
    ctx.fill();
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = Math.max(1, 1.4 * s);
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.rect(-width / 2, -height, width, height);
    ctx.clip();
    for (let stripe = -4; stripe < 8; stripe += 1) {
      ctx.strokeStyle = stripe % 2 === 0 ? "rgba(250,204,21,.7)" : "rgba(4,18,30,.45)";
      ctx.lineWidth = 8 * s;
      ctx.beginPath();
      ctx.moveTo(-width / 2 + stripe * 19 * s, 0);
      ctx.lineTo(-width / 2 + stripe * 19 * s + 34 * s, -height);
      ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = "#f472b6";
    ctx.fillRect(-width * 0.4, -height - 3 * s, 8 * s, 3 * s);
    ctx.fillRect(width * 0.32, -height - 3 * s, 8 * s, 3 * s);
    ctx.restore();
    return;
  }

  if (obstacle.type === "high") {
    const width = 120 * s;
    const boardY = -58 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "#155e75";
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(-width * 0.34, boardY);
    ctx.lineTo(-width * 0.34, -155 * s);
    ctx.moveTo(width * 0.34, boardY);
    ctx.lineTo(width * 0.34, -148 * s);
    ctx.stroke();
    fillRoundRect(ctx, -width / 2, boardY - 15 * s, width, 22 * s, 4 * s);
    const board = ctx.createLinearGradient(0, boardY - 15 * s, 0, boardY + 7 * s);
    board.addColorStop(0, "#0e5266");
    board.addColorStop(1, "#082431");
    ctx.fillStyle = board;
    ctx.fill();
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 1.3 * s;
    ctx.stroke();
    ctx.fillStyle = "#a5f3fc";
    ctx.globalAlpha = 0.9;
    ctx.fillRect(-width * 0.36, boardY - 7 * s, width * 0.34, 2.5 * s);
    ctx.fillRect(-width * 0.36, boardY - 2 * s, width * 0.22, 2 * s);
    ctx.fillStyle = "#f472b6";
    ctx.fillRect(width * 0.1, boardY - 8 * s, width * 0.24, 6 * s);
    ctx.restore();
    return;
  }

  const width = 72 * s;
  const height = 116 * s;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,.42)";
  ctx.beginPath();
  ctx.ellipse(0, 3 * s, width * 0.8, 7 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  fillRoundRect(ctx, -width / 2, -height, width, height, 7 * s);
  const body = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
  body.addColorStop(0, "#071723");
  body.addColorStop(0.5, "#123a4b");
  body.addColorStop(1, "#06141f");
  ctx.fillStyle = body;
  ctx.fill();
  ctx.strokeStyle = "#1e7490";
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();
  ctx.fillStyle = "#06121b";
  fillRoundRect(ctx, -width * 0.36, -height * 0.78, width * 0.72, height * 0.3, 4 * s);
  ctx.fill();
  ctx.fillStyle = "#22d3ee";
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = 12 * s;
  ctx.globalAlpha = 0.8;
  ctx.fillRect(-width * 0.28, -height * 0.66, width * 0.56, 3 * s);
  ctx.fillStyle = "#f472b6";
  ctx.fillRect(-width * 0.3, -height * 0.22, width * 0.6, 2 * s);
  ctx.restore();
}

function drawPlayer(ctx, player) {
  const { x, y, scale: s, sliding, time, speed } = player;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  const run = Math.sin(time * 15 + speed * 9);
  const bounce = Math.abs(run) * 2;
  if (sliding) {
    ctx.translate(0, -2);
    ctx.scale(1.15, 0.63);
  } else {
    ctx.translate(0, -bounce);
  }

  // Long courier scarf.
  ctx.save();
  ctx.strokeStyle = "#f472b6";
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-9, -57);
  ctx.quadraticCurveTo(-28, -52 + run * 3, -38, -41 + run * 5);
  ctx.stroke();
  ctx.restore();

  // Legs with illuminated soles.
  ctx.strokeStyle = "#071a28";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  if (sliding) {
    ctx.beginPath();
    ctx.moveTo(-6, -18);
    ctx.lineTo(16, -7);
    ctx.moveTo(-2, -16);
    ctx.lineTo(10, -4);
    ctx.stroke();
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(14, -4);
    ctx.lineTo(22, -3);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-6, -19);
    ctx.lineTo(-10 + run * 7, -2);
    ctx.moveTo(6, -19);
    ctx.lineTo(10 - run * 7, -2);
    ctx.stroke();
    ctx.strokeStyle = "#67e8f9";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10 + run * 7, 0);
    ctx.lineTo(-5 + run * 7, 0);
    ctx.moveTo(10 - run * 7, 0);
    ctx.lineTo(15 - run * 7, 0);
    ctx.stroke();
  }

  // Compact transit pack.
  ctx.fillStyle = "#071b2a";
  fillRoundRect(ctx, -16, -48, 32, 27, 6);
  ctx.fill();
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = "#22d3ee";
  ctx.globalAlpha = 0.65;
  ctx.fillRect(-11, -42, 22, 2.5);

  // Jacket.
  const jacket = ctx.createLinearGradient(0, -55, 0, -24);
  jacket.addColorStop(0, "#67e8f9");
  jacket.addColorStop(1, "#0e7490");
  ctx.fillStyle = jacket;
  fillRoundRect(ctx, -14, -49, 28, 30, 7);
  ctx.fill();
  ctx.fillStyle = "#082b38";
  ctx.fillRect(-2.5, -48, 5, 27);
  ctx.fillStyle = "#f472b6";
  ctx.fillRect(-14, -31, 28, 2);

  // Arms.
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-13, -43);
  ctx.lineTo(-18 - run * 2, -29 + run * 3);
  ctx.moveTo(13, -43);
  ctx.lineTo(18 + run * 2, -29 - run * 3);
  ctx.stroke();

  // Helmet and visor.
  ctx.fillStyle = "#d0eef2";
  ctx.beginPath();
  ctx.arc(0, -60, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#0b3141";
  ctx.beginPath();
  ctx.arc(0, -61, 9, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#67e8f9";
  ctx.shadowColor = "#67e8f9";
  ctx.shadowBlur = 7;
  ctx.beginPath();
  ctx.arc(4, -59, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(-7, -64);
  ctx.quadraticCurveTo(0, -70, 7, -64);
  ctx.stroke();

  ctx.restore();
}

function drawForeground(ctx, state) {
  // A soft blue frame and passing lighting rigs.
  const rig = (x, y, width, alpha) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    ctx.fillStyle = "#f472b6";
    ctx.beginPath();
    ctx.arc(x + width * 0.5, y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  rig(0, 48, 126, 0.18 + Math.sin(state.time) * 0.03);
  rig(W - 116, 72, 116, 0.14);

  ctx.save();
  const vignette = ctx.createRadialGradient(W / 2, 300, 240, W / 2, 300, 590);
  vignette.addColorStop(0, "rgba(2,8,18,0)");
  vignette.addColorStop(1, "rgba(2,8,18,.62)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, 600);
  ctx.restore();
}

export default function mountMetroSprint(shell) {
  return createRunnerGame(shell, {
    title: "Metro Sprint",
    kicker: "Original midnight run",
    startText:
      "The last train is already moving. Sprint the midnight line, hop barriers and slide under low signage before the doors close.",
    startHint: "← → switch lane · ↑ jump · ↓ slide · P pause",
    overKicker: "Connection lost",
    overTitle: "Missed the last train.",
    overText:
      "Read the platform early and commit to the clean lane. There is always one more service.",
    pauseTitle: "Holding at the platform.",
    pauseText: "The line is clear. Choose your lane before the next barrier arrives.",
    speedStart: 0.35,
    speedMax: 0.86,
    rampSeconds: 72,
    horizonY: 176,
    bottomY: 558,
    palette: {
      roadTop: "#102b3a",
      roadBottom: "#061421",
      edge: "#22d3ee",
      lane: "#a5f3fc",
      dust: "#67e8f9",
      coinBurst: "#fef08a",
      impact: "#f472b6",
      speedLine: "#a5f3fc",
    },
    drawBackground: drawSkyline,
    drawRoadDetails,
    drawCoin,
    drawObstacle,
    drawPlayer,
    drawForeground,
  });
}
