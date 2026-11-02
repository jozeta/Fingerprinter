// One shared hover/focus box for charts. Elements opt in with data-tip="<key>"; views register content with setTip().
// Content is HTML built by the views from escaped values. Works with mouse, touch (tap) and keyboard focus.
const store = new Map();
let box = null, current = null, lastPointer = 'mouse';

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
  if (current !== target) {
    box.innerHTML = html; current = target;
    const hint = box.querySelector('.t-hint');
    if (hint && lastPointer === 'touch') hint.textContent = hint.textContent.replace(/^Click/, 'Tap again');
  }
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
  document.addEventListener('pointerdown', (e) => { lastPointer = e.pointerType || 'mouse'; }, { capture: true, passive: true });
  document.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; const t = hit(e); if (t) show(t, e.clientX, e.clientY); else if (current) hide(); }, { passive: true });
  // Touch has no hover: the first tap on a part shows its box (and is not treated as a click); a second tap acts normally.
  document.addEventListener('click', (e) => {
    if (lastPointer !== 'touch') return;
    const t = hit(e);
    if (!t) { if (current) hide(); return; }
    if (current !== t) { e.preventDefault(); e.stopPropagation(); show(t, e.clientX, e.clientY); }
    else hide();
  }, true);
  document.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'touch') hide(); }); // a lifted finger also 'leaves'
  // Keyboard focus shows the box; focus caused by a tap is left to the tap handler above (otherwise the first tap
  // would already count as the second one).
  document.addEventListener('keydown', () => { lastPointer = 'keyboard'; }, { capture: true, passive: true });
  document.addEventListener('focusin', (e) => { if (lastPointer === 'touch') return; const t = hit(e); if (t) show(t); });
  document.addEventListener('focusout', (e) => { if (lastPointer !== 'touch' && hit(e)) hide(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hide(); });
  addEventListener('scroll', hide, { passive: true });
}
