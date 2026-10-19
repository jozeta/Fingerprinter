// Custom line icon set (24×24 grid, 1.6px stroke, round caps). Used for navigation, categories and the logo.
const P = {
  logo: '<path d="M12 3.5c-4.7 0-8.5 3.8-8.5 8.5"/><path d="M20.5 12c0-4.7-3.8-8.5-8.5-8.5"/><path d="M6.5 17.5c-.8-1.6-1.2-3.4-1.2-5.5a6.7 6.7 0 0 1 13.4 0c0 1.4-.1 2.7-.4 4"/><path d="M9.3 20c-.9-2.1-1.4-4.6-1.4-8a4.1 4.1 0 0 1 8.2 0c0 2.6-.3 5-1 7.2"/><path d="M12 12c0 3.4.5 6.2 1.4 8.5"/><path d="M20.3 15.5c-.3 1.4-.8 2.7-1.4 3.8"/>',
  overview: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v4.5l3 2"/><path d="M12 3.5v1.5M20.5 12H19M12 20.5V19M3.5 12H5"/>',
  tests: '<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="m7.5 9 1.5 1.5 3-3"/><path d="M14 9.5h3"/><path d="m7.5 15 1.5 1.5 3-3"/><path d="M14 15.5h3"/>',
  signals: '<circle cx="6" cy="7" r="2.2"/><circle cx="18" cy="6" r="2.2"/><circle cx="12" cy="17.5" r="2.6"/><path d="M7.8 8.4 10.6 15M16.6 7.8l-3.2 7.4M8.2 6.8l7.6-.6"/>',
  entities: '<path d="M4 20.5h16"/><path d="M6 20.5V8l6-4 6 4v12.5"/><path d="M10 20.5v-4h4v4"/><path d="M9.5 10.5h1M13.5 10.5h1M9.5 13.5h1M13.5 13.5h1"/>',
  compare: '<rect x="3.5" y="5" width="7" height="14" rx="1.8"/><rect x="13.5" y="5" width="7" height="14" rx="1.8"/><path d="M6 9h2M6 12h2M16 9h2M16 12h2M16 15h2"/>',
  assessment: '<path d="M12 3.5 5 6.3v5.2c0 4.3 3 7.7 7 9 4-1.3 7-4.7 7-9V6.3z"/><path d="m9 12 2 2 4-4"/>',
  learn: '<path d="M3.5 6.5C6 5.3 9 5.3 12 7c3-1.7 6-1.7 8.5-.5v12c-2.5-1.2-5.5-1.2-8.5.5-3-1.7-6-1.7-8.5-.5z"/><path d="M12 7v12"/>',
  methodology: '<path d="M6 3.5h9l3.5 3.5v13.5H6z"/><path d="M15 3.5V7h3.5"/><path d="M9 11.5h6M9 14.5h6M9 17.5h3.5"/>',
  settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/><path d="M4 12h5M13 12h7"/><circle cx="11" cy="12" r="2"/>',
  browser: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="M3 9h18"/><path d="M6 6.8h.01M8.5 6.8h.01M11 6.8h.01"/>',
  screen: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M9 20h6M12 16v4"/>',
  rendering: '<path d="M4 19.5 12 4.5l8 15z"/><path d="M8 12.2h8"/><circle cx="12" cy="15.6" r="1.4"/>',
  css: '<path d="M8.5 4C6.5 4 6 5 6 6.8v2.4C6 10.6 5.3 11.6 4 12c1.3.4 2 1.4 2 2.8v2.4C6 19 6.5 20 8.5 20"/><path d="M15.5 4c2 0 2.5 1 2.5 2.8v2.4c0 1.4.7 2.4 2 2.8-1.3.4-2 1.4-2 2.8v2.4c0 1.8-.5 2.8-2.5 2.8"/>',
  media: '<path d="M3.5 12h2l2-5 3 10 3-14 3 13 2-4h2"/>',
  hardware: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.8"/><rect x="9.5" y="9.5" width="5" height="5" rx=".8"/><path d="M9.5 3.5v3M14.5 3.5v3M9.5 17.5v3M14.5 17.5v3M3.5 9.5h3M3.5 14.5h3M17.5 9.5h3M17.5 14.5h3"/>',
  apis: '<path d="M9 3.5v4M15 3.5v4"/><path d="M6.5 7.5h11v3.5a5.5 5.5 0 0 1-11 0z"/><path d="M12 16.5v4"/>',
  storage: '<ellipse cx="12" cy="6" rx="7" ry="2.5"/><path d="M5 6v12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V6"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>',
  advanced: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5.5 5.5"/><path d="M8 10.5h5M10.5 8v5"/>',
  behavior: '<path d="M5.5 3.5 18 12l-5.8 1.4-3 5.6z"/><path d="m12.4 13.4 4.6 6"/>',
  server: '<rect x="4" y="4" width="16" height="6.5" rx="1.8"/><rect x="4" y="13.5" width="16" height="6.5" rx="1.8"/><path d="M7.5 7.3h.01M7.5 16.8h.01M11 7.3h5M11 16.8h5"/>',
  shield: '<path d="M12 3.5 5 6.3v5.2c0 4.3 3 7.7 7 9 4-1.3 7-4.7 7-9V6.3z"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.3"/><path d="m15.5 15.5 5 5"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
};

/** Inline SVG icon. aria-hidden by default; pass a label for standalone meaningful icons. */
export function icon(name, { cls = 'ico', label = '' } = {}) {
  const body = P[name] || P.advanced;
  return `<svg class="${cls}" viewBox="0 0 24 24" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true" focusable="false"'}>${body}</svg>`;
}

/** Replace every <span data-icon="name"> placeholder in static HTML (navigation) with its SVG. */
export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => { el.outerHTML = icon(el.dataset.icon, { cls: el.dataset.iconClass || 'ico' }); });
}
