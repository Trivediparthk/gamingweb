import { getCuratedGames } from "./games-data.js";
import { renderGameCard } from "./components.js";
import { initReveal } from "./utilities.js";
import "./site-chrome.js?v=20261027herodeck";

const grid = document.querySelector("[data-not-found-games]");
if (grid) {
  grid.innerHTML = getCuratedGames()
    .slice(0, 3)
    .map((game, index) => renderGameCard(game, { index }))
    .join("");
  initReveal(grid);
}
