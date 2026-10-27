import { getPopulatedCategories, searchGames } from "./games-data.js?v=20261027herodeck";
import { icon } from "./icons.js?v=20261027herodeck";
import { escapeHTML, focusWithoutScroll, prefersReducedMotion } from "./utilities.js";
import { siteConfig } from "./site-config.js";

const currentPage = () => document.body.dataset.page || "";

function navLink(label, href, page) {
  const active =
    currentPage() === page ||
    (page === "games" && ["category", "game"].includes(currentPage()));
  return `<a class="nav-link${active ? " is-active" : ""}" href="${href}"${active ? ' aria-current="page"' : ""}>${label}</a>`;
}

function searchResultMarkup() {
  return `
    <div class="search-results__head">
      <span>Quick find</span>
      <span class="search-results__hint">Enter to search all</span>
    </div>
    <div data-search-list></div>
    <div class="search-results__empty" data-search-empty hidden>
      <p>No game matches that yet.</p>
      <a href="/all-games.html">Browse the full arcade ${icon("arrow")}</a>
    </div>
  `;
}

function buildHeader() {
  const categories = getPopulatedCategories();
  const categoryLinks = categories
    .map(
      (category) => `
        <a href="/category.html?category=${category.slug}">
          <span>${escapeHTML(category.name)}</span><span class="dropdown-count">${String(category.count).padStart(2, "0")}</span>
        </a>`,
    )
    .join("");

  return `
    <div class="topbar">
      <div class="container topbar__inner">
        <p><span class="topbar__pulse" aria-hidden="true"></span>Independent browser arcade <span class="topbar__divider" aria-hidden="true">/</span> Built in-house + authorised</p>
        <p class="topbar__aside">27 games <span class="topbar__divider" aria-hidden="true">/</span> No downloads</p>
      </div>
    </div>
    <header class="site-header" data-site-header>
      <div class="container site-header__inner">
        <a class="brand" href="/index.html" aria-label="Robloxsplay home">
          <img class="brand__mark" src="/assets/images/logo.svg" alt="" width="44" height="44">
          <span class="brand__wordmark"><strong>ROBLOX</strong><span>SPLAY</span></span>
        </a>

        <nav class="desktop-nav" aria-label="Primary navigation">
          ${navLink("Discover", "/index.html", "home")}
          ${navLink("All games", "/all-games.html", "games")}
          <div class="nav-dropdown" data-dropdown>
            <button class="nav-link nav-dropdown__trigger" type="button" aria-expanded="false" aria-controls="category-menu">
              Categories ${icon("chevronDown")}
            </button>
            <div class="nav-dropdown__panel" id="category-menu" hidden>
              <div class="nav-dropdown__intro">
                <span class="eyebrow">Find your frequency</span>
                <p>${categories.length} active shelves, curated by hand.</p>
              </div>
              <div class="nav-dropdown__links">${categoryLinks}</div>
              <a class="nav-dropdown__all" href="/all-games.html">See every game ${icon("arrow")}</a>
            </div>
          </div>
          ${navLink("About", "/about.html", "about")}
        </nav>

        <div class="header-actions">
          <div class="header-search" data-header-search>
            <form class="search-box" role="search" data-search-form>
              <label class="sr-only" for="header-search-input">Search games</label>
              ${icon("search")}
              <input id="header-search-input" type="search" name="q" placeholder="Search the arcade" autocomplete="off" data-search-input aria-controls="header-search-results" aria-expanded="false">
              <kbd>/</kbd>
            </form>
            <div class="search-results" id="header-search-results" data-search-results hidden>
              ${searchResultMarkup()}
            </div>
          </div>
          <a class="button button--lime button--small header-cta" href="/all-games.html">Browse games ${icon("arrow")}</a>
          <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-nav" data-menu-toggle>
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </header>
    <div class="mobile-nav" id="mobile-nav" data-mobile-nav hidden>
      <div class="mobile-nav__top">
        <span class="eyebrow">Robloxsplay / Navigation</span>
        <button class="icon-button" type="button" aria-label="Close menu" data-menu-close>${icon("close")}</button>
      </div>
      <form class="mobile-search" role="search" data-mobile-search-form>
        <label class="sr-only" for="mobile-search-input">Search games</label>
        ${icon("search")}
        <input id="mobile-search-input" type="search" name="q" placeholder="Search the arcade" autocomplete="off">
        <button type="submit" class="icon-button" aria-label="Submit search">${icon("arrow")}</button>
      </form>
      <nav class="mobile-nav__primary" aria-label="Mobile primary navigation">
        <a href="/index.html"><span>Discover</span><small>01</small></a>
        <a href="/all-games.html"><span>All games</span><small>02</small></a>
        <a href="/about.html"><span>About</span><small>03</small></a>
        <a href="/contact.html"><span>Contact</span><small>04</small></a>
      </nav>
      <div class="mobile-nav__categories">
        <span class="eyebrow">Browse by category</span>
        <div class="mobile-nav__category-grid">
          ${categories
            .map(
              (category) =>
                `<a href="/category.html?category=${category.slug}">${escapeHTML(category.name)}<span>${String(category.count).padStart(2, "0")}</span></a>`,
            )
            .join("")}
        </div>
      </div>
      <p class="mobile-nav__note">Independent games. Original code. No accounts, no downloads.</p>
    </div>
    <div class="page-scrim" data-page-scrim hidden></div>
  `;
}

function buildFooter() {
  const categories = getPopulatedCategories().filter((category) =>
    ["Action", "Arcade", "Puzzle", "Skill"].includes(category.name),
  );
  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-top">
          <div class="footer-brand">
            <a class="brand brand--footer" href="/index.html" aria-label="Robloxsplay home">
              <img class="brand__mark" src="/assets/images/logo.svg" alt="" width="48" height="48">
              <span class="brand__wordmark"><strong>ROBLOX</strong><span>SPLAY</span></span>
            </a>
            <p>An independent arcade for small, sharp browser games. Built with original code, original art and a little bit of stubbornness.</p>
            <a class="text-link" href="/about.html">Read our story ${icon("arrow")}</a>
          </div>
          <div class="footer-links">
            <div>
              <h2>Play</h2>
              <a href="/all-games.html">All games</a>
              <a href="/index.html#trending">Trending</a>
              <a href="/index.html#new">Recently added</a>
              <a href="/index.html#categories">Categories</a>
            </div>
            <div>
              <h2>Browse</h2>
              ${categories.map((category) => `<a href="/category.html?category=${category.slug}">${category.name}</a>`).join("")}
            </div>
            <div>
              <h2>Studio</h2>
              <a href="/about.html">About Robloxsplay</a>
              <a href="/contact.html">Contact</a>
              <a href="/game.html?game=neon-snake">First drop</a>
            </div>
            <div>
              <h2>Legal</h2>
              <a href="/privacy-policy.html">Privacy policy</a>
              <a href="/terms.html">Terms &amp; conditions</a>
            </div>
          </div>
        </div>
        <div class="footer-mega" aria-hidden="true">ROBLOXSPLAY</div>
        <div class="footer-bottom">
          <p>&copy; <span data-current-year>2026</span> ${siteConfig.name}. All original games are made in-house.</p>
          <p>Third-party embeds are published only with documented provider authorisation.</p>
          <a href="#main" class="footer-top-link">Back to top ${icon("arrowUpRight")}</a>
        </div>
      </div>
    </footer>
  `;
}

function setupDropdown() {
  const dropdown = document.querySelector("[data-dropdown]");
  if (!dropdown) return;
  const trigger = dropdown.querySelector(".nav-dropdown__trigger");
  const panel = dropdown.querySelector(".nav-dropdown__panel");
  const close = () => {
    trigger.setAttribute("aria-expanded", "false");
    dropdown.classList.remove("is-open");
    window.setTimeout(() => {
      if (!dropdown.classList.contains("is-open")) panel.hidden = true;
    }, 180);
  };
  const open = () => {
    panel.hidden = false;
    requestAnimationFrame(() => {
      dropdown.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    });
  };
  trigger.addEventListener("click", () => {
    if (dropdown.classList.contains("is-open")) {
      close();
    } else {
      open();
    }
  });
  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dropdown.classList.contains("is-open")) {
      close();
      trigger.focus();
    }
  });
  panel.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [...panel.querySelectorAll("a[href]")];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function setupSearch() {
  const wrapper = document.querySelector("[data-header-search]");
  if (!wrapper) return;
  const form = wrapper.querySelector("[data-search-form]");
  const input = wrapper.querySelector("[data-search-input]");
  const results = wrapper.querySelector("[data-search-results]");
  const list = wrapper.querySelector("[data-search-list]");
  const empty = wrapper.querySelector("[data-search-empty]");

  const render = () => {
    const query = input.value.trim();
    if (!query) {
      results.hidden = true;
      input.setAttribute("aria-expanded", "false");
      return;
    }
    const matches = searchGames(query).slice(0, 5);
    if (matches.length) {
      list.innerHTML = matches
        .map(
          (game) => `
            <a class="search-result" href="/game.html?game=${encodeURIComponent(game.slug)}">
              <span class="search-result__art"><img src="${game.thumbnail}" alt="" width="64" height="40" loading="lazy"></span>
              <span class="search-result__copy"><strong>${escapeHTML(game.title)}</strong><span>${escapeHTML(game.category)} · ${escapeHTML(game.playtime)}</span></span>
              <span class="search-result__arrow">${icon("arrow")}</span>
            </a>`,
        )
        .join("");
      empty.hidden = true;
      list.hidden = false;
    } else {
      list.innerHTML = "";
      list.hidden = true;
      empty.hidden = false;
    }
    results.hidden = false;
    input.setAttribute("aria-expanded", "true");
  };

  input.addEventListener("input", render);
  input.addEventListener("focus", render);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim();
    window.location.href = query
      ? `/all-games.html?q=${encodeURIComponent(query)}`
      : "/all-games.html";
  });
  wrapper.addEventListener("focusout", (event) => {
    if (!wrapper.contains(event.relatedTarget)) {
      window.setTimeout(() => {
        if (!wrapper.contains(document.activeElement)) {
          results.hidden = true;
          input.setAttribute("aria-expanded", "false");
        }
      }, 80);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !results.hidden) {
      results.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.focus();
    }
    if (
      event.key === "/" &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName) &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey
    ) {
      event.preventDefault();
      focusWithoutScroll(input);
    }
  });
}

function setupMobileNav() {
  const toggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-mobile-nav]");
  const scrim = document.querySelector("[data-page-scrim]");
  if (!toggle || !nav) return;
  const closeButton = nav.querySelector("[data-menu-close]");
  let lastFocus = null;

  const close = () => {
    nav.classList.remove("is-open");
    scrim.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("nav-open");
    window.setTimeout(() => {
      if (!nav.classList.contains("is-open")) {
        nav.hidden = true;
        scrim.hidden = true;
      }
    }, 320);
    if (lastFocus) lastFocus.focus();
  };

  const open = () => {
    lastFocus = document.activeElement;
    nav.hidden = false;
    scrim.hidden = false;
    requestAnimationFrame(() => {
      nav.classList.add("is-open");
      scrim.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      document.body.classList.add("nav-open");
      closeButton.focus();
    });
  };

  toggle.addEventListener("click", () => {
    if (nav.classList.contains("is-open")) close();
    else open();
  });
  closeButton.addEventListener("click", close);
  scrim.addEventListener("click", close);
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a[href]")) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) close();
    if (event.key !== "Tab" || !nav.classList.contains("is-open")) return;
    const focusable = [
      ...nav.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ];
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const mobileForm = nav.querySelector("[data-mobile-search-form]");
  mobileForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = new FormData(mobileForm).get("q")?.toString().trim();
    window.location.href = query
      ? `/all-games.html?q=${encodeURIComponent(query)}`
      : "/all-games.html";
  });
}

function setupCardTilt() {
  if (
    prefersReducedMotion() ||
    !window.matchMedia("(hover: hover) and (pointer: fine)").matches
  ) {
    return;
  }
  let activeCard = null;
  let frame = 0;
  let nextX = 0;
  let nextY = 0;

  const reset = () => {
    if (!activeCard) return;
    activeCard.style.removeProperty("--tilt-x");
    activeCard.style.removeProperty("--tilt-y");
    activeCard = null;
  };

  document.addEventListener(
    "pointermove",
    (event) => {
      const card = event.target.closest?.(".game-card");
      if (!card) {
        reset();
        return;
      }
      if (card !== activeCard) {
        reset();
        activeCard = card;
      }
      const rect = card.getBoundingClientRect();
      nextX = ((event.clientY - rect.top) / rect.height - 0.5) * -4.5;
      nextY = ((event.clientX - rect.left) / rect.width - 0.5) * 5.5;
      if (!frame) {
        frame = requestAnimationFrame(() => {
          if (activeCard) {
            activeCard.style.setProperty("--tilt-x", `${nextX.toFixed(2)}deg`);
            activeCard.style.setProperty("--tilt-y", `${nextY.toFixed(2)}deg`);
          }
          frame = 0;
        });
      }
    },
    { passive: true },
  );

  document.addEventListener(
    "pointerout",
    (event) => {
      const card = event.target.closest?.(".game-card");
      if (card && !card.contains(event.relatedTarget)) reset();
    },
    { passive: true },
  );
}

export function initSiteChrome() {
  const headerMount = document.querySelector("#site-header");
  const footerMount = document.querySelector("#site-footer");
  if (headerMount) headerMount.innerHTML = buildHeader();
  if (footerMount) footerMount.innerHTML = buildFooter();
  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
  setupDropdown();
  setupSearch();
  setupMobileNav();
  setupCardTilt();
}

initSiteChrome();
