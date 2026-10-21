// One shared hover/focus box for charts. Elements opt in with data-tip="<key>"; views register content with setTip().
// Content is HTML built by the views from escaped values. Works with mouse, touch (tap) and keyboard focus.
const store = new Map();
let box = null, current = null;

export const setTip = (key, html) => store.set(key, html);

function place(x, y) {
  const pad = 14, r = box.getBoundingClientRect();
  let left = x + pad, top = y + pad;
  if (left + r.width > innerWidth - 8) left = x - r.width - pad;
  if (top + r.height > innerHeight - 8) top = y - r.height - pad;
  box.style.left = `${Math.max(8, left)}px`; box.style.top = `${Math.max(8, top)}px`;
}

function show(target, x, y) {
  const html = store.get(target.dataset.tip); if (!html) return;
  if (current !== target) { box.innerHTML = html; current = target; }
  box.classList.add('show'); box.setAttribute('aria-hidden', 'false');
  if (x === undefined) { const r = target.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
  place(x, y);
}

function hide() { box.classList.remove('show'); box.setAttribute('aria-hidden', 'true'); current = null; }

export function initTooltips() {
  if (box) return;
  box = document.createElement('div');
  box.className = 'tipbox'; box.setAttribute('role', 'tooltip'); box.setAttribute('aria-hidden', 'true'); box.id = 'tipbox';
  document.body.appendChild(box);
  const hit = (e) => e.target.closest?.('[data-tip]');
  document.addEventListener('pointermove', (e) => { const t = hit(e); if (t) show(t, e.clientX, e.clientY); else if (current) hide(); }, { passive: true });
  document.addEventListener('pointerleave', hide);
  document.addEventListener('focusin', (e) => { const t = hit(e); if (t) show(t); });
  document.addEventListener('focusout', (e) => { if (hit(e)) hide(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  addEventListener('scroll', hide, { passive: true });
}
