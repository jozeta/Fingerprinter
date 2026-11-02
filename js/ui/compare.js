// Fingerprint Comparison: one flow based on result codes (copy, save in this browser, paste or load, compare side by side).
import { mount } from './components.js';
import { codeSectionHTML, bindCodeSection } from './code-compare.js';

export async function render(view, app) {
  const root = mount(view, `
    <h1 class="page-title">Fingerprint comparison</h1>
    <p class="lead-muted">See what changes between two setups: before and after changing a setting, or between two computers or browsers. Save or copy a result code, then compare it with a new run here.</p>
    ${codeSectionHTML(app)}`);
  bindCodeSection(root, app, () => render(view, app));
}

export function update(view, app, what) { if (what === 'run-end') render(view, app); }
