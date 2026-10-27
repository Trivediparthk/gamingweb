import { icon, categoryIcon } from "./icons.js?v=20261027herodeck";
import { escapeHTML } from "./utilities.js";

const pad = (number) => String(number).padStart(2, "0");

export function renderGameCard(game, { index = 0, variant = "default", eager = false } = {}) {
  const providerIssue = game.playability === "provider-slow" || game.playability === "provider-blocked";
  const playLabel = providerIssue
    ? "View provider status"
    : game.status === "ready"
      ? "Play game"
      : "Details";
  const loading = eager ? "eager" : "lazy";
  const is3D = game.renderer === "3d";
  const originLabel = game.provider
    ? `Via ${game.provider}`
    : is3D
      ? "Robloxsplay 3D"
      : game.sourceType === "custom"
        ? "Robloxsplay original"
        : "Licensed title";
  return `
    <article class="game-card game-card--${variant} accent-${game.accent}${is3D ? " game-card--3d" : ""}" data-reveal>
      <a class="game-card__link" href="/game.html?game=${encodeURIComponent(game.slug)}" aria-label="${escapeHTML(playLabel)}: ${escapeHTML(game.title)}">
        <div class="game-card__media">
          <img src="${escapeHTML(game.thumbnail)}" alt="${escapeHTML(game.thumbnailAlt)}" width="800" height="500" loading="${loading}" decoding="async" onerror="this.onerror=null;this.src='/assets/images/placeholders/game-generic.svg';">
          <div class="game-card__wash" aria-hidden="true"></div>
          <div class="game-card__topline">
            <span class="game-card__type"><span class="game-card__dot"></span>${originLabel}</span>
            <span class="game-card__index">${pad(index + 1)}</span>
          </div>
          ${is3D ? '<span class="game-card__badge" aria-hidden="true">3D</span>' : ""}
          <span class="game-card__play" aria-hidden="true">${icon("play")}<span>${providerIssue ? "Provider check" : game.status === "ready" ? "Play" : "Preview"}</span></span>
        </div>
        <div class="game-card__body">
          <div class="game-card__meta">
            <span>${escapeHTML(game.category)}</span>
            <span aria-hidden="true">/</span>
            <span>${escapeHTML(game.playtime)}</span>
          </div>
          <h3 class="game-card__title">${escapeHTML(game.title)}</h3>
          <p class="game-card__text">${escapeHTML(game.tagline)}</p>
        </div>
      </a>
    </article>
  `;
}

export function renderGameGrid(
  games,
  { className = "game-grid", startIndex = 0, variant = "default" } = {},
) {
  return `
    <div class="${className}">
      ${games
        .map((game, index) =>
          renderGameCard(game, { index: startIndex + index, variant }),
        )
        .join("")}
    </div>
  `;
}

export function renderCategoryCard(category, index = 0) {
  const countLabel = `${category.count} ${category.count === 1 ? "game" : "games"}`;
  return `
    <a class="category-card accent-${index % 3 === 0 ? "lime" : index % 3 === 1 ? "cyan" : "violet"}" href="/category.html?category=${encodeURIComponent(category.slug)}" data-reveal>
      <span class="category-card__index">${pad(index + 1)}</span>
      <span class="category-card__icon" aria-hidden="true">${categoryIcon(category.icon)}</span>
      <span class="category-card__copy">
        <strong>${escapeHTML(category.name)}</strong>
        <span>${escapeHTML(category.tagline)}</span>
      </span>
      <span class="category-card__count">${countLabel}</span>
      <span class="category-card__arrow" aria-hidden="true">${icon("arrowUpRight")}</span>
    </a>
  `;
}

export function renderEmptyState({
  title = "Nothing on this frequency.",
  body = "Try a different search or clear the active filters.",
  actionLabel = "Reset filters",
  actionHref = "/all-games.html",
  actionAttribute = "",
} = {}) {
  return `
    <div class="empty-state" role="status">
      <span class="empty-state__mark" aria-hidden="true">${icon("grid")}</span>
      <p class="eyebrow">No matches</p>
      <h2>${escapeHTML(title)}</h2>
      <p>${escapeHTML(body)}</p>
      <a class="button button--ghost" href="${escapeHTML(actionHref)}" ${actionAttribute}>${escapeHTML(actionLabel)}${icon("arrow")}</a>
    </div>
  `;
}

export function renderIntegrationNotice(game) {
  const statusCopy = {
    ready: "Authorised integration ready.",
    "needs-embed-url": "Awaiting the provider's official embed URL.",
    "needs-license-review": "Awaiting written licence confirmation.",
  };
  return `
    <div class="integration-notice" role="status">
      <span class="integration-notice__icon" aria-hidden="true">${icon("info")}</span>
      <div>
        <strong>Third-party title not published</strong>
        <p>${escapeHTML(statusCopy[game.status] || statusCopy["needs-embed-url"])} Robloxsplay does not publish unverified embeds or invent provider links.</p>
      </div>
    </div>
  `;
}
