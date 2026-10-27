import { W, clamp, fillRoundRect, rand, lerp } from "./game-utils.js";
import { createRunnerGame } from "./runner-core.js";

const palmLeaf = (ctx, x, y, length, angle, color, alpha = 1) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(length * 0.48, -length * 0.19, length, 0);
  ctx.quadraticCurveTo(length * 0.48, length * 0.19, 0, 0);
  ctx.fill();
  ctx.restore();
};

const firefly = (ctx, x, y, size, time, index) => {
  const pulse = 0.45 + Math.sin(time * 2.4 + index) * 0.3;
  ctx.save();
  ctx.globalAlpha = clamp(pulse, 0.12, 0.9);
  ctx.fillStyle = "#d9f99d";
  ctx.shadowColor = "#bef264";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

function drawBackdrop(ctx, state) {
  const { time, distance, horizonY } = state;

  const sky = ctx.createLinearGradient(0, 0, 0, horizonY + 40);
  sky.addColorStop(0, "#061921");
  sky.addColorStop(0.55, "#0a2b2b");
  sky.addColorStop(1, "#15483b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, horizonY + 42);

  const glow = ctx.createRadialGradient(735, 106, 8, 735, 106, 210);
  glow.addColorStop(0, "rgba(217,249,157,.26)");
  glow.addColorStop(0.5, "rgba(190,242,100,.07)");
  glow.addColorStop(1, "rgba(190,242,100,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(480, 0, 480, 330);

  const moon = ctx.createRadialGradient(735, 106, 4, 735, 106, 34);
  moon.addColorStop(0, "#f4ffd6");
  moon.addColorStop(0.65, "#d9f99d");
  moon.addColorStop(1, "rgba(190,242,100,0)");
  ctx.fillStyle = moon;
  ctx.beginPath();
  ctx.arc(735, 106, 34, 0, Math.PI * 2);
  ctx.fill();

  // Layered ridgelines and a distant canopy.
  ctx.save();
  ctx.fillStyle = "rgba(8,38,34,.88)";
  ctx.beginPath();
  ctx.moveTo(0, horizonY + 8);
  for (let x = 0; x <= W; x += 40) {
    const hill = Math.sin(x * 0.011 + 1.2) * 26 + Math.sin(x * 0.027) * 10;
    ctx.lineTo(x, horizonY - 18 + hill);
  }
  ctx.lineTo(W, horizonY + 30);
  ctx.lineTo(0, horizonY + 30);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(6,55,45,.78)";
  for (let index = 0; index < 34; index += 1) {
    const x = (index * 71 + 20) % W;
    const size = 28 + (index % 5) * 13;
    const y = horizonY - 18 - (index % 4) * 16;
    ctx.beginPath();
    ctx.arc(x, y, size, Math.PI, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Parallax jungle trunks.
  ctx.save();
  const scroll = distance * 0.32;
  for (let layer = 0; layer < 2; layer += 1) {
    const alpha = layer === 0 ? 0.38 : 0.68;
    const speed = layer === 0 ? 0.22 : 0.55;
    ctx.globalAlpha = alpha;
    for (let index = 0; index < 14; index += 1) {
      const x = ((index * 103 - scroll * speed) % (W + 180)) - 90;
      const side = x < W / 2 ? -1 : 1;
      const trunkX = x + side * (38 + layer * 12);
      const width = 20 + layer * 14;
      ctx.fillStyle = layer === 0 ? "#0b3028" : "#08241f";
      ctx.beginPath();
      ctx.moveTo(trunkX - width * 0.35, horizonY - 20);
      ctx.lineTo(trunkX + width * 0.35, horizonY - 20);
      ctx.lineTo(trunkX + width, 470);
      ctx.lineTo(trunkX - width, 470);
      ctx.closePath();
      ctx.fill();
      for (let leaf = 0; leaf < 4; leaf += 1) {
        palmLeaf(
          ctx,
          trunkX + (leaf % 2 === 0 ? -width : width),
          176 + leaf * 27,
          54 + layer * 18,
          (leaf % 2 === 0 ? 2.7 : 0.4) + leaf * 0.2,
          layer === 0 ? "#0d3b2f" : "#0a2e26",
          alpha,
        );
      }
    }
  }
  ctx.restore();

  // Canopy silhouette at the top of the frame.
  ctx.fillStyle = "#041512";
  for (let index = 0; index < 18; index += 1) {
    const x = index * 57 - 30;
    const radius = 44 + (index % 4) * 17;
    ctx.beginPath();
    ctx.arc(x, -16 + (index % 3) * 8, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 28, 18 + (index % 5) * 6, radius * 0.68, 0, Math.PI * 2);
    ctx.fill();
  }

  // Warm shafts filtering through the canopy.
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const shaft = ctx.createLinearGradient(520, 0, 640, horizonY + 60);
  shaft.addColorStop(0, "rgba(217,249,157,.08)");
  shaft.addColorStop(1, "rgba(217,249,157,0)");
  ctx.fillStyle = shaft;
  ctx.beginPath();
  ctx.moveTo(490, 0);
  ctx.lineTo(650, 0);
  ctx.lineTo(595, horizonY + 50);
  ctx.lineTo(380, horizonY + 50);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  for (let index = 0; index < 22; index += 1) {
    const x = (index * 137 + Math.sin(index + time * 0.4) * 36) % W;
    const y =
      horizonY - 50 + ((index * 53 + Math.sin(time * 0.7 + index) * 23) % 200);
    firefly(ctx, x, y, 1.2 + (index % 3) * 0.7, time, index);
  }
}

function drawRoadDetails(ctx, state) {
  const { project, distance } = state;
  for (const side of [-1, 1]) {
    for (let index = 0; index < 9; index += 1) {
      const z = (index / 9 + (distance * 0.028) % 1) % 1;
      if (z < 0.035) continue;
      const point = project(side * 1.69, z);
      const size = 9 + point.scale * 15;
      ctx.save();
      ctx.translate(point.x, point.y);
      ctx.globalAlpha = 0.25 + point.scale * 0.35;
      ctx.strokeStyle = index % 2 === 0 ? "#a3e635" : "#4d7c0f";
      ctx.lineWidth = Math.max(1, 1.5 * point.scale);
      ctx.beginPath();
      ctx.moveTo(0, 2);
      ctx.quadraticCurveTo(-size * 0.5, -size * 0.5, -size, -size * 0.2);
      ctx.moveTo(0, 2);
      ctx.quadraticCurveTo(size * 0.15, -size * 0.8, size * 0.8, -size * 0.7);
      ctx.moveTo(0, 2);
      ctx.quadraticCurveTo(size * 0.8, -size * 0.2, size * 1.2, size * 0.1);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawCoin(ctx, coin, screen, state) {
  const pulse = 0.82 + Math.sin(state.time * 4 + coin.phase) * 0.15;
  const x = screen.x;
  const y = screen.y - 22 * screen.scale;
  const size = 11 * screen.scale * pulse;
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = "#facc15";
  ctx.shadowBlur = 16 * screen.scale;
  const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, size * 2.4);
  glow.addColorStop(0, "rgba(253,230,138,.7)");
  glow.addColorStop(1, "rgba(250,204,21,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, size * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#facc15";
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.quadraticCurveTo(size, -size * 0.2, 0, size);
  ctx.quadraticCurveTo(-size, -size * 0.2, 0, -size);
  ctx.fill();
  ctx.strokeStyle = "#fef9c3";
  ctx.lineWidth = Math.max(1, 1.4 * screen.scale);
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.55);
  ctx.lineTo(0, size * 0.55);
  ctx.stroke();
  ctx.restore();
}

function drawObstacle(ctx, obstacle, screen, state) {
  const s = screen.scale;
  const x = screen.x;
  const y = screen.y;

  if (obstacle.type === "low") {
    const width = 104 * s;
    const height = 27 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath();
    ctx.ellipse(0, 4 * s, width * 0.55, 7 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4d3322";
    ctx.beginPath();
    ctx.ellipse(-width / 2, -height * 0.5, height * 0.46, height * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    fillRoundRect(ctx, -width / 2, -height, width, height, height * 0.45);
    const bark = ctx.createLinearGradient(0, -height, 0, 0);
    bark.addColorStop(0, "#805234");
    bark.addColorStop(0.5, "#5d3b26");
    bark.addColorStop(1, "#3d281d");
    ctx.fillStyle = bark;
    ctx.fill();
    ctx.strokeStyle = "#2c1b14";
    ctx.lineWidth = Math.max(1, 1.3 * s);
    for (let line = -2; line <= 2; line += 1) {
      ctx.beginPath();
      ctx.moveTo(line * 17 * s, -height * 0.8);
      ctx.lineTo(line * 20 * s, -height * 0.18);
      ctx.stroke();
    }
    ctx.fillStyle = "#84a63c";
    ctx.beginPath();
    ctx.ellipse(-10 * s, -height, 26 * s, 6 * s, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a3e635";
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(18 * s, -height * 1.02, 2.3 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  if (obstacle.type === "high") {
    const width = 112 * s;
    const beamY = -55 * s;
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = "#4c7c3d";
    ctx.lineWidth = 3 * s;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.moveTo(-width * 0.42, beamY);
    ctx.bezierCurveTo(-width * 0.55, -108 * s, -width * 0.2, -150 * s, -width * 0.12, -176 * s);
    ctx.moveTo(width * 0.38, beamY);
    ctx.bezierCurveTo(width * 0.56, -95 * s, width * 0.25, -145 * s, width * 0.32, -168 * s);
    ctx.stroke();
    ctx.globalAlpha = 1;
    fillRoundRect(ctx, -width / 2, beamY - 9 * s, width, 18 * s, 9 * s);
    ctx.fillStyle = "#60452c";
    ctx.fill();
    ctx.strokeStyle = "#2e2118";
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();
    for (let leaf = 0; leaf < 5; leaf += 1) {
      palmLeaf(
        ctx,
        -width / 2 + leaf * 22 * s,
        beamY + (leaf % 2 === 0 ? -6 : 5) * s,
        20 * s,
        leaf % 2 === 0 ? 2.7 : 0.4,
        "#4d7c0f",
        0.92,
      );
    }
    ctx.fillStyle = "#ff9a62";
    ctx.beginPath();
    ctx.arc(width * 0.18, beamY - 17 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const width = 68 * s;
  const height = 112 * s;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,.42)";
  ctx.beginPath();
  ctx.ellipse(0, 4 * s, width * 0.9, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  const stone = ctx.createLinearGradient(-width / 2, 0, width / 2, 0);
  stone.addColorStop(0, "#263b33");
  stone.addColorStop(0.5, "#476354");
  stone.addColorStop(1, "#1b2f29");
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.moveTo(-width * 0.43, 0);
  ctx.lineTo(-width * 0.5, -height * 0.82);
  ctx.lineTo(-width * 0.26, -height);
  ctx.lineTo(width * 0.3, -height * 0.96);
  ctx.lineTo(width * 0.49, -height * 0.68);
  ctx.lineTo(width * 0.42, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#0e1d18";
  ctx.lineWidth = 1.5 * s;
  ctx.stroke();
  ctx.strokeStyle = "rgba(163,230,53,.34)";
  for (let band = 1; band <= 3; band += 1) {
    ctx.beginPath();
    ctx.moveTo(-width * 0.39, -height * band * 0.23);
    ctx.lineTo(width * 0.36, -height * band * 0.23);
    ctx.stroke();
  }
  ctx.fillStyle = "#a3e635";
  ctx.shadowColor = "#a3e635";
  ctx.shadowBlur = 14 * s;
  ctx.beginPath();
  ctx.moveTo(0, -height * 0.63);
  ctx.lineTo(12 * s, -height * 0.52);
  ctx.lineTo(0, -height * 0.41);
  ctx.lineTo(-12 * s, -height * 0.52);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPlayer(ctx, player, state) {
  const { x, y, scale: s, jumpHeight, sliding, time, speed } = player;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);

  const run = Math.sin(time * 13 + speed * 8);
  const bounce = Math.abs(run) * 2;
  if (sliding) {
    ctx.translate(0, -2);
    ctx.scale(1.16, 0.62);
  } else {
    ctx.translate(0, -bounce);
  }

  // Scarf.
  ctx.save();
  ctx.strokeStyle = "#ff9a62";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-10, -57);
  ctx.quadraticCurveTo(-27 - run * 2, -54 + run * 3, -35, -43 + run * 5);
  ctx.stroke();
  ctx.restore();

  // Legs.
  ctx.strokeStyle = "#132a22";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  if (sliding) {
    ctx.beginPath();
    ctx.moveTo(-7, -18);
    ctx.lineTo(15, -7);
    ctx.moveTo(-2, -16);
    ctx.lineTo(8, -4);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-6, -20);
    ctx.lineTo(-10 + run * 7, -2);
    ctx.moveTo(6, -20);
    ctx.lineTo(10 - run * 7, -2);
    ctx.stroke();
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10 + run * 7, 0);
    ctx.lineTo(-6 + run * 7, 0);
    ctx.moveTo(10 - run * 7, 0);
    ctx.lineTo(14 - run * 7, 0);
    ctx.stroke();
  }

  // Backpack.
  ctx.fillStyle = "#173c2f";
  fillRoundRect(ctx, -16, -48, 32, 26, 7);
  ctx.fill();
  ctx.fillStyle = "#2d6a4f";
  fillRoundRect(ctx, -12, -43, 24, 10, 4);
  ctx.fill();

  // Torso.
  const jacket = ctx.createLinearGradient(0, -57, 0, -25);
  jacket.addColorStop(0, "#d9f99d");
  jacket.addColorStop(1, "#84cc16");
  ctx.fillStyle = jacket;
  fillRoundRect(ctx, -14, -49, 28, 29, 8);
  ctx.fill();
  ctx.fillStyle = "#365314";
  ctx.fillRect(-3, -48, 6, 26);

  // Arms.
  ctx.strokeStyle = "#a3e635";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-13, -43);
  ctx.lineTo(-18 - run * 2, -29 + run * 3);
  ctx.moveTo(13, -43);
  ctx.lineTo(18 + run * 2, -29 - run * 3);
  ctx.stroke();

  // Head, hair and brimmed trail hat.
  ctx.fillStyle = "#d6a77a";
  ctx.beginPath();
  ctx.arc(0, -59, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#533a24";
  ctx.beginPath();
  ctx.arc(0, -61, 9, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#b98a55";
  ctx.beginPath();
  ctx.ellipse(0, -68, 15, 4.5, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6f4d2e";
  ctx.beginPath();
  ctx.ellipse(0, -71, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fef3c7";
  ctx.beginPath();
  ctx.arc(4, -58, 1.2, 0, Math.PI * 2);
  ctx.fill();

  if (jumpHeight > 20) {
    ctx.strokeStyle = "rgba(217,249,157,.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -30, 25, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawForeground(ctx, state) {
  // Near foliage frames the track without covering the lane reading area.
  const sway = Math.sin(state.time * 0.8) * 4;
  ctx.save();
  ctx.globalAlpha = 0.92;
  for (let index = 0; index < 5; index += 1) {
    palmLeaf(ctx, -26, 398 + index * 26, 102, -0.16 + index * 0.12 + sway * 0.003, "#071f1a", 0.8);
    palmLeaf(ctx, W + 26, 388 + index * 30, 112, Math.PI + 0.12 - index * 0.1, "#071f1a", 0.8);
  }
  ctx.globalAlpha = 1;

  const vignette = ctx.createRadialGradient(W / 2, 300, 220, W / 2, 300, 580);
  vignette.addColorStop(0, "rgba(2,8,8,0)");
  vignette.addColorStop(1, "rgba(2,8,8,.58)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, 600);
  ctx.restore();
}

export default function mountJungleDash(shell) {
  return createRunnerGame(shell, {
    title: "Jungle Dash",
    kicker: "Original jungle run",
    startText:
      "Sprint a forgotten forest trail. Hop fallen logs, slide beneath low branches and keep a clean line while the canopy closes in.",
    startHint: "← → switch lane · ↑ jump · ↓ slide · P pause",
    overKicker: "Run complete",
    overTitle: "The trail wins.",
    overText:
      "A clean route is three good choices in a row. Read the next gap and try the trail again.",
    pauseTitle: "A quiet clearing.",
    pauseText: "The canopy will wait. Pick the open lane before you move.",
    speedStart: 0.33,
    speedMax: 0.82,
    rampSeconds: 78,
    horizonY: 176,
    bottomY: 558,
    palette: {
      roadTop: "#1d3b2c",
      roadBottom: "#0d241c",
      edge: "#a3e635",
      lane: "#d9f99d",
      dust: "#bef264",
      coinBurst: "#facc15",
      impact: "#fb7185",
      speedLine: "#d9f99d",
    },
    drawBackground: drawBackdrop,
    drawRoadDetails,
    drawCoin,
    drawObstacle,
    drawPlayer,
    drawForeground,
  });
}
