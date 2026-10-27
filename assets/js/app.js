import {
  GAMES,
  getCuratedGames,
  getFeaturedGames,
  getPopulatedCategories,
  sortGames,
} from "./games-data.js?v=20261027herodeck";
import { renderCategoryCard, renderGameCard } from "./components.js?v=20261027herodeck";
import { icon } from "./icons.js?v=20261027herodeck";
import { escapeHTML, initReveal, prefersReducedMotion } from "./utilities.js";
import "./site-chrome.js?v=20261027herodeck";

const uniqueGames = (games) => {
  const seen = new Set();
  return games.filter((game) => {
    if (seen.has(game.slug)) return false;
    seen.add(game.slug);
    return true;
  });
};

const heroPicks = [
  "toca-boca-life-neighborhood",
  "world-cricket-championship-wcc-lite",
  "it-girl-story-celebrity-life",
]
  .map((slug) => GAMES.find((game) => game.slug === slug))
  .filter(Boolean);

const firstSectionExcluded = new Set(["neon-snake", "orbit-pong", "prism-breaker"]);

const heroGames = uniqueGames([
  ...heroPicks,
  ...getFeaturedGames(),
  ...getCuratedGames(),
])
  .slice(0, 7)
  .filter((game) => !firstSectionExcluded.has(game.slug));

const quickGames = uniqueGames([
  ...getFeaturedGames(),
  ...getCuratedGames(),
  ...GAMES,
])
  .filter((game) => !firstSectionExcluded.has(game.slug))
  .slice(0, 5);

const trendingGames = ["prism-breaker", "meteor-defender", "target-tap", "logic-tiles"]
  .map((slug) => GAMES.find((game) => game.slug === slug))
  .filter(Boolean);
const newestGames = sortGames(GAMES, "newest").slice(0, 9);

function renderHeroDeck() {
  const mount = document.querySelector("[data-hero-deck]");
  if (!mount || !heroGames.length) return;

  const first = heroGames[0];
  mount.innerHTML = `
    <div class="game-deck" data-deck>
      <div class="game-deck__screen" id="hero-deck-panel" role="tabpanel" tabindex="0" aria-labelledby="deck-tab-${first.slug}">
        <img class="game-deck__art" data-deck-art src="${escapeHTML(first.thumbnail)}" alt="${escapeHTML(first.thumbnailAlt)}" width="800" height="500">
        <video class="game-deck__video" data-deck-video muted loop playsinline preload="metadata" aria-hidden="true"></video>
        <span class="game-deck__scanlines" aria-hidden="true"></span>
        <span class="game-deck__corner game-deck__corner--tl" aria-hidden="true"></span>
        <span class="game-deck__corner game-deck__corner--tr" aria-hidden="true"></span>
        <span class="game-deck__corner game-deck__corner--bl" aria-hidden="true"></span>
        <span class="game-deck__corner game-deck__corner--br" aria-hidden="true"></span>
        <div class="game-deck__hud">
          <span class="game-deck__badge" data-deck-badge><i aria-hidden="true"></i>Featured game</span>
          <span class="game-deck__counter" data-deck-counter>01 / ${String(heroGames.length).padStart(2, "0")}</span>
        </div>
        <span class="game-deck__ready" data-deck-ready>Ready to play</span>
        <div class="game-deck__content">
          <span class="game-deck__category" data-deck-category>${escapeHTML(first.category)}</span>
          <h2 class="game-deck__title" data-deck-title>${escapeHTML(first.title)}</h2>
          <p class="game-deck__desc" data-deck-desc>${escapeHTML(first.tagline)}</p>
          <div class="game-deck__actions">
            <a class="button button--small game-deck__play" href="/game.html?game=${encodeURIComponent(first.slug)}" data-deck-play aria-label="Play ${escapeHTML(first.title)}">
              ${icon("play")}<span data-deck-play-label>Play now</span>
            </a>
            <span class="game-deck__time" data-deck-time>${escapeHTML(first.playtime)} / ${escapeHTML(first.difficulty)}</span>
          </div>
        </div>
        <div class="game-deck__progress" aria-hidden="true"><span></span></div>
      </div>
      <div class="game-deck__tabs" role="tablist" aria-label="Choose a featured game">
        ${heroGames
          .map(
            (game, index) => `
              <button class="game-deck__tab${index === 0 ? " is-active" : ""}" type="button" role="tab" id="deck-tab-${game.slug}" aria-selected="${index === 0}" aria-controls="hero-deck-panel" tabindex="${index === 0 ? "0" : "-1"}" data-deck-tab="${index}">
                <span class="game-deck__tab-art"><img src="${escapeHTML(game.thumbnail)}" alt="" width="800" height="500" loading="lazy"></span>
                <span class="game-deck__tab-copy"><strong>${escapeHTML(game.title)}</strong><small>${escapeHTML(game.category)}</small></span>
              </button>
            `,
          )
          .join("")}
      </div>
    </div>
  `;

  const deck = mount.querySelector("[data-deck]");
  const tabs = [...mount.querySelectorAll("[data-deck-tab]")];
  const panel = mount.querySelector("#hero-deck-panel");
  const playLink = mount.querySelector("[data-deck-play]");
  const art = mount.querySelector("[data-deck-art]");
  const video = mount.querySelector("[data-deck-video]");
  const badge = mount.querySelector("[data-deck-badge]");
  const playLabel = mount.querySelector("[data-deck-play-label]");
  const ready = mount.querySelector("[data-deck-ready]");
  const title = mount.querySelector("[data-deck-title]");
  const category = mount.querySelector("[data-deck-category]");
  const desc = mount.querySelector("[data-deck-desc]");
  const time = mount.querySelector("[data-deck-time]");
  const counter = mount.querySelector("[data-deck-counter]");
  const progress = mount.querySelector(".game-deck__progress span");
  const reducedMotion = prefersReducedMotion();
  const autoEnabled =
    !reducedMotion && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let activeIndex = 0;
  let switchTimer = 0;
  let autoTimer = 0;
  let deckVisible = true;
  let deckHovered = false;
  let deckFocused = false;

  const restartProgress = () => {
    if (!autoEnabled) return;
    progress.style.animation = "none";
    void progress.offsetWidth;
    progress.style.animation = "";
  };

  if (video) {
    video.addEventListener("playing", () => deck.classList.add("has-video"));
    video.addEventListener("error", () => {
      deck.classList.remove("has-video");
      video.hidden = true;
    });
  }

  const paint = (index) => {
    const game = heroGames[index];
    const hasVideo = Boolean(game.previewVideo) && !reducedMotion;
    activeIndex = index;
    art.src = game.thumbnail;
    art.alt = game.thumbnailAlt;
    if (badge) badge.lastChild.textContent = hasVideo ? "Provider video preview" : "Featured game";
    if (playLabel) playLabel.textContent = game.playability === "provider-slow" ? "View provider page" : "Play now";
    if (ready) ready.textContent = game.playability === "provider-slow" ? "Provider preview" : "Ready to play";
    if (video) {
      if (!hasVideo) {
        video.pause();
        video.hidden = true;
        video.removeAttribute("src");
        video.load();
        deck.classList.remove("has-video");
      } else {
        video.hidden = false;
        video.poster = game.thumbnail;
        if (video.dataset.slug !== game.slug) {
          video.dataset.slug = game.slug;
          video.src = game.previewVideo;
          video.load();
        }
        video.play().catch(() => {
          deck.classList.remove("has-video");
        });
      }
    }
    title.textContent = game.title;
    category.textContent = game.category;
    desc.textContent = game.tagline;
    time.textContent = `${game.playtime} / ${game.difficulty}`;
    counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(heroGames.length).padStart(2, "0")}`;
    playLink.href = `/game.html?game=${encodeURIComponent(game.slug)}`;
    playLink.setAttribute("aria-label", `${game.playability === "provider-slow" ? "View provider page for" : "Play"} ${game.title}`);
    panel.setAttribute("aria-labelledby", `deck-tab-${game.slug}`);
    tabs.forEach((tab, tabIndex) => {
      const active = tabIndex === index;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    restartProgress();
  };

  const switchTo = (index, { animate = true } = {}) => {
    const next = (index + heroGames.length) % heroGames.length;
    if (next === activeIndex) return;
    activeIndex = next;
    window.clearTimeout(switchTimer);
    if (animate && !reducedMotion) {
      deck.classList.add("is-switching");
      switchTimer = window.setTimeout(() => {
        paint(next);
        deck.classList.remove("is-switching");
      }, 160);
    } else {
      paint(next);
      deck.classList.remove("is-switching");
    }
  };

  const stopAuto = () => {
    window.clearInterval(autoTimer);
    autoTimer = 0;
    deck.classList.remove("is-autoplay");
    progress.style.animation = "none";
  };

  const startAuto = () => {
    if (!autoEnabled || !deckVisible || deckHovered || deckFocused || document.hidden) return;
    stopAuto();
    deck.classList.add("is-autoplay");
    restartProgress();
    autoTimer = window.setInterval(() => {
      switchTo(activeIndex + 1);
    }, 7500);
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      switchTo(Number(tab.dataset.deckTab));
    });
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = activeIndex;
      if (event.key === "ArrowRight") nextIndex = (activeIndex + 1) % heroGames.length;
      if (event.key === "ArrowLeft") nextIndex = (activeIndex - 1 + heroGames.length) % heroGames.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = heroGames.length - 1;
      switchTo(nextIndex, { animate: false });
      tabs[nextIndex].focus();
    });
  });

  deck.addEventListener("mouseenter", () => {
    deckHovered = true;
    stopAuto();
  });
  deck.addEventListener("mouseleave", () => {
    deckHovered = false;
    startAuto();
  });
  deck.addEventListener("focusin", () => {
    deckFocused = true;
    stopAuto();
  });
  deck.addEventListener("focusout", (event) => {
    if (deck.contains(event.relatedTarget)) return;
    deckFocused = false;
    startAuto();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAuto();
    else startAuto();
  });
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        deckVisible = entries[0]?.isIntersecting ?? true;
        if (deckVisible) startAuto();
        else stopAuto();
      },
      { threshold: 0.2 },
    );
    observer.observe(deck);
  }

  paint(0);
  if (autoEnabled) startAuto();
}

function renderQuickplay() {
  const mount = document.querySelector("[data-quickplay]");
  if (!mount) return;
  mount.innerHTML = quickGames
    .map(
      (game) => `
        <a class="quickplay-card accent-${game.accent}" href="/game.html?game=${encodeURIComponent(game.slug)}" aria-label="Play ${escapeHTML(game.title)}">
          <span class="quickplay-card__art"><img src="${escapeHTML(game.thumbnail)}" alt="" width="800" height="500" loading="lazy"></span>
          <span class="quickplay-card__copy"><strong>${escapeHTML(game.title)}</strong><span>${escapeHTML(game.category)}</span></span>
          <span class="quickplay-card__arrow" aria-hidden="true">${icon("play")}</span>
        </a>
      `,
    )
    .join("");
}

function renderCategories() {
  const grid = document.querySelector("[data-category-grid]");
  if (!grid) return;
  grid.innerHTML = getPopulatedCategories()
    .map((category, index) => renderCategoryCard(category, index))
    .join("");
}

function renderSections() {
  const trending = document.querySelector("[data-trending-grid]");
  if (trending) {
    trending.innerHTML = trendingGames
      .map((game, index) => renderGameCard(game, { index }))
      .join("");
  }
  const newest = document.querySelector("[data-new-grid]");
  if (newest) {
    newest.innerHTML = newestGames
      .map((game, index) => renderGameCard(game, { index: index + 4 }))
      .join("");
  }
}

function setupRandomGame() {
  document.querySelectorAll("[data-random-game]").forEach((link) => {
    const choices = GAMES.filter((game) => game.status === "ready");
    if (!choices.length) return;
    const game = choices[Math.floor(Math.random() * choices.length)];
    link.setAttribute("href", `/game.html?game=${encodeURIComponent(game.slug)}`);
    link.setAttribute("aria-label", `Surprise me: play ${game.title}`);
  });
}

function setupRevealDelays() {
  document
    .querySelectorAll(".game-grid > *, .category-grid > *, .quickplay-track > *")
    .forEach((node, index) => {
      if (!node.style.getPropertyValue("--reveal-delay")) {
        node.style.setProperty("--reveal-delay", `${Math.min(index, 6) * 55}ms`);
      }
    });
}

renderHeroDeck();
renderQuickplay();
renderSections();
renderCategories();
setupRandomGame();
setupRevealDelays();
initReveal();
