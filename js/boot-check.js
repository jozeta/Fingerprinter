// Classic (non-module) script: runs even where ES modules cannot (file://), so start-up failures are never a blank page.
(function () {
  var view = document.getElementById('view');
  var firstError = null;
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function show(html) { if (view) view.innerHTML = '<div class="panel" role="alert">' + html + '</div>'; }
  if (location.protocol === 'file:') {
    show('<h1 class="h4">Open this lab through a local web server</h1>' +
      '<p>You opened <code>index.html</code> directly from disk. Browsers block JavaScript modules on <code>file://</code> pages, so only the menu can load.</p>' +
      '<p class="mb-1">In a terminal, in the project folder, run:</p><pre class="raw-view mono">python3 scripts/serve.py</pre>' +
      '<p class="mb-0">Then open <a href="http://localhost:8765/">http://localhost:8765/</a>.</p>');
    return;
  }
  // Module loading/linking errors (e.g. a stale cached module without the expected export) are reported here.
  window.addEventListener('error', function (e) {
    if (!firstError) firstError = (e.message || 'Unknown error') + (e.filename ? ' (' + e.filename.replace(location.origin, '') + (e.lineno ? ':' + e.lineno : '') + ')' : '');
  });
  // Capture phase also sees load failures of <script> elements, e.g. a module request blocked by an extension.
  window.addEventListener('error', function (e) {
    if (e.target && e.target.tagName === 'SCRIPT' && !firstError) firstError = 'A script failed to load: ' + (e.target.src || 'module graph').replace(location.origin, '') + '. If the console shows ERR_BLOCKED_BY_CLIENT, a content blocker extension blocked it; allow this site in the extension.';
  }, true);
  window.addEventListener('unhandledrejection', function (e) { if (!firstError) firstError = 'Unhandled: ' + (e.reason && e.reason.message || e.reason); });
  setTimeout(function () {
    if (window.__fplabStarted) return;
    show('<h1 class="h4">The lab did not start</h1>' +
      (firstError ? '<p class="mb-2">Error: <code>' + esc(firstError) + '</code></p>' : '') +
      '<p class="mb-1">Most common cause: your browser is using <strong>cached old copies</strong> of some files. Fix:</p>' +
      '<ol class="mb-2"><li>Do a hard reload: <kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd> (macOS) or <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>. If that is not enough, open DevTools → Network → tick "Disable cache" and reload.</li>' +
      '<li>Serve with <code>python3 scripts/serve.py</code>, which disables caching.</li>' +
      '<li>If the console shows <code>ERR_BLOCKED_BY_CLIENT</code>, an ad/tracker-blocking extension blocked a file. Allow this site in that extension.</li></ol>' +
      '<p class="mb-0 small text-muted">Otherwise, open the developer console for details.</p>');
  }, 4000);
})();
