import {
  getCategoryBySlug,
  getGamesByCategory,
  getPopulatedCategories,
  sortGames,
} from "./games-data.js?v=20261027herodeck";
import { renderCategoryCard, renderGameGrid } from "./components.js?v=20261027herodeck";
import { categoryIcon, icon } from "./icons.js?v=20261027herodeck";
import { getParam, initReveal, setMeta } from "./utilities.js";
import "./site-chrome.js?v=20261027herodeck";

const slug = getParam("category");
const category = getCategoryBySlug(slug);
const gamesMount = document.querySelector("[data-category-games]");
const emptyMount = document.querySelector("[data-category-empty]");
const otherMount = document.querySelector("[data-other-categories]");
const canon = document.querySelector('link[rel="canonical"]');

function paintHeader(categoryData, games) {
  document.querySelector("[data-category-name]").textContent = categoryData.name;
  document.querySelector("[data-category-crumb]").textContent = categoryData.name;
  document.querySelector("[data-category-description]").textContent = categoryData.description;
  document.querySelector("[data-category-icon]").innerHTML = categoryIcon(categoryData.icon);
  document.querySelector("[data-category-heading]").textContent = `${categoryData.name} games`;
  document.querySelector("[data-category-aside]").textContent =
    `${categoryData.tagline} ${games.length === 1 ? "One game is" : `${games.length} games are`} currently published on this shelf.`;
  document.querySelector("[data-category-count]").textContent =
    `${games.length} ${games.length === 1 ? "game" : "games"}`;
}

function paintOtherCategories() {
  if (!otherMount) return;
  otherMount.innerHTML = getPopulatedCategories()
    .filter((item) => item.slug !== slug)
    .slice(0, 6)
    .map((item, index) => renderCategoryCard(item, index))
    .join("");
}

if (!category) {
  document.title = "Category not found � Robloxsplay";
  document.querySelector("[data-category-name]").textContent = "Shelf not found";
  document.querySelector("[data-category-crumb]").textContent = "Not found";
  document.querySelector("[data-category-icon]").innerHTML = icon("info");
  document.querySelector("[data-category-description]").textContent =
    "That category does not exist, or it has not been opened yet. Only shelves with real games are published.";
  document.querySelector("[data-category-heading]").textContent = "No shelf here";
  document.querySelector("[data-category-aside]").textContent =
    "Choose another frequency from the active categories below.";
  document.querySelector("[data-category-count]").textContent = "0 games";
  emptyMount.hidden = false;
  emptyMount.innerHTML = `
    <div class="empty-state">
      <span class="empty-state__mark" aria-hidden="true">${icon("grid")}</span>
      <p class="eyebrow">Unknown category</p>
      <h2>This shelf is empty.</h2>
      <p>We only publish categories that contain real, playable games. Browse the full catalogue instead.</p>
      <a class="button button--ghost" href="/all-games.html">All games ${icon("arrow")}</a>
    </div>
  `;
  gamesMount.innerHTML = "";
  paintOtherCategories();
  initReveal();
} else {
  const games = sortGames(getGamesByCategory(slug), "curated");
  const title = `${category.name} Games � Robloxsplay`;
  const description = `${category.description} Browse ${games.length} ${category.name.toLowerCase()} games at Robloxsplay.`;
  setMeta({ title, description });
  if (canon) {
    canon.href = `https://your-domain.example/category.html?category=${encodeURIComponent(slug)}`;
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", canon.href);
  }
  paintHeader(category, games);
  paintOtherCategories();

  if (games.length) {
    gamesMount.innerHTML = renderGameGrid(games);
    emptyMount.hidden = true;
    initReveal(gamesMount);
  } else {
    gamesMount.innerHTML = "";
    emptyMount.hidden = false;
    emptyMount.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__mark" aria-hidden="true">${icon("grid")}</span>
        <p class="eyebrow">Shelf in progress</p>
        <h2>No games here yet.</h2>
        <p>This category is part of the Robloxsplay data model but has no published games. We do not fill shelves with placeholders.</p>
        <a class="button button--ghost" href="/all-games.html">Browse playable games ${icon("arrow")}</a>
      </div>
    `;
  }
  initReveal();
}

const liveRegion = document.querySelector("#live-region");
if (liveRegion && category) {
  liveRegion.textContent = `${category.name} category loaded.`;
}

