import {
  GAMES,
  getCategoryBySlug,
  getGamesByCategory,
  getPopulatedCategories,
  searchGames,
  sortGames,
} from "./games-data.js?v=20261027herodeck";
import { renderGameGrid } from "./components.js?v=20261027herodeck";
import { icon } from "./icons.js?v=20261027herodeck";
import {
  announce,
  debounce,
  escapeHTML,
  getParam,
  initReveal,
  setMeta,
  setParams,
} from "./utilities.js";
import "./site-chrome.js?v=20261027herodeck";

const categoryData = getPopulatedCategories();
const validSorts = new Set(["curated", "newest", "title"]);
const searchForm = document.querySelector("[data-catalog-search-form]");
const searchInput = document.querySelector("#catalog-search");
const clearSearchButton = document.querySelector("[data-clear-search]");
const sortSelect = document.querySelector("[data-sort]");
const resetButton = document.querySelector("[data-reset-filters]");
const chips = document.querySelector("[data-filter-chips]");
const results = document.querySelector("[data-catalog-results]");
const empty = document.querySelector("[data-catalog-empty]");
const resultCount = document.querySelector("[data-result-count]");
const filterLabel = document.querySelector("[data-filter-label]");
const activeFilter = document.querySelector("[data-active-filter]");
const activeFilterLabel = document.querySelector("[data-active-filter-label]");

const state = {
  query: getParam("q"),
  category: getParam("category", "all"),
  sort: validSorts.has(getParam("sort")) ? getParam("sort") : "curated",
};

if (searchInput) searchInput.value = state.query;
if (sortSelect) sortSelect.value = state.sort;

function categoryName() {
  return getCategoryBySlug(state.category)?.name || "";
}

function getResults() {
  let games = getGamesByCategory(state.category);
  if (state.query.trim()) games = searchGames(state.query, games);
  return sortGames(games, state.sort);
}

function renderChips() {
  if (!chips) return;
  const items = [
    `<button class="filter-chip${state.category === "all" ? " is-active" : ""}" type="button" data-category="all" aria-pressed="${state.category === "all"}">All <span>${String(GAMES.length).padStart(2, "0")}</span></button>`,
    ...categoryData.map(
      (category) => `
        <button class="filter-chip${state.category === category.slug ? " is-active" : ""}" type="button" data-category="${category.slug}" aria-pressed="${state.category === category.slug}">
          ${escapeHTML(category.name)} <span>${String(category.count).padStart(2, "0")}</span>
        </button>`,
    ),
  ];
  chips.innerHTML = items.join("");
}

function renderEmptyState() {
  const hasFilters = state.query.trim() || state.category !== "all";
  const queryCopy = state.query.trim()
    ? `Nothing matches “${escapeHTML(state.query.trim())}”${categoryName() ? ` in ${escapeHTML(categoryName())}` : ""}.`
    : `There are no playable games in ${escapeHTML(categoryName() || "this category")} right now.`;
  return `
    <div class="empty-state" role="status">
      <span class="empty-state__mark" aria-hidden="true">${icon("grid")}</span>
      <p class="eyebrow">No matches</p>
      <h2>Nothing on this frequency.</h2>
      <p>${hasFilters ? queryCopy : "The catalogue is being updated. Try again in a moment."} Try a broader search or reset the filters.</p>
      <button class="button button--ghost" type="button" data-empty-reset>Reset filters ${icon("restart")}</button>
    </div>
  `;
}

function updateChrome(games) {
  const count = games.length;
  if (resultCount) {
    resultCount.textContent = `${count} ${count === 1 ? "game" : "games"}`;
  }
  if (filterLabel) {
    const context = state.query.trim()
      ? `matching “${state.query.trim()}”`
      : state.category !== "all"
        ? `in ${categoryName()}`
        : "in the collection";
    filterLabel.textContent = context;
  }
  if (clearSearchButton) clearSearchButton.hidden = !state.query.trim();
  if (activeFilter) activeFilter.hidden = state.category === "all";
  if (activeFilterLabel) activeFilterLabel.textContent = categoryName();
  if (chips) {
    chips.querySelectorAll("[data-category]").forEach((chip) => {
      const active = chip.dataset.category === state.category;
      chip.classList.toggle("is-active", active);
      chip.setAttribute("aria-pressed", String(active));
    });
  }
}

function updateMeta(games) {
  const cat = getCategoryBySlug(state.category);
  let title = "All Games — Robloxsplay";
  let description =
    "Browse twenty-seven browser games: Robloxsplay originals plus licensed and authorised third-party titles across arcade, puzzle, action, runner, racing, cooking, kids, educational, simulation and more.";
  if (state.query.trim()) {
    title = `Search: ${state.query.trim()} — Robloxsplay`;
    description = `Search results for ${state.query.trim()} at Robloxsplay. ${games.length} browser games found.`;
  } else if (cat) {
    title = `${cat.name} Games — Robloxsplay`;
    description = `${cat.description} Browse ${cat.name} games at Robloxsplay.`;
  }
  setMeta({ title, description });
}

function render({ announceResult = false } = {}) {
  const games = getResults();
  renderChips();
  updateChrome(games);
  updateMeta(games);
  setParams({
    q: state.query.trim(),
    category: state.category,
    sort: state.sort === "curated" ? "" : state.sort,
  });

  if (games.length) {
    empty.hidden = true;
    results.hidden = false;
    results.innerHTML = renderGameGrid(games);
    initReveal(results);
    if (announceResult) {
      announce(`${games.length} ${games.length === 1 ? "game" : "games"} found.`);
    }
  } else {
    results.innerHTML = "";
    results.hidden = true;
    empty.hidden = false;
    empty.innerHTML = renderEmptyState();
    if (announceResult) announce("No games match the active filters.");
  }
}

function resetFilters() {
  state.query = "";
  state.category = "all";
  state.sort = "curated";
  if (searchInput) searchInput.value = "";
  if (sortSelect) sortSelect.value = "curated";
  render({ announceResult: true });
  searchInput?.focus();
}

chips?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  state.category = button.dataset.category;
  render({ announceResult: true });
});

sortSelect?.addEventListener("change", () => {
  state.sort = validSorts.has(sortSelect.value) ? sortSelect.value : "curated";
  render({ announceResult: true });
});

const debouncedSearch = debounce(() => {
  state.query = searchInput?.value || "";
  render({ announceResult: true });
}, 180);

searchInput?.addEventListener("input", () => {
  if (clearSearchButton) clearSearchButton.hidden = !searchInput.value.trim();
  debouncedSearch();
});

searchForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  state.query = searchInput?.value || "";
  render({ announceResult: true });
});

clearSearchButton?.addEventListener("click", () => {
  if (searchInput) searchInput.value = "";
  state.query = "";
  render({ announceResult: true });
  searchInput?.focus();
});

resetButton?.addEventListener("click", resetFilters);
document.querySelector("[data-clear-category]")?.addEventListener("click", () => {
  state.category = "all";
  render({ announceResult: true });
  chips?.querySelector('[data-category="all"]')?.focus();
});

empty?.addEventListener("click", (event) => {
  if (event.target.closest("[data-empty-reset]")) resetFilters();
});

window.addEventListener("popstate", () => {
  state.query = getParam("q");
  state.category = getParam("category", "all");
  state.sort = validSorts.has(getParam("sort")) ? getParam("sort") : "curated";
  if (searchInput) searchInput.value = state.query;
  if (sortSelect) sortSelect.value = state.sort;
  render();
});

render();
