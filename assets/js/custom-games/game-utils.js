export const W = 960;
export const H = 600;

export const COLORS = {
  ink: "#04070d",
  panel: "#0a101b",
  lime: "#c9ff4a",
  limeSoft: "#ddff87",
  violet: "#8c70ff",
  violetSoft: "#b9a8ff",
  cyan: "#58e5ff",
  cyanSoft: "#a6f2ff",
  coral: "#ff8666",
  text: "#eef2e7",
  muted: "#929db1",
  faint: "#667187",
  white: "#f7faef",
};

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const lerp = (a, b, amount) => a + (b - a) * amount;
export const rand = (min, max) => min + Math.random() * (max - min);
export const randInt = (min, max) => Math.floor(rand(min, max + 1));
export const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);

export function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export function fillRoundRect(ctx, x, y, width, height, radius, fillStyle) {
  roundRect(ctx, x, y, width, height, radius);
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

export function strokeRoundRect(ctx, x, y, width, height, radius, strokeStyle, lineWidth = 1) {
  roundRect(ctx, x, y, width, height, radius);
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

export function glowCircle(ctx, x, y, radius, color, blur = 18) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawGrid(ctx, { width = W, height = H, size = 40, color = "rgba(255,255,255,.045)" } = {}) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 0; x <= width; x += size) {
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
  }
  for (let y = 0; y <= height; y += size) {
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawVignette(ctx, strength = 0.55) {
  const gradient = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.7);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);
}

export function drawLabel(ctx, text, x, y, { size = 12, color = COLORS.faint, align = "left", font = "monospace" } = {}) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawStarfield(ctx, stars, time = 0) {
  ctx.save();
  stars.forEach((star) => {
    const twinkle = 0.35 + 0.65 * Math.abs(Math.sin(time * star.speed + star.phase));
    ctx.globalAlpha = star.alpha * twinkle;
    ctx.fillStyle = star.color;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

export function createStars(count = 80, width = W, height = H) {
  return Array.from({ length: count }, () => ({
    x: rand(0, width),
    y: rand(0, height),
    radius: rand(0.4, 1.8),
    alpha: rand(0.2, 0.8),
    speed: rand(0.4, 1.8),
    phase: rand(0, Math.PI * 2),
    color: Math.random() > 0.82 ? COLORS.cyan : Math.random() > 0.7 ? COLORS.violet : COLORS.white,
  }));
}

export function formatMs(ms) {
  return `${Math.round(ms)} ms`;
}

export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function hitsRect(circle, rect) {
  const nearestX = clamp(circle.x, rect.x, rect.x + rect.w);
  const nearestY = clamp(circle.y, rect.y, rect.y + rect.h);
  return dist(circle.x, circle.y, nearestX, nearestY) <= circle.r;
}
