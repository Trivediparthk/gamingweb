import {
  COLORS,
  H,
  W,
  clamp,
  drawVignette,
  glowCircle,
  rand,
} from "./game-utils.js";

export default function createReactionRush(shell) {
  const ctx = shell.ctx;
  const totalRounds = 5;
  const events = new AbortController();

  let state = "ready";
  let round = 0;
  let results = [];
  let waitRemaining = 0;
  let resultRemaining = 0;
  let signalStartedAt = 0;
  let lastResult = 0;
  let pulse = 0;
  let flash = 0;
  let running = false;
  let paused = false;
  let pauseStartedAt = 0;
  let raf = 0;
  let lastTime = performance.now();

  function average() {
    if (!results.length) return 0;
    return Math.round(results.reduce((total, value) => total + value, 0) / results.length);
  }

  function updateHud() {
    shell.setScore(average());
    shell.setExtra([
      { label: "Round", value: `${Math.min(round, totalRounds)}/${totalRounds}` },
      { label: "Last", value: lastResult ? `${lastResult} ms` : "—" },
    ]);
  }

  function beginRound() {
    round += 1;
    state = "waiting";
    waitRemaining = rand(1.35, 3.1);
    signalStartedAt = 0;
    lastResult = 0;
    shell.setStatus("Wait for the signal", "playing");
    updateHud();
  }

  function showResult(value, falseStart = false) {
    state = "result";
    resultRemaining = falseStart ? 1.3 : 1.05;
    lastResult = value;
    flash = falseStart ? 0.4 : 0.7;
    pulse = 1;
    shell.setExtra([
      { label: "Round", value: `${Math.min(round, totalRounds)}/${totalRounds}` },
      { label: "Last", value: `${value} ms` },
    ]);
    shell.setStatus(falseStart ? "Too soon / +500 ms" : `${value} ms`, falseStart ? "paused" : "playing");
    shell.announce(
      falseStart
        ? `False start. Five hundred milliseconds added. Round ${round} of ${totalRounds}.`
        : `Reaction time ${value} milliseconds.`,
    );
  }

  function falseStart() {
    results.push(500);
    showResult(500, true);
    shell.setScore(average());
  }

  function registerHit() {
    if (state === "waiting") {
      falseStart();
      return;
    }
    if (state !== "signal") return;
    const reaction = clamp(Math.round(performance.now() - signalStartedAt), 70, 1200);
    results.push(reaction);
    showResult(reaction);
    shell.setScore(average());
  }

  function complete() {
    state = "complete";
    running = false;
    paused = false;
    const score = average();
    shell.setPaused(false);
    shell.setScore(score, true);
    shell.setStatus("Session complete", "paused");
    shell.showOverlay({
      kicker: "Five rounds complete",
      title: score < 220 ? "Lightning." : score < 300 ? "Sharp." : "Warm up.",
      text:
        score < 220
          ? "That is a genuinely fast average. Clean anticipation without jumping the signal."
          : score < 300
            ? "A solid reading. A little more anticipation and the average will drop."
            : "There is room in the reflex. Reset, breathe and let the signal come to you.",
      actionLabel: "Run it again",
      onAction: start,
      secondaryLabel: "All games",
      onSecondary: () => {
        window.location.href = "/all-games.html";
      },
      showScore: true,
      scoreLabel: "Average",
      bestLabel: "Best avg",
      hint: "Average reaction across five rounds",
      mark: "check",
    });
    shell.announce(`Five rounds complete. Average reaction time ${score} milliseconds.`);
  }

  function update(dt) {
    if (!running || paused) return;
    pulse = Math.max(0, pulse - dt * 1.4);
    flash = Math.max(0, flash - dt);
    if (state === "waiting") {
      waitRemaining -= dt;
      if (waitRemaining <= 0) {
        state = "signal";
        signalStartedAt = performance.now();
        shell.setStatus("GO", "playing");
        shell.announce("Signal. React now.");
      }
    } else if (state === "result") {
      resultRemaining -= dt;
      if (resultRemaining <= 0) {
        if (round >= totalRounds) complete();
        else beginRound();
      }
    }
  }

  function drawRings(cx, cy, color, time, active = false) {
    for (let i = 0; i < 5; i += 1) {
      const radius = 82 + i * 40 + (active ? Math.sin(time / 340 + i) * 5 : 0);
      ctx.save();
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.18 - i * 0.027;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    const signal = state === "signal";
    const failure = state === "result" && lastResult === 500;
    const bg = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 600);
    if (signal) {
      bg.addColorStop(0, "#1d2a09");
      bg.addColorStop(0.55, "#0a1006");
      bg.addColorStop(1, COLORS.ink);
    } else if (failure) {
      bg.addColorStop(0, "#251014");
      bg.addColorStop(1, COLORS.ink);
    } else {
      bg.addColorStop(0, "#15122d");
      bg.addColorStop(0.62, "#090d18");
      bg.addColorStop(1, COLORS.ink);
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const accent = signal ? COLORS.lime : failure ? COLORS.coral : state === "result" ? COLORS.cyan : COLORS.violet;
    drawRings(W / 2, H / 2, accent, now / 1000, signal || state === "waiting");

    const centerRadius = 79 + pulse * 10;
    ctx.save();
    ctx.globalAlpha = signal ? 0.32 : 0.12;
    glowCircle(ctx, W / 2, H / 2, centerRadius, accent, signal ? 48 : 24);
    ctx.restore();

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = accent;
    if (state === "waiting") {
      ctx.font = "600 56px Bahnschrift, Arial Narrow, sans-serif";
      ctx.fillText("WAIT", W / 2, H / 2 - 3);
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.font = "10px monospace";
      ctx.fillText("DO NOT CLICK", W / 2, H / 2 + 47);
    } else if (state === "signal") {
      const live = Math.round(performance.now() - signalStartedAt);
      ctx.font = "600 86px Bahnschrift, Arial Narrow, sans-serif";
      ctx.fillText("GO", W / 2, H / 2 - 20);
      ctx.fillStyle = "rgba(4,7,13,.55)";
      ctx.font = "13px monospace";
      ctx.fillText(`${live} ms`, W / 2, H / 2 + 54);
    } else if (state === "result") {
      if (failure) {
        ctx.fillStyle = COLORS.coral;
        ctx.font = "600 44px Bahnschrift, Arial Narrow, sans-serif";
        ctx.fillText("TOO SOON", W / 2, H / 2 - 20);
        ctx.fillStyle = "rgba(255,255,255,.55)";
        ctx.font = "13px monospace";
        ctx.fillText("+500 ms penalty", W / 2, H / 2 + 40);
      } else {
        ctx.fillStyle = COLORS.lime;
        ctx.font = "600 76px Bahnschrift, Arial Narrow, sans-serif";
        ctx.fillText(`${lastResult}`, W / 2, H / 2 - 16);
        ctx.fillStyle = "rgba(255,255,255,.5)";
        ctx.font = "11px monospace";
        ctx.fillText("MILLISECONDS", W / 2, H / 2 + 43);
      }
    } else {
      ctx.font = "600 54px Bahnschrift, Arial Narrow, sans-serif";
      ctx.fillText("READY", W / 2, H / 2);
    }
    ctx.restore();

    for (let i = 0; i < totalRounds; i += 1) {
      const x = W / 2 - (totalRounds - 1) * 18 + i * 36;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, H - 58, 5, 0, Math.PI * 2);
      ctx.fillStyle =
        i < results.length
          ? lastResult === 500 && i === results.length - 1
            ? COLORS.coral
            : COLORS.lime
          : "rgba(255,255,255,.15)";
      ctx.fill();
      if (i === Math.min(round - 1, totalRounds - 1) && running) {
        ctx.strokeStyle = "rgba(255,255,255,.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, H - 58, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (flash > 0) {
      ctx.save();
      ctx.globalAlpha = flash * 0.16;
      ctx.fillStyle = signal ? COLORS.lime : failure ? COLORS.coral : COLORS.cyan;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    drawVignette(ctx, 0.42);
  }

  function start() {
    results = [];
    round = 0;
    lastResult = 0;
    state = "ready";
    running = true;
    paused = false;
    shell.setPaused(false);
    shell.setScore(0);
    shell.setStatus("Wait for the signal", "playing");
    beginRound();
    lastTime = performance.now();
    shell.announce("Reaction Rush started. Wait for lime, then press Space or tap as fast as you can.");
  }

  function pause() {
    if (!running) return;
    if (paused) {
      const pausedFor = performance.now() - pauseStartedAt;
      if (state === "signal") signalStartedAt += pausedFor;
      paused = false;
      shell.setPaused(false);
      shell.hideOverlay();
      lastTime = performance.now();
      shell.setStatus(state === "signal" ? "GO" : "Wait for the signal", "playing");
    } else {
      paused = true;
      pauseStartedAt = performance.now();
      shell.setPaused(true);
      shell.showOverlay({
        kicker: "Trial paused",
        title: "Reset your focus.",
        text: "The clock is paused too. Resume when you are ready for the next signal.",
        actionLabel: "Resume",
        onAction: () => {
          const pausedFor = performance.now() - pauseStartedAt;
          if (state === "signal") signalStartedAt += pausedFor;
          paused = false;
          shell.setPaused(false);
          lastTime = performance.now();
          shell.setStatus(state === "signal" ? "GO" : "Wait for the signal", "playing");
        },
        secondaryLabel: "Restart",
        onSecondary: start,
        mark: "pause",
      });
    }
  }

  shell.onPointer(() => {
    if (!running || paused) return;
    registerHit();
  });
  shell.onKey((event) => {
    if ([" ", "Spacebar", "Enter"].includes(event.key)) {
      if (!running) return;
      event.preventDefault();
      if (!paused) registerHit();
    }
  });
  shell.setPauseHandler(pause);
  shell.setRestartHandler(start);

  function frame(now) {
    const delta = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    update(delta);
    draw(now);
    raf = requestAnimationFrame(frame);
  }

  updateHud();
  shell.showOverlay({
    kicker: "Skill / Casual / 007",
    title: "Reaction Rush",
    text: "Five rounds. Wait for the target to turn lime, then strike immediately. Click early and a 500 ms penalty is added.",
    actionLabel: "Start trial",
    onAction: start,
    secondaryLabel: "All games",
    onSecondary: () => {
      window.location.href = "/all-games.html";
    },
    hint: "Space / click / tap when the screen turns lime",
    mark: "play",
  });
  shell.setStatus("Ready to play");
  raf = requestAnimationFrame(frame);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      events.abort();
    },
  };
}
