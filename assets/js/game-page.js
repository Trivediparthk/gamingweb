import {
  getCategoryBySlug,
  getGameBySlug,
  getRelatedGames,
  slugifyCategory,
} from "./games-data.js?v=20261027herodeck";
import { renderGameCard } from "./components.js?v=20261027herodeck";
import { GameShell } from "./custom-games/game-shell.js";
import { icon } from "./icons.js?v=20261027herodeck";
import {
  escapeHTML,
  formatDate,
  getParam,
  initReveal,
  setMeta,
} from "./utilities.js";
import "./site-chrome.js?v=20261027herodeck";

const slug = getParam("game");
const game = getGameBySlug(slug);
const providerSlow = game?.playability === "provider-slow" || game?.playability === "provider-blocked";
const providerBlocked = game?.playability === "provider-blocked";
const providerIssue = providerSlow || providerBlocked;
const shellMount = document.querySelector("[data-game-shell]");
const main = document.querySelector("#main");

function setHeadData() {
  const canonical = `https://your-domain.example/game.html?game=${encodeURIComponent(game.slug)}`;
  const description = providerSlow
    ? `${game.description} The MadKidGames player can take up to a minute to start; the official game link is available if it does not load.`
    : `${game.description} Play ${game.title} free in your browser at Robloxsplay.`;
  setMeta({
    title: providerSlow
      ? `${game.title} - Provider preview at Robloxsplay`
      : `${game.title} ��� Play free at Robloxsplay`,
    description,
    canonical,
    type: "article",
  });
  document.querySelector('meta[property="og:image"]')?.setAttribute(
    "content",
    "https://your-domain.example/assets/images/og-cover.png",
  );
  document.querySelector('meta[property="og:url"]')?.setAttribute("content", canonical);
  const schema = document.createElement("script");
  schema.type = "application/ld+json";
  schema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.title,
    description: game.description,
    genre: game.category,
    gamePlatform: "Web browser",
    url: canonical,
    applicationCategory: "Game",
    operatingSystem: "Any",
    author: {
      "@type": "Organization",
      name: "Robloxsplay",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "GBP",
    },
  });
  document.head.appendChild(schema);
}

function paintDetails() {
  const categorySlug = slugifyCategory(game.category);
  const category = getCategoryBySlug(categorySlug);
  setHeadData();
  document
    .querySelector(".game-detail-hero")
    ?.style.setProperty("--game-cover", `url("${game.thumbnail}")`);
  document.querySelector("[data-game-eyebrow]").textContent =
    game.sourceType === "custom"
      ? "Original Robloxsplay game"
      : "Authorised third-party game";
  document.querySelector("[data-game-title]").textContent = game.title;
  document.querySelector("[data-game-tagline]").textContent = game.tagline;

  const playNote = document.querySelector("[data-play-note]");
  if (playNote) {
    const external = game.sourceType === "iframe" && game.embedUrl && !game.embedUrl.startsWith("/");
    playNote.innerHTML = external
      ? `<span aria-hidden="true">&#8599;</span> This is an authorised embed from ${escapeHTML(
          game.provider || "the provider",
        )}. Loading the game connects to the provider&rsquo;s servers and may use its cookies or advertising. Robloxsplay does not host or modify the game.${providerBlocked ? " MadKidGames reports that embedding is currently unavailable on this website; use the official game link below." : providerSlow ? " The provider player can take up to a minute to start; if it remains on Loading, use the official game link below." : ""}`
      : `<span aria-hidden="true">i</span> Play area runs locally in your browser. Best scores are stored only on this device. Nothing is uploaded.`;
  }

  document.querySelector("[data-game-badges]").innerHTML = `
    <a class="tag" href="/category.html?category=${categorySlug}">${escapeHTML(game.category)}</a>
    <span class="tag">${game.sourceType === "custom" ? "Original build" : "Authorised embed"}</span>
    <span class="tag">${escapeHTML(game.playtime)}</span>
    <span class="tag">${escapeHTML(game.difficulty)}</span>
    ${providerBlocked ? '<span class="tag">Provider embed restricted</span>' : providerSlow ? '<span class="tag">Provider load: slow</span>' : ""}
  `;

  const crumbs = document.querySelector("[data-game-breadcrumbs]");
  crumbs.innerHTML = `
    <a href="/index.html">Home</a><span class="breadcrumbs__sep" aria-hidden="true">/</span>
    <a href="/all-games.html">All games</a><span class="breadcrumbs__sep" aria-hidden="true">/</span>
    ${category ? `<a href="/category.html?category=${category.slug}">${escapeHTML(category.name)}</a><span class="breadcrumbs__sep" aria-hidden="true">/</span>` : ""}
    <span aria-current="page">${escapeHTML(game.title)}</span>
  `;

  document.querySelector("[data-game-instructions]").textContent = game.instructions;
  document.querySelector("[data-game-controls]").innerHTML = game.controls
    .map(
      (control) =>
        `<li><span>${escapeHTML(control.label)}</span><kbd>${escapeHTML(control.value)}</kbd></li>`,
    )
    .join("");

  document.querySelector("[data-game-facts-list]").innerHTML = `
    <div><dt>Category</dt><dd>${escapeHTML(game.category)}</dd></div>
    <div><dt>Playtime</dt><dd>${escapeHTML(game.playtime)}</dd></div>
    <div><dt>Released</dt><dd>${escapeHTML(formatDate(game.releaseDate))}</dd></div>
    <div><dt>Developer</dt><dd>${escapeHTML(game.developerOrProvider)}</dd></div>
    <div><dt>Build</dt><dd>${
      game.renderer === "3d"
        ? "Original 3D / WebGL"
        : game.renderer === "dom"
          ? "Original HTML5 / DOM + CSS"
          : game.sourceType === "custom"
            ? "Original HTML5 / Canvas"
            : game.embedUrl?.startsWith("/")
              ? "Self-hosted 3D build"
              : "Authorised iframe"
    }</dd></div>
  `;

  document.querySelector("[data-game-license]").textContent = game.licenseReference;
  document.querySelector("[data-about-heading]").textContent =
    `${game.title} / Studio note`;
  document.querySelector("[data-about-description]").textContent =
    game.description;
  document.querySelector("[data-about-tags]").innerHTML = (() => {
    const seen = new Set();
    return [...game.categories, ...(game.tags || [])]
      .filter((name) => {
        const key = name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((name) => `<span class="tag">${escapeHTML(name)}</span>`)
      .join("");
  })();
  document.querySelector("[data-game-about]").hidden = false;

  const related = getRelatedGames(game, 3);
  document.querySelector("[data-related-games]").innerHTML = related
    .map((relatedGame, index) => renderGameCard(relatedGame, { index }))
    .join("");
  initReveal();
}

function renderUnavailableGame() {
  if (!main) return;
  document.title = "Game not found � Robloxsplay";
  main.innerHTML = `
    <div class="container section">
      <div class="game-unavailable">
        <p class="eyebrow">404 / Game not found</p>
        <h1 style="margin-top:1rem;font-size:clamp(2.6rem,6vw,5rem);letter-spacing:-.04em;text-transform:uppercase">That game<br>is not here.</h1>
        <p>The game link may be outdated, or the title has not been published. Robloxsplay never exposes invented embeds or unfinished game pages.</p>
        <div class="not-found__actions" style="justify-content:flex-start">
          <a class="button" href="/all-games.html">All games ${icon("arrow")}</a>
          <a class="button button--ghost" href="/index.html">Home</a>
        </div>
      </div>
    </div>
  `;
}

function customGameError(message = "") {
  return `
    <div class="game-unavailable" role="alert">
      <p class="eyebrow">Playback error</p>
      <h2 style="margin-top:.6rem">This game could not start.</h2>
      <p>${escapeHTML(message) || "The game module did not load. This can happen if a file is missing or the browser blocked a required feature."}</p>
      <div class="not-found__actions" style="justify-content:flex-start;margin-top:1.2rem">
        <button class="button" type="button" data-retry-game>Retry ${icon("restart")}</button>
        <a class="button button--ghost" href="/all-games.html">All games</a>
      </div>
    </div>
  `;
}

async function mountCustomGame() {
  let shell = null;
  try {
    const module = await import(
      game.module === "royal-wood-chess"
        ? `./custom-games/${game.module}.js?v=20261027`
        : `./custom-games/${game.module}.js`,
    );
    if (typeof module.default !== "function") {
      throw new Error("Game module has no default export.");
    }
    shell = new GameShell(shellMount, game, {
      bestMode: game.bestMode || "higher",
      bestLabel: game.bestLabel || "Best",
      scoreLabel: game.scoreLabel || "Score",
      renderer: game.renderer === "3d" ? "3d" : game.renderer === "dom" ? "dom" : "2d",
    });
    const instance = module.default(shell);
    window.addEventListener(
      "pagehide",
      () => {
        instance?.destroy?.();
        shell.destroy();
      },
      { once: true },
    );
  } catch (error) {
    console.error("Robloxsplay game failed to load:", error);
    shell?.destroy();
    shellMount.innerHTML = customGameError();
    shellMount.querySelector("[data-retry-game]")?.addEventListener("click", () => {
      shellMount.innerHTML = '<div class="game-loading-skeleton"><span class="game-loading-skeleton__mark">Reloading game�</span></div>';
      mountCustomGame();
    });
  }
}

function mountMadKidGame() {
  const officialUrl = game.providerUrl || game.embedUrl;

  shellMount.innerHTML = `
    <div class="madkid-embed" data-madkid-embed>
      <div class="madkid-embed__bar">
        <div class="madkid-embed__status">
          <span class="status-dot" aria-hidden="true"></span>
          <span>Official MadKidGames embed</span>
        </div>
        <button class="game-tool" type="button" data-madkid-fullscreen aria-label="Enter fullscreen">
          ${icon("fullscreen")}<span class="game-tool__label">Fullscreen</span>
        </button>
      </div>
      <div class="madkid-embed__frame">
        <div class="madkid-embed__loading" data-madkid-loading role="status">
          <span class="embed-loader" aria-hidden="true"></span>
          <span>Loading provider player...</span>
        </div>
        <iframe
          data-madkid-frame
          src="${escapeHTML(game.embedUrl)}"
          title="${escapeHTML(game.title)}"
          width="100%"
          height="540"
          frameborder="0"
          allowfullscreen
          scrolling="no"
          loading="lazy"
          referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
      <div class="madkid-embed__meta">
        <p class="madkid-embed__credit">
          <a href="${escapeHTML(officialUrl)}" target="_blank" rel="noopener noreferrer">Play ${escapeHTML(game.title)}</a>
        </p>
        <p class="madkid-embed__fallback">
          Game not loading? <a href="${escapeHTML(officialUrl)}" target="_blank" rel="noopener noreferrer">Open ${escapeHTML(game.title)} on MadKidGames</a>.
        </p>
        <p class="madkid-embed__provider">Embedded from MadKidGames. Robloxsplay does not host or modify the game.</p>
      </div>
      ${providerIssue ? `<div class="madkid-embed__slow" data-madkid-slow role="status" aria-live="polite"${providerBlocked ? "" : " hidden"}>
        <p>${providerBlocked ? "MadKidGames reports that embedding is currently unavailable on this website. Open the official game to play." : "Still on the provider&rsquo;s loading screen? MadKidGames can take up to a minute to start. If it does not, open the official game."}</p>
        <a class="button button--small" href="${escapeHTML(officialUrl)}" target="_blank" rel="noopener noreferrer">Open official game</a>
      </div>` : ""}
      <noscript>
        <p class="madkid-embed__fallback">
          <a href="${escapeHTML(officialUrl)}">Play ${escapeHTML(game.title)}</a>
        </p>
      </noscript>
    </div>
  `;

  const wrapper = shellMount.querySelector("[data-madkid-embed]");
  const frame = shellMount.querySelector("[data-madkid-frame]");
  const loading = shellMount.querySelector("[data-madkid-loading]");
  const slow = shellMount.querySelector("[data-madkid-slow]");
  const fullscreen = shellMount.querySelector("[data-madkid-fullscreen]");

  const revealPlayer = () => {
    wrapper?.classList.add("is-loaded");
    loading?.setAttribute("aria-hidden", "true");
  };
  frame?.addEventListener("load", revealPlayer);
  window.setTimeout(revealPlayer, 4000);

  if (providerSlow && slow) {
    const showSlowState = () => {
      slow.hidden = false;
      wrapper?.classList.add("is-slow");
    };
    frame?.addEventListener("error", showSlowState);
    window.setTimeout(showSlowState, 20000);
  }

  fullscreen?.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement === wrapper) await document.exitFullscreen();
      else await wrapper.requestFullscreen();
    } catch {
      // Some browsers refuse fullscreen for cross-origin embeds; the provider
      // player's own fullscreen control remains available inside the frame.
    }
  });
}

function mountIframeGame() {
  if (game.provider === "MadKidGames") {
    mountMadKidGame();
    return;
  }

  if (!game.embedUrl || game.status !== "ready") {
    shellMount.innerHTML = `
      <div class="game-unavailable">
        <p class="eyebrow">Integration pending</p>
        <h2 style="margin-top:.6rem">This game is not published yet.</h2>
        <p>${escapeHTML(
          game.licenseReference ||
            "No authorised embed URL has been supplied for this title.",
        )} Robloxsplay does not display unverified third-party embeds or invent provider links.</p>
        <div class="not-found__actions" style="justify-content:flex-start;margin-top:1.2rem">
          <a class="button" href="/all-games.html">Play a Robloxsplay original ${icon("arrow")}</a>
        </div>
      </div>
    `;
    return;
  }

  const selfHosted = Boolean(game.embedUrl && game.embedUrl.startsWith("/"));

  shellMount.innerHTML = `
    <div class="game-shell" data-embed-shell>
      <div class="game-toolbar">
        <div class="game-toolbar__status">
          <span class="status-dot" aria-hidden="true"></span>
          <span>${selfHosted ? "Self-hosted 3D title" : "Authorised third-party game"}</span>
        </div>
        <div class="game-toolbar__actions">
          <button class="game-tool" type="button" data-embed-fullscreen aria-label="Enter fullscreen">
            ${icon("fullscreen")}<span class="game-tool__label">Fullscreen</span>
          </button>
        </div>
      </div>
      <div class="game-stage" data-embed-stage>
        <div class="embed-state" data-embed-state>
          <div class="embed-state__inner">
            <span class="game-overlay__mark" aria-hidden="true">${icon("play")}</span>
            <p class="game-overlay__kicker">${selfHosted ? "Playable in browser" : "External game"}</p>
            <h2>${escapeHTML(game.title)}</h2>
            <p>${
              selfHosted
                ? "This game runs from Robloxsplay's own files. It uses WebGPU where available and falls back to WebGL2 otherwise."
                : "This game is provided in an embedded player. Loading it may connect to the provider's servers."
            }</p>
            <div class="game-overlay__actions">
              <button class="button" type="button" data-load-embed>Load game</button>
            </div>
            ${game.providerAttribution ? `<p class="game-overlay__hint">${escapeHTML(game.providerAttribution)}</p>` : ""}
          </div>
        </div>
      </div>
      <div class="game-shell__footer">
        <span>${icon("external")} ${selfHosted ? "Runs from Robloxsplay files" : "Third-party content"}</span>
        <span>${selfHosted ? "No external provider connection" : "Provider branding and links are preserved"}</span>
      </div>
    </div>
  `;

  const shell = shellMount.querySelector("[data-embed-shell]");
  const stage = shellMount.querySelector("[data-embed-stage]");
  const state = shellMount.querySelector("[data-embed-state]");
  const start = shellMount.querySelector("[data-load-embed]");
  const fullscreen = shellMount.querySelector("[data-embed-fullscreen]");

  const showLoading = () => {
    state.hidden = false;
    state.className = "embed-state";
    state.innerHTML = `
      <div class="embed-state__inner">
        <div class="embed-loader" aria-hidden="true"></div>
        <h2>Loading game</h2>
        <p>${selfHosted ? "Starting the self-hosted build. This may take a few seconds." : "Connecting to the authorised provider. This may take a few seconds."}</p>
      </div>
    `;
  };

  const showError = () => {
    state.hidden = false;
    state.className = "embed-state embed-error";
    state.innerHTML = `
      <div class="embed-state__inner">
        <h2>The game did not load.</h2>
        <p>${
          selfHosted
            ? "The local game files may be missing, or your browser could not start the renderer. Try again, or read the game instructions for browser requirements."
            : "The provider may be temporarily unavailable, or your browser may have blocked the embed."
        } The rest of Robloxsplay remains available.</p>
        <div class="game-overlay__actions">
          <button class="button" type="button" data-load-embed>Try again</button>
          <a class="button button--ghost" href="/all-games.html">Browse Robloxsplay games</a>
        </div>
      </div>
    `;
    state.querySelector("[data-load-embed]")?.addEventListener("click", load);
  };

  const load = () => {
    showLoading();
    stage.querySelectorAll("iframe").forEach((node) => node.remove());
    const iframe = document.createElement("iframe");
    iframe.className = "game-embed";
    iframe.src = game.embedUrl;
    iframe.title = `${game.title} game`;
    iframe.loading = "eager";
    iframe.tabIndex = 0;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    if (game.allowFullscreen !== false) {
      iframe.allowFullscreen = true;
      iframe.setAttribute("allow", "fullscreen; autoplay; gamepad; pointer-lock");
    }
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (!settled) showError();
    }, 15000);
    iframe.addEventListener("load", () => {
      settled = true;
      window.clearTimeout(timeout);
      state.hidden = true;
      try {
        iframe.focus();
      } catch {
        // Focus can be refused by some browsers; the user can click the frame.
      }
    });
    iframe.addEventListener("error", () => {
      settled = true;
      window.clearTimeout(timeout);
      showError();
    });
    stage.appendChild(iframe);
  };

  start.addEventListener("click", load);
  fullscreen.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement === shell) await document.exitFullscreen();
      else await shell.requestFullscreen();
    } catch {
      // Fullscreen can be disabled by the embedding browser; no failure UI is needed.
    }
  });
}

if (!game) {
  renderUnavailableGame();
} else if (game.sourceType === "custom" && game.status === "ready") {
  paintDetails();
  mountCustomGame();
} else if (game.sourceType === "iframe") {
  paintDetails();
  mountIframeGame();
} else {
  paintDetails();
  shellMount.innerHTML = customGameError("This game is not approved for publication.");
}

if (main && game) {
  window.setTimeout(() => {
    const live = document.querySelector("#live-region");
    if (live) live.textContent = `${game.title} game page loaded.`;
  }, 400);
}

