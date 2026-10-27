const STYLE_ID = "rr-ui-style";

const STYLE = `
.rr-loading{position:absolute;inset:0;z-index:9;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1rem;padding:2rem;background:radial-gradient(circle at 50% 42%,rgba(34,66,56,.55),rgba(3,8,7,.96) 70%);text-align:center;transition:opacity .35s}
.rr-loading[hidden]{display:none}
.rr-loading img{width:min(330px,74%);height:auto;filter:drop-shadow(0 16px 34px rgba(0,0,0,.55))}
.rr-loading-bar{width:min(330px,74%);height:4px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden}
.rr-loading-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#c9ff4a,#ffb347);transition:width .2s ease}
.rr-loading-text{font-size:.55rem;letter-spacing:.14em;color:rgba(255,255,255,.6);min-height:1em}
.rr-loading-error{max-width:360px;font-size:.7rem;line-height:1.6;letter-spacing:.04em;color:#ffb4a4}
.rr-loading button{pointer-events:auto;padding:.45rem .9rem;border:1px solid rgba(201,255,74,.45);border-radius:.4rem;background:rgba(8,20,14,.9);color:#eaffc8;font:inherit;font-size:.55rem;letter-spacing:.12em;cursor:pointer}
.rr-loading button[hidden]{display:none}
.rr-settings,.rr-power,.rr-hint{transition:opacity .3s}

.rr-ui{position:absolute;inset:0;z-index:7;pointer-events:none;font-family:var(--font-mono,ui-monospace,monospace);text-transform:uppercase}
.rr-settings{position:absolute;top:.65rem;right:.65rem;display:flex;flex-direction:column;gap:.32rem;align-items:flex-end;pointer-events:auto}
.rr-btn{display:inline-flex;align-items:center;gap:.4rem;min-height:1.7rem;padding:.22rem .55rem;border:1px solid rgba(255,255,255,.16);border-radius:.4rem;background:rgba(5,12,11,.72);color:#d8e4d0;font:inherit;font-size:.52rem;letter-spacing:.12em;backdrop-filter:blur(8px);cursor:pointer;transition:border-color .2s,color .2s,background .2s}
.rr-btn:hover{border-color:rgba(201,255,74,.45);color:#f4ffe2;background:rgba(10,24,18,.85)}
.rr-btn:focus-visible{outline:2px solid #c9ff4a;outline-offset:2px}
.rr-dot{width:.4rem;height:.4rem;border-radius:50%;background:#c9ff4a;box-shadow:0 0 0 2px rgba(201,255,74,.18)}
.rr-dot--q{background:#ffb347;box-shadow:0 0 0 2px rgba(255,179,71,.18)}
.rr-btn[aria-pressed="false"] .rr-dot{background:#ff8666;box-shadow:0 0 0 2px rgba(255,134,102,.16)}
.rr-power{position:absolute;top:.65rem;left:.65rem;min-width:9.2rem;padding:.4rem .6rem .45rem;border:1px solid rgba(255,255,255,.14);border-left:3px solid #c9ff4a;border-radius:.4rem;background:rgba(5,12,11,.72);color:#eaffd8;backdrop-filter:blur(8px);pointer-events:none}
.rr-power[hidden]{display:none}
.rr-power-head{display:flex;align-items:baseline;justify-content:space-between;gap:.6rem}
.rr-power-name{font-size:.58rem;letter-spacing:.16em;color:#c9ff4a}
.rr-power-time{font-size:.5rem;color:rgba(255,255,255,.65)}
.rr-power-bar{display:block;height:2px;margin-top:.3rem;background:rgba(255,255,255,.12);border-radius:99px;overflow:hidden}
.rr-power-bar i{display:block;height:100%;width:100%;background:#c9ff4a;transition:width .12s linear}
.rr-power--shield{border-left-color:#58e5ff}
.rr-power--shield .rr-power-name{color:#9ff4ff}
.rr-power--shield .rr-power-bar i{background:#58e5ff}
.rr-power--magnet{border-left-color:#8c70ff}
.rr-power--magnet .rr-power-name{color:#c9b8ff}
.rr-power--magnet .rr-power-bar i{background:#8c70ff}
.rr-power--boost{border-left-color:#ffb347}
.rr-power--boost .rr-power-name{color:#ffd27a}
.rr-power--boost .rr-power-bar i{background:#ffb347}
.rr-countdown{position:absolute;inset:0;display:grid;place-items:center;background:radial-gradient(circle at 50% 48%,rgba(4,10,8,.55),rgba(4,10,8,0) 42%)}
.rr-countdown[hidden]{display:none}
.rr-countdown span{font-family:var(--font-display,Arial,sans-serif);font-size:clamp(4rem,15vw,9rem);font-weight:900;letter-spacing:-.06em;color:#fff4d6;text-shadow:0 0 30px rgba(255,179,71,.65),0 8px 30px rgba(0,0,0,.5);animation:rr-pop .55s cubic-bezier(.2,.9,.25,1)}
.rr-countdown.is-go span{color:#c9ff4a;text-shadow:0 0 36px rgba(201,255,74,.7),0 8px 30px rgba(0,0,0,.5)}
@keyframes rr-pop{0%{transform:scale(.55);opacity:0}55%{transform:scale(1.06);opacity:1}100%{transform:scale(1);opacity:1}}
.rr-hint{position:absolute;left:50%;bottom:.7rem;transform:translateX(-50%);padding:.28rem .7rem;border:1px solid rgba(255,255,255,.12);border-radius:999px;background:rgba(5,12,11,.66);color:rgba(240,250,235,.75);font-size:.5rem;letter-spacing:.13em;white-space:nowrap;backdrop-filter:blur(8px);transition:opacity .4s;pointer-events:none}
.rr-hint[hidden]{display:none}
.rr-hint.is-fading{opacity:0}
.rr-toast{position:absolute;left:50%;top:.65rem;transform:translateX(-50%);padding:.3rem .7rem;border:1px solid rgba(201,255,74,.3);border-radius:999px;background:rgba(6,16,12,.85);color:#eaffc8;font-size:.5rem;letter-spacing:.1em;opacity:0;transition:opacity .25s;pointer-events:none}
.rr-toast.is-on{opacity:1}
.rr-logo{display:block;width:min(340px,80%);height:auto;margin:0 auto .7rem;filter:drop-shadow(0 14px 30px rgba(0,0,0,.45));animation:rr-logo-in .6s cubic-bezier(.2,.9,.25,1) both}
@keyframes rr-logo-in{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
.rr-overlay--start .game-overlay__mark{display:none}
.rr-overlay--start .game-overlay__panel h2{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.rr-overlay--over .game-overlay__mark{display:none}
@media (max-width:640px){
  .rr-settings{top:.45rem;right:.45rem}
  .rr-power{top:.45rem;left:.45rem;min-width:7.8rem}
  .rr-btn{font-size:.46rem;padding:.18rem .45rem;min-height:1.55rem}
  .rr-logo{width:min(260px,84%)}
}
`;

export function createRunnerUI(shell, options) {
  let soundEnabled = options.soundEnabled;
  let quality = options.quality;

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = STYLE;
    document.head.appendChild(style);
  }

  const root = document.createElement("div");
  root.className = "rr-ui";
  root.innerHTML = `
    <div class="rr-loading" data-loading>
      <img src="/assets/images/games/ruin-runner-logo.svg" alt="Ruin Runner 3D">
      <div class="rr-loading-bar"><i data-loading-bar></i></div>
      <div class="rr-loading-text" data-loading-text>Preparing the expedition?</div>
      <div class="rr-loading-error" data-loading-error hidden></div>
      <button type="button" data-loading-retry hidden>Retry</button>
    </div>
    <div class="rr-power" data-power hidden>
      <div class="rr-power-head"><span class="rr-power-name" data-power-name>SHIELD</span><span class="rr-power-time" data-power-time>0s</span></div>
      <span class="rr-power-bar"><i data-power-bar></i></span>
    </div>
    <div class="rr-settings">
      <button type="button" class="rr-btn" data-sound aria-pressed="${soundEnabled ? "true" : "false"}" aria-label="Toggle sound">
        <span class="rr-dot"></span><span data-sound-label>SOUND ${soundEnabled ? "ON" : "OFF"}</span>
      </button>
      <button type="button" class="rr-btn" data-quality aria-label="Change graphics quality">
        <span class="rr-dot rr-dot--q"></span><span data-quality-label>QUALITY ${quality.toUpperCase()}</span>
      </button>
    </div>
    <div class="rr-countdown" data-countdown hidden><span data-countdown-text>3</span></div>
    <div class="rr-hint" data-hint hidden>Swipe to move · Arrows / WASD</div>
    <div class="rr-toast" data-toast role="status"></div>
  `;
  shell.stage.appendChild(root);

  const loading = root.querySelector("[data-loading]");
  const loadingBar = root.querySelector("[data-loading-bar]");
  const loadingText = root.querySelector("[data-loading-text]");
  const loadingError = root.querySelector("[data-loading-error]");
  const loadingRetry = root.querySelector("[data-loading-retry]");
  const power = root.querySelector("[data-power]");
  const powerName = root.querySelector("[data-power-name]");
  const powerTime = root.querySelector("[data-power-time]");
  const powerBar = root.querySelector("[data-power-bar]");
  const countdown = root.querySelector("[data-countdown]");
  const countdownText = root.querySelector("[data-countdown-text]");
  const hint = root.querySelector("[data-hint]");
  const toast = root.querySelector("[data-toast]");
  const soundButton = root.querySelector("[data-sound]");
  const soundLabel = root.querySelector("[data-sound-label]");
  const qualityButton = root.querySelector("[data-quality]");
  const qualityLabel = root.querySelector("[data-quality-label]");

  let hintTimer = 0;
  let toastTimer = 0;
  let fadeTimer = 0;

  const labels = { shield: "SHIELD", magnet: "MAGNET", boost: "BOOST" };

  soundButton.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    soundButton.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
    soundLabel.textContent = `SOUND ${soundEnabled ? "ON" : "OFF"}`;
    options.onSound(soundEnabled);
    soundButton.blur();
  });

  qualityButton.addEventListener("click", () => {
    const order = ["low", "medium", "high"];
    quality = order[(order.indexOf(quality) + 1) % order.length];
    qualityLabel.textContent = `QUALITY ${quality.toUpperCase()}`;
    options.onQuality(quality);
    qualityButton.blur();
  });

  const setPowerup = (type, seconds, total) => {
    if (!type || seconds <= 0) {
      power.hidden = true;
      return;
    }
    power.hidden = false;
    power.className = `rr-power rr-power--${type}`;
    powerName.textContent = labels[type] || type;
    powerTime.textContent = `${Math.ceil(seconds)}s`;
    powerBar.style.width = `${Math.max(0, Math.min(100, (seconds / total) * 100))}%`;
  };

  const hidePowerup = () => {
    power.hidden = true;
  };

  const showCountdown = (text) => {
    countdown.hidden = false;
    countdown.classList.toggle("is-go", text === "GO");
    countdownText.textContent = text;
    countdownText.style.animation = "none";
    void countdownText.offsetWidth;
    countdownText.style.animation = "";
  };

  const hideCountdown = () => {
    countdown.hidden = true;
  };

  const showHint = (text = "Swipe to move · Arrows / WASD") => {
    hint.textContent = text;
    hint.hidden = false;
    hint.classList.remove("is-fading");
    window.clearTimeout(fadeTimer);
    window.clearTimeout(hintTimer);
    hintTimer = window.setTimeout(() => {
      hint.classList.add("is-fading");
      fadeTimer = window.setTimeout(() => {
        hint.hidden = true;
      }, 450);
    }, 5200);
  };

  const hideHint = () => {
    hint.hidden = true;
    window.clearTimeout(hintTimer);
    window.clearTimeout(fadeTimer);
  };

  const showToast = (text) => {
    toast.textContent = text;
    toast.classList.add("is-on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-on"), 2200);
  };

  const showLoading = () => {
    loading.hidden = false;
    loadingBar.style.width = "0%";
    loadingText.textContent = "Preparing the expedition?";
    loadingError.hidden = true;
    loadingRetry.hidden = true;
  };

  const setLoading = (loaded, total, label) => {
    const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
    loadingBar.style.width = pct + "%";
    loadingText.textContent = (label || "Loading") + " ? " + pct + "%";
  };

  const showLoadingError = (message, onRetry) => {
    loadingError.textContent = message || "The expedition could not be prepared.";
    loadingError.hidden = false;
    loadingText.textContent = "";
    loadingRetry.hidden = false;
    loadingRetry.onclick = () => {
      loadingRetry.hidden = true;
      loadingError.hidden = true;
      onRetry?.();
    };
  };

  const hideLoading = () => {
    loading.hidden = true;
  };

  const decorateOverlay = (mode) => {
    const panel = shell.overlay.querySelector(".game-overlay__panel");
    if (!panel) return;
    panel.classList.remove("rr-overlay--start", "rr-overlay--over");
    panel.querySelector(".rr-logo")?.remove();
    if (mode === "start" || mode === "over") {
      panel.classList.add(mode === "start" ? "rr-overlay--start" : "rr-overlay--over");
      const logo = document.createElement("img");
      logo.className = "rr-logo";
      logo.src = "/assets/images/games/ruin-runner-logo.svg";
      logo.alt = "Ruin Runner 3D";
      logo.decoding = "async";
      panel.prepend(logo);
    }
  };

  const setSound = (enabled) => {
    soundEnabled = enabled;
    soundButton.setAttribute("aria-pressed", enabled ? "true" : "false");
    soundLabel.textContent = `SOUND ${enabled ? "ON" : "OFF"}`;
  };

  const setQuality = (value) => {
    quality = value;
    qualityLabel.textContent = `QUALITY ${value.toUpperCase()}`;
  };

  const destroy = () => {
    window.clearTimeout(hintTimer);
    window.clearTimeout(toastTimer);
    window.clearTimeout(fadeTimer);
    root.remove();
    document.getElementById(STYLE_ID)?.remove();
  };

  return {
    showLoading,
    setLoading,
    showLoadingError,
    hideLoading,
    setPowerup,
    hidePowerup,
    showCountdown,
    hideCountdown,
    showHint,
    hideHint,
    showToast,
    decorateOverlay,
    setSound,
    setQuality,
    destroy,
  };
}
