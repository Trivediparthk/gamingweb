export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

export function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getParam(name, fallback = "") {
  return new URLSearchParams(window.location.search).get(name) || fallback;
}

export function setParams(updates, { replace = true } = {}) {
  const url = new URL(window.location.href);
  Object.entries(updates).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "" || value === "all") {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });
  const next = `${url.pathname}${url.search}${url.hash}`;
  if (replace) window.history.replaceState({}, "", next);
  else window.history.pushState({}, "", next);
}

export function debounce(fn, wait = 180) {
  let timeout;
  return (...args) => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => fn(...args), wait);
  };
}

export function formatDate(value) {
  if (!value) return "";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function setMeta({ title, description, canonical, type = "website" }) {
  if (title) document.title = title;
  const set = (selector, attr, value) => {
    const node = document.querySelector(selector);
    if (node && value) node.setAttribute(attr, value);
  };
  set('meta[name="description"]', "content", description);
  set('meta[property="og:title"]', "content", title);
  set('meta[property="og:description"]', "content", description);
  set('meta[property="og:type"]', "content", type);
  set('meta[name="twitter:title"]', "content", title);
  set('meta[name="twitter:description"]', "content", description);
  if (canonical) set('link[rel="canonical"]', "href", canonical);
}

export function announce(message, target = "#live-region") {
  const region = document.querySelector(target);
  if (!region) return;
  region.textContent = "";
  window.setTimeout(() => {
    region.textContent = message;
  }, 20);
}

export function storageGet(key, fallback = null) {
  try {
    const value = window.localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be unavailable in private or restricted browser contexts.
  }
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function initReveal(scope = document) {
  const nodes = $$("[data-reveal]", scope);
  if (!nodes.length) return;
  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => {
      node.classList.add("is-revealed");
      node.removeAttribute("data-reveal");
    });
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
          window.setTimeout(() => {
            entry.target.removeAttribute("data-reveal");
          }, 700);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -32px 0px" },
  );
  nodes.forEach((node) => observer.observe(node));
}

export function focusWithoutScroll(element) {
  if (!element) return;
  element.focus({ preventScroll: true });
}

export function isTouchDevice() {
  return window.matchMedia("(pointer: coarse)").matches;
}
