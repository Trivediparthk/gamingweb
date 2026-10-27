const stroke = 'fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

const UI_ICONS = {
  search: `<circle cx="10.8" cy="10.8" r="6.8" ${stroke}/><path d="m16 16 4.5 4.5" ${stroke}/>`,
  arrow: `<path d="M5 12h13M13 6l6 6-6 6" ${stroke}/>`,
  arrowLeft: `<path d="M19 12H6M11 6l-6 6 6 6" ${stroke}/>`,
  arrowUpRight: `<path d="M7 17 17 7M8 7h9v9" ${stroke}/>`,
  play: `<path d="m9 7 8 5-8 5V7Z" fill="currentColor"/>`,
  menu: `<path d="M4 8h16M4 16h16" ${stroke}/>`,
  close: `<path d="m6 6 12 12M18 6 6 18" ${stroke}/>`,
  pause: `<path d="M9 7v10M15 7v10" ${stroke} stroke-width="2.2"/>`,
  restart: `<path d="M19 8v5h-5M19 13a7 7 0 1 1-2-5" ${stroke}/>`,
  fullscreen: `<path d="M8 4H4v4M16 4h4v4M8 20H4v-4M20 16v4h-4" ${stroke}/>`,
  spark: `<path d="M12 3c.7 4.7 3.3 7.3 8 8-4.7.7-7.3 3.3-8 8-.7-4.7-3.3-7.3-8-8 4.7-.7 7.3-3.3 8-8Z" ${stroke}/>`,
  flame: `<path d="M13 2.5c.5 3.2 3.7 4.7 3.7 8.2A4.7 4.7 0 0 1 12 15.4a4.7 4.7 0 0 1-4.7-4.7c0-2.6 1.7-4.3 2.8-5.5.2 1.4.9 2.5 1.9 2.9.5-2.2.6-3.9 1-5.6Z" fill="currentColor"/><path d="M4.2 14.3c-.8 3.9 2.2 7.2 7.8 7.2s8.6-3.3 7.8-7.2c-.4 2-2.1 3.4-4.3 3.7.6-1.1.8-2.2.6-3.2-1.2 1.8-2.5 2.7-4.1 2.7-2.3 0-3.8-1.4-4.2-3.2-.9 1.1-1.4 2.2-1.4 3.4 0 .1 0 .2.1.3-.9-.5-1.6-1.4-1.9-2.3Z" fill="currentColor" opacity=".55"/>`,
  bolt: `<path d="m13.2 2.5-8 11.4h6L9.3 21.5l8.5-11.8h-5.5l.9-7.2Z" fill="currentColor"/>`,
  grid: `<rect x="4" y="4" width="6" height="6" rx="1" ${stroke}/><rect x="14" y="4" width="6" height="6" rx="1" ${stroke}/><rect x="4" y="14" width="6" height="6" rx="1" ${stroke}/><rect x="14" y="14" width="6" height="6" rx="1" ${stroke}/>`,
  shuffle: `<path d="M4 7h3.2c4.2 0 5.4 10 9.6 10H20M16 13l4 4-4 4M4 17h3.2c1.4 0 2.5-1.1 3.5-2.7M14.8 8.9C15.4 7.8 16 7 17 7h3M16 3l4 4-4 4" ${stroke}/>`,
  check: `<path d="m5 12 4.5 4.5L19 7" ${stroke}/>`,
  mail: `<rect x="3" y="5" width="18" height="14" rx="2" ${stroke}/><path d="m4 7 8 6 8-6" ${stroke}/>`,
  info: `<circle cx="12" cy="12" r="8.5" ${stroke}/><path d="M12 10.5V16M12 7.6v.1" ${stroke}/>`,
  chevronDown: `<path d="m7 10 5 5 5-5" ${stroke}/>`,
  external: `<path d="M14 5h5v5M19 5l-7 7M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" ${stroke}/>`,
};

const CATEGORY_ICONS = {
  action: `<path d="M25 6 13 27h10l-2 15 14-22H25l2-14Z" ${stroke}/>`,
  adventure: `<circle cx="24" cy="24" r="15" ${stroke}/><path d="m30 17-3.5 9.5L17 30l3.5-9.5L30 17Z" ${stroke}/><circle cx="24" cy="24" r="1.5" fill="currentColor"/>`,
  arcade: `<rect x="9" y="15" width="30" height="22" rx="9" ${stroke}/><path d="M17 23v8M13 27h8" ${stroke}/><circle cx="31" cy="24" r="1.7" fill="currentColor"/><circle cx="35" cy="28" r="1.7" fill="currentColor"/><path d="M20 15V9h8v6" ${stroke}/>`,
  racing: `<path d="M7 31h34M10 25h22M6 19h19M13 13h14" ${stroke}/><path d="M35 24h5l-3 7H23l4-7h8Z" ${stroke}/><circle cx="27" cy="36" r="3" ${stroke}/><circle cx="37" cy="36" r="3" ${stroke}/>`,
  runner: `<circle cx="29" cy="10" r="4" ${stroke}/><path d="m27 16-6 8 6 4 2 9M27 16l8 5 3 8M20 22l-6 4M27 28l-8 10" ${stroke}/><path d="M8 38h10" ${stroke}/>`,
  puzzle: `<path d="M10 10h10v5a4 4 0 1 0 8 0v-5h10v10h-5a4 4 0 1 0 0 8h5v10H28v-5a4 4 0 1 0-8 0v5H10V28h5a4 4 0 1 0 0-8h-5V10Z" ${stroke}/>`,
  sports: `<circle cx="24" cy="24" r="16" ${stroke}/><path d="M10 15c6 1 9 5 9 11s-3 10-8 12M38 15c-6 1-9 5-9 11s3 10 8 12M8.5 24h31" ${stroke}/>`,
  casual: `<circle cx="24" cy="24" r="8" ${stroke}/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.9 9.9l4.2 4.2M33.9 33.9l4.2 4.2M38.1 9.9l-4.2 4.2M14.1 33.9l-4.2 4.2" ${stroke}/>`,
  strategy: `<circle cx="16" cy="17" r="5" ${stroke}/><circle cx="32" cy="31" r="5" ${stroke}/><path d="M20 20.5 28 27M30 10l4 4-6 6M14 34l-4 4" ${stroke}/><rect x="27" y="7" width="12" height="10" rx="2" ${stroke}/>`,
  shooting: `<circle cx="24" cy="24" r="15" ${stroke}/><circle cx="24" cy="24" r="7" ${stroke}/><circle cx="24" cy="24" r="1.8" fill="currentColor"/><path d="M24 5v6M24 37v6M5 24h6M37 24h6" ${stroke}/>`,
  multiplayer: `<circle cx="15" cy="16" r="5" ${stroke}/><circle cx="33" cy="16" r="5" ${stroke}/><circle cx="24" cy="34" r="5" ${stroke}/><path d="m19 19 3 9M29 19l-3 9M20 16h8" ${stroke}/>`,
  girls: `<path d="M24 7c6 5 9 10 9 15a9 9 0 0 1-18 0c0-5 3-10 9-15Z" ${stroke}/><path d="M24 18v12M18 25h12" ${stroke}/><path d="M15 39h18" ${stroke}/>`,
  kids: `<path d="M24 7a8 8 0 0 1 8 8v2h4a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3h-3l-3 8H18l-3-8h-3a3 3 0 0 1-3-3v-4a3 3 0 0 1 3-3h4v-2a8 8 0 0 1 8-8Z" ${stroke}/><path d="M19 25h4M27 25h4M23 31h4" ${stroke}/>`,
  board: `<path d="m24 6 17 9v18l-17 9-17-9V15l17-9Z" ${stroke}/><path d="m7 15 17 9 17-9M24 24v18" ${stroke}/><circle cx="17" cy="19" r="1.7" fill="currentColor"/><circle cx="31" cy="29" r="1.7" fill="currentColor"/>`,
  skill: `<circle cx="24" cy="24" r="15" ${stroke}/><path d="M24 16v8l6 4" ${stroke}/><path d="M9 9l4 4M39 9l-4 4" ${stroke}/>`,
  simulation: `<circle cx="24" cy="24" r="8" ${stroke}/><ellipse cx="24" cy="24" rx="19" ry="7" ${stroke} transform="rotate(-25 24 24)"/><circle cx="36" cy="14" r="2" fill="currentColor"/>`,
  "3d": `<path d="m24 6 16 9v18l-16 9-16-9V15l16-9Z" ${stroke}/><path d="m8 15 16 9 16-9M24 24v18" ${stroke}/><path d="m16 11 16 9" ${stroke}/>`,
  classic: `<rect x="7" y="9" width="34" height="26" rx="6" ${stroke}/><path d="M17 22h8M21 18v8M31 20h.1M35 26h.1" ${stroke} stroke-width="2.2"/><path d="M7 29h34" ${stroke}/>`,
};

export function icon(name, className = "") {
  const body = UI_ICONS[name] || UI_ICONS.spark;
  return `<svg class="icon ${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${body}</svg>`;
}

export function categoryIcon(name, className = "") {
  const body = CATEGORY_ICONS[name] || CATEGORY_ICONS.arcade;
  return `<svg class="category-icon ${className}" viewBox="0 0 48 48" aria-hidden="true" focusable="false">${body}</svg>`;
}
