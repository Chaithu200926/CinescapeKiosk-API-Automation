// Builds <REPORT_DIR>/index.html from Playwright's JSON results, keeps a run history for trends,
// writes summary.md, and (on GitHub Actions) appends that summary to the run's job summary.
// REPORT_DIR defaults to "dashboard" (git-ignored, for local runs); scripts/publish.js uses "reports".
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

// Project folder; load .env so the (masked) target API and cinema can be shown.
const root = path.join(__dirname, '..');
require('dotenv').config({ path: path.join(root, '.env'), quiet: true });

// Input (Playwright JSON results), output folder, history file and how many runs to keep.
const resultsPath = path.join(root, 'test-results', 'results.json');
const outputDir = path.join(root, process.env.REPORT_DIR || 'dashboard');
const historyPath = process.env.KIOSK_HISTORY_FILE || path.join(outputDir, 'history.json');
const HISTORY_LIMIT = 30;

// Stop early if the tests have not been run yet.
if (!fs.existsSync(resultsPath)) {
  console.error(`No results found at ${resultsPath}. Run "npm test" first.`);
  process.exit(1);
}
const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

// ---------- collect tests ----------
// One entry per test with everything the dashboard shows.
const tests = [];

// Remove terminal colour codes from error messages.
const stripAnsi = (s) => String(s || '').replace(/\u001b\[[0-9;]*m/g, '');
// Read a JSON attachment (stored base64-encoded in results.json).
const decode = (a) => {
  try {
    return JSON.parse(Buffer.from(a.body, 'base64').toString('utf8'));
  } catch {
    return null;
  }
};

// Turn nested test steps into a flat list, remembering the nesting depth for indentation.
function flattenSteps(steps, depth = 0) {
  return (steps || []).flatMap((s) => [
    { title: s.title, depth, duration: s.duration || 0, failed: !!s.error },
    ...flattenSteps(s.steps, depth + 1),
  ]);
}

// Walk the results tree (files → suites → tests) and gather each test's data.
function collect(suite) {
  for (const spec of suite.specs || []) {
    for (const t of spec.tests || []) {
      // Use the last attempt of the test.
      const r = t.results?.[t.results.length - 1] || {};
      // Read an annotation such as "purpose" or "why".
      const note = (type) => (t.annotations || []).find((a) => a.type === type)?.description || '';
      const attachments = r.attachments || [];
      tests.push({
        id: (spec.title.match(/^(API-\d+)/) || [])[1] || spec.title,
        title: spec.title,
        file: spec.file,
        purpose: note('purpose'),
        why: note('why'),
        status: r.status || t.status || 'unknown',
        duration: r.duration || 0,
        error: stripAnsi(r.error?.message),
        steps: flattenSteps(r.steps).filter((s) => !/^(Before|After) Hooks$|^Fixture|^Worker Cleanup|^Attach/.test(s.title)),
        calls: attachments.filter((a) => a.name.startsWith('api-call: ') && a.body).map(decode).filter(Boolean),
        checks: decode(attachments.find((a) => a.name === 'checks' && a.body) || {}) || [],
        // Extra tables a test publishes with showTable(), e.g. "Movies now showing".
        tables: attachments.filter((a) => a.name.startsWith('table: ') && a.body).map(decode).filter(Boolean),
      });
    }
  }
  // Continue into nested suites.
  for (const child of suite.suites || []) collect(child);
}
(results.suites || []).forEach(collect);
// Sort by title so API-01, API-02, ... appear in order.
tests.sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));

// Totals for the summary tiles.
const isFail = (s) => ['failed', 'timedOut', 'interrupted'].includes(s);
const total = tests.length;
const passed = tests.filter((t) => t.status === 'passed').length;
const failed = tests.filter((t) => isFail(t.status)).length;
const skipped = tests.filter((t) => t.status === 'skipped').length;
const passRate = total ? Math.round((passed / total) * 100) : 0;
const callCount = tests.reduce((n, t) => n + t.calls.length, 0);

// ---------- run & environment info ----------
// Run a git command and return its output ('' if git is not available).
const git = (cmd) => {
  try {
    return execSync(`git ${cmd}`, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
};
// Installed version of an npm package, e.g. @playwright/test.
const pkgVersion = (name) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'node_modules', name, 'package.json'), 'utf8')).version;
  } catch {
    return 'unknown';
  }
};
// Hide the API host (the dashboard is public), keep protocol, port and path.
const maskHost = (url) => {
  try {
    const u = new URL(url);
    return `${u.protocol}//<hidden>${u.port ? ':' + u.port : ''}${u.pathname}`;
  } catch {
    return 'not set';
  }
};

// "https://github.com/owner/repo(.git)" from the origin remote, or from Actions env vars.
const repoSlug =
  process.env.GITHUB_REPOSITORY || (git('remote get-url origin').match(/github\.com[/:]([^/]+\/[^/.]+)/) || [])[1] || '';
const repoUrl = repoSlug ? `https://github.com/${repoSlug}` : '';
const pagesUrl = repoSlug ? `https://${repoSlug.split('/')[0].toLowerCase()}.github.io/${repoSlug.split('/')[1]}/` : '';

// Load earlier runs (empty on the very first run).
let history = [];
try {
  history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
} catch {
  history = [];
}

// Details of this run, shown in the "Run & environment" panel.
const started = results.stats?.startTime ? new Date(results.stats.startTime) : new Date();
const wallMs = results.stats?.duration || tests.reduce((s, t) => s + t.duration, 0);
const sha = process.env.GITHUB_SHA || git('rev-parse HEAD');
const previousSameRun = history.find((h) => h.at === started.toISOString());
const run = {
  // Actions run number on GitHub; otherwise a sequential number kept in the history file.
  number: process.env.GITHUB_RUN_NUMBER || previousSameRun?.run || String(history.filter((h) => /^\d+$/.test(h.run)).length + 1),
  url: process.env.GITHUB_RUN_ID ? `${repoUrl}/actions/runs/${process.env.GITHUB_RUN_ID}` : '',
  commit: sha.slice(0, 7),
  commitMessage: git('log -1 --pretty=%s'),
  commitUrl: sha && repoUrl ? `${repoUrl}/commit/${sha}` : '',
  author: process.env.GITHUB_ACTOR || git('log -1 --pretty=%an'),
  branch: process.env.GITHUB_REF_NAME || git('branch --show-current'),
  trigger: process.env.GITHUB_EVENT_NAME || process.env.KIOSK_TRIGGER || 'local run',
  // The repo is public, so the PC's hostname is not published.
  machine: process.env.RUNNER_NAME ? `${process.env.RUNNER_NAME} (self-hosted runner)` : process.env.KIOSK_MACHINE_LABEL || 'Local QA PC',
  os: `${os.type()} ${os.release()}`,
  node: process.version,
  playwright: pkgVersion('@playwright/test'),
  target: maskHost(process.env.KIOSK_API_BASE_URL),
  cinemaId: process.env.KIOSK_CINEMA_ID || '0000000001',
  started,
  finished: new Date(started.getTime() + wallMs),
  wallMs,
};

// ---------- history ----------
// Add this run to the history (used by the trend chart and the "last 10 runs" squares).
const entry = {
  run: run.number,
  at: run.started.toISOString(),
  commit: run.commit,
  url: run.url,
  total,
  passed,
  failed,
  skipped,
  tests: Object.fromEntries(tests.map((t) => [t.id, t.status])),
};
// Re-running the script for the same results replaces the entry instead of adding a duplicate.
history = history.filter((h) => h.at !== entry.at);
history.push(entry);
// Keep only the most recent runs, then save.
history = history.slice(-HISTORY_LIMIT);
fs.mkdirSync(path.dirname(historyPath), { recursive: true });
fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

// ---------- HTML helpers ----------
// Make text safe to put inside HTML.
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Milliseconds → "1.23s".
const secs = (ms) => `${(ms / 1000).toFixed(2)}s`;
// Date → "2026-09-28 07:45:31 UTC".
const when = (d) => d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
// Test status → colour group (pass / fail / skip / none).
const kind = (s) => (s === 'passed' ? 'pass' : s === 'skipped' ? 'skip' : isFail(s) ? 'fail' : 'none');
// Symbol shown with each colour, so status is never colour-only.
const icon = { pass: '✓', fail: '✗', skip: '–', none: '·' };
// Test status → readable word.
const label = (s) => ({ passed: 'Passed', failed: 'Failed', timedOut: 'Timed out', skipped: 'Skipped', interrupted: 'Interrupted' })[s] || 'Not run';
// Object → two-column key/value table (used for headers).
const kv = (obj) =>
  `<table class="kv">${Object.entries(obj || {})
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`)
    .join('')}</table>`;
// Value → indented JSON text for <pre> blocks.
const pretty = (v) => esc(typeof v === 'string' ? v : JSON.stringify(v, null, 2));

// The "last 10 runs" squares for one test (✓ / ✗ / – with a tooltip per run).
function historyChips(id) {
  const recent = history.slice(-10);
  return `<span class="chips" aria-label="Last ${recent.length} runs">${recent
    .map((h) => {
      const s = h.tests[id];
      const k = s ? kind(s) : 'none';
      return `<span class="chip ${k}" title="Run ${esc(h.run)} · ${esc(h.at.slice(0, 16).replace('T', ' '))} · ${esc(label(s))}">${icon[k]}</span>`;
    })
    .join('')}</span>`;
}

// Stacked columns (passed / failed / skipped) for each run in the history.
function trendChart() {
  const max = Math.max(1, ...history.map((h) => h.total));
  const cols = history
    .map((h) => {
      const seg = (n, k) => (n ? `<i class="seg ${k}" style="height:${(n / max) * 100}%"></i>` : '');
      const rate = h.total ? Math.round((h.passed / h.total) * 100) : 0;
      return `<div class="col" tabindex="0" data-tip="Run ${esc(h.run)} · ${esc(h.at.slice(0, 16).replace('T', ' '))}&#10;${h.passed} passed · ${h.failed} failed · ${h.skipped} skipped&#10;Pass rate ${rate}%${h.commit ? ' · ' + esc(h.commit) : ''}">
        <div class="stack">${seg(h.skipped, 'skip')}${seg(h.failed, 'fail')}${seg(h.passed, 'pass')}</div>
        <span class="xl">${esc(h.run)}</span></div>`;
    })
    .join('');
  return `<div class="chart" role="img" aria-label="Test results for the last ${history.length} runs">
    <div class="yaxis"><span>${max}</span><span>${Math.round(max / 2)}</span><span>0</span></div>
    <div class="plot"><div class="grid"></div>${cols}</div>
  </div>
  <div class="legend"><span><i class="sw pass"></i>Passed</span><span><i class="sw fail"></i>Failed</span><span><i class="sw skip"></i>Skipped</span><span class="muted">Hover a column for details · x-axis: run number</span></div>`;
}

// One API call: method, path, HTTP status, response message, headers and bodies.
function callHtml(c) {
  const ok = c.response.status >= 200 && c.response.status < 300;
  return `<div class="call">
    <div class="call-head">
      <span class="method">${esc(c.request.method)}</span>
      <code class="path">${esc(c.request.path)}</code>
      <span class="pill ${ok ? 'pass' : 'fail'}">HTTP ${esc(c.response.status)}</span>
      <span class="muted">${esc(c.response.durationMs)} ms · ${esc(c.response.sizeBytes ?? '?')} bytes</span>
    </div>
    ${c.safety ? `<p class="safe">✓ Read-only call: ${esc(c.safety.purpose)}</p>` : ''}
    <div class="msg">
      <span>Response message</span><strong>${esc(c.response.msg || '(empty)')}</strong>
      <span>Code</span><strong>${esc(c.response.code)}</strong>
      <span>Result</span><strong>${esc(c.response.result || '(empty)')}</strong>
    </div>
    <details><summary>Request headers &amp; body</summary>${kv(c.request.headers)}<pre>${pretty(c.request.body ?? '(no body)')}</pre></details>
    <details><summary>Response headers</summary>${kv(c.response.headers)}</details>
    <details><summary>Full response body</summary><pre>${pretty(c.response.body)}</pre></details>
  </div>`;
}

// A table a test published with showTable(), e.g. "Movies now showing".
function dataTableHtml(t) {
  const body = t.rows.length
    ? t.rows.map((r) => `<tr>${r.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${t.columns.length}" class="muted">No rows: the API returned no data for this table.</td></tr>`;
  return `<h4 class="tcap">${esc(t.caption)} (${t.rows.length})</h4><div class="scroll"><table class="checks data"><thead><tr>${t.columns
    .map((c) => `<th>${esc(c)}</th>`)
    .join('')}</tr></thead><tbody>${body}</tbody></table></div>`;
}

// The "Check / Expected / Actual / Result" table for one test.
function checksHtml(checks) {
  if (!checks.length) return '';
  return `<div class="scroll"><table class="checks"><thead><tr><th>Check</th><th>Expected</th><th>Actual</th><th>Result</th></tr></thead><tbody>${checks
    .map(
      (c) => `<tr class="${c.passed ? '' : 'bad'}"><td>${esc(c.label)}</td><td><code>${esc(c.expected)}</code></td><td><code>${esc(c.actual)}</code></td>
      <td><span class="pill ${c.passed ? 'pass' : 'fail'}">${c.passed ? '✓ Pass' : '✗ Fail'}</span></td></tr>`,
    )
    .join('')}</tbody></table></div>`;
}

// One card per test: status, purpose, checks, published tables, API calls and steps.
const testCards = tests
  .map((t) => {
    const k = kind(t.status);
    return `<article class="test ${k}" id="${esc(t.id)}">
  <header>
    <span class="pill ${k}">${icon[k]} ${label(t.status)}</span>
    <h3>${esc(t.title)}</h3>
    ${historyChips(t.id)}
    <span class="muted">${secs(t.duration)}</span>
  </header>
  <p class="file">${esc(t.file)}</p>
  ${t.purpose ? `<p><b>What it checks:</b> ${esc(t.purpose)}</p>` : ''}
  ${t.why ? `<p><b>Why it matters:</b> ${esc(t.why)}</p>` : ''}
  ${t.error ? `<details class="err"><summary>Failure details</summary><pre class="error">${esc(t.error)}</pre></details>` : ''}
  ${checksHtml(t.checks)}
  ${t.tables.map(dataTableHtml).join('')}
  ${t.calls.map(callHtml).join('')}
  <details><summary>${t.steps.length} execution steps</summary><ol class="steps">${t.steps
    .map((s) => `<li class="${s.failed ? 'bad' : ''}" style="margin-left:${s.depth * 14}px">${esc(s.title)} <span class="muted">${secs(s.duration)}</span></li>`)
    .join('')}</ol></details>
</article>`;
  })
  .join('\n');

// Overview table rows: result, last HTTP status and response message, history squares.
const overview = tests
  .map((t) => {
    const k = kind(t.status);
    const last = t.calls[t.calls.length - 1];
    return `<tr><td><a href="#${esc(t.id)}">${esc(t.title)}</a></td><td><span class="pill ${k}">${icon[k]} ${label(t.status)}</span></td>
      <td>${last ? `HTTP ${esc(last.response.status)}` : ''}</td><td>${esc(last ? last.response.msg || '(empty)' : '')}</td><td>${historyChips(t.id)}</td></tr>`;
  })
  .join('');

// Rows of the "Run & environment" panel.
const runInfo = {
  'Run': run.url ? `<a href="${esc(run.url)}">#${esc(run.number)}</a>` : esc(run.number),
  'Commit': run.commitUrl ? `<a href="${esc(run.commitUrl)}">${esc(run.commit)}</a> ${esc(run.commitMessage)}` : `${esc(run.commit || 'uncommitted')} ${esc(run.commitMessage)}`,
  'Pushed by': esc(run.author || 'unknown'),
  'Branch': esc(run.branch || 'unknown'),
  'Trigger': esc(run.trigger),
  'Started': esc(when(run.started)),
  'Finished': esc(when(run.finished)),
  'Machine': esc(run.machine),
  'OS': esc(run.os),
  'Node.js / Playwright': `${esc(run.node)} / ${esc(run.playwright)}`,
  'Target API': `<code>${esc(run.target)}</code>`,
  'Cinema ID': esc(run.cinemaId),
  'Safety mode': 'Read-only allowlist enforced (src/safety.ts)',
};

// ---------- the dashboard page ----------
// Styles (light + dark), summary tiles, trend chart, run info, overview table, test cards, tooltip script.
const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Kiosk API Dashboard</title>
<style>
:root { --bg:#f6f7fb; --panel:#fcfcfb; --ink:#1b2230; --muted:#5d6678; --line:#dde2ea; --code:#f1f3f8; --accent:#1f4e8c;
  --good:#0ca30c; --critical:#d03b3b; --warning:#fab219;
  --good-ink:#006300; --critical-ink:#a42525; --warning-ink:#7a5200; --good-bg:#e3f4e3; --critical-bg:#fbe7e5; --warning-bg:#fdf1d6; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg:#121212; --panel:#1a1a19; --ink:#e9ecf1; --muted:#9aa3b2; --line:#2e3440; --code:#141414; --accent:#8db4f0;
  --good-ink:#5fd35f; --critical-ink:#ff8a80; --warning-ink:#fab219; --good-bg:#15301a; --critical-bg:#3a1c1c; --warning-bg:#3a2f14; } }
:root[data-theme="dark"] { --bg:#121212; --panel:#1a1a19; --ink:#e9ecf1; --muted:#9aa3b2; --line:#2e3440; --code:#141414; --accent:#8db4f0;
  --good-ink:#5fd35f; --critical-ink:#ff8a80; --warning-ink:#fab219; --good-bg:#15301a; --critical-bg:#3a1c1c; --warning-bg:#3a2f14; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font:15px/1.5 "Segoe UI", system-ui, sans-serif; }
main { max-width:1140px; margin:0 auto; padding:32px 16px 64px; }
h1 { margin:0; font-size:28px; } h2 { font-size:18px; margin:28px 0 12px; } h3 { margin:0; font-size:16px; flex:1; min-width:220px; }
a { color:var(--accent); } .muted { color:var(--muted); font-size:13px; }
.panel { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:16px; }
.tiles { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; margin:20px 0; }
.tile { background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:14px 16px; }
.tile b { display:block; font-size:28px; font-variant-numeric:tabular-nums; } .tile span { color:var(--muted); font-size:13px; }
.two { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
.kv { width:100%; border-collapse:collapse; font-size:13px; } .kv th { text-align:left; color:var(--muted); font-weight:500; padding:4px 12px 4px 0; width:38%; vertical-align:top; }
.kv td { padding:4px 0; word-break:break-word; }
.chart { display:flex; gap:8px; height:180px; margin-top:4px; }
.yaxis { display:flex; flex-direction:column; justify-content:space-between; font-size:11px; color:var(--muted); padding-bottom:18px; text-align:right; min-width:18px; }
.plot { position:relative; flex:1; display:flex; align-items:flex-end; gap:6px; }
.grid { position:absolute; inset:0 0 18px 0; border-bottom:1px solid var(--line); background:linear-gradient(var(--line) 1px, transparent 1px) 0 0 / 100% 50%; opacity:.6; pointer-events:none; }
.col { position:relative; flex:1; max-width:36px; height:100%; display:flex; flex-direction:column; align-items:center; outline:none; }
.stack { flex:1; width:100%; display:flex; flex-direction:column; justify-content:flex-end; gap:2px; padding-bottom:0; }
.seg { display:block; width:100%; min-height:3px; } .stack .seg:first-child { border-radius:4px 4px 0 0; }
.seg.pass { background:var(--good); } .seg.fail { background:var(--critical); } .seg.skip { background:var(--warning); }
.xl { font-size:11px; color:var(--muted); height:18px; line-height:18px; }
.col:hover .stack, .col:focus .stack { opacity:.85; }
.tip { position:fixed; pointer-events:none; background:var(--ink); color:var(--bg); font-size:12px; padding:6px 9px; border-radius:6px; white-space:pre; z-index:10; display:none; }
.legend { display:flex; flex-wrap:wrap; gap:14px; font-size:13px; margin-top:8px; align-items:center; }
.sw { display:inline-block; width:10px; height:10px; border-radius:2px; margin-right:6px; vertical-align:-1px; } .sw.pass { background:var(--good); } .sw.fail { background:var(--critical); } .sw.skip { background:var(--warning); }
.chips { display:inline-flex; gap:3px; } .chip { width:18px; height:18px; border-radius:4px; font-size:11px; font-weight:700; display:inline-grid; place-items:center; color:#fff; background:var(--line); }
.chip.pass { background:var(--good); } .chip.fail { background:var(--critical); } .chip.skip { background:var(--warning); color:#1b2230; } .chip.none { color:var(--muted); }
table.list { width:100%; border-collapse:collapse; font-size:14px; } table.list th, table.list td { text-align:left; padding:8px 10px; border-bottom:1px solid var(--line); vertical-align:top; }
table.list th { color:var(--muted); font-weight:500; font-size:13px; }
.pill { display:inline-block; font-size:12px; font-weight:600; padding:1px 9px; border-radius:20px; white-space:nowrap; }
.pill.pass { background:var(--good-bg); color:var(--good-ink); } .pill.fail { background:var(--critical-bg); color:var(--critical-ink); } .pill.skip { background:var(--warning-bg); color:var(--warning-ink); }
.test { background:var(--panel); border:1px solid var(--line); border-left:4px solid var(--good); border-radius:10px; padding:14px 16px; margin-bottom:14px; }
.test.fail { border-left-color:var(--critical); } .test.skip { border-left-color:var(--warning); }
.test header { display:flex; align-items:center; gap:10px; flex-wrap:wrap; } .test p { margin:6px 0; font-size:14px; }
.file { font-family:Consolas, monospace; font-size:12px !important; color:var(--muted); }
.scroll { overflow-x:auto; max-width:100%; }
.checks { width:100%; min-width:520px; border-collapse:collapse; font-size:13px; margin:10px 0; } .checks th, .checks td { text-align:left; padding:6px 8px; border-bottom:1px solid var(--line); vertical-align:top; }
.checks th { color:var(--muted); font-weight:500; } .tcap { margin:14px 0 2px; font-size:14px; } .checks code { font-size:12px; word-break:break-word; } .checks tr.bad td { background:var(--critical-bg); }
.call { border:1px solid var(--line); border-radius:8px; padding:10px 12px; margin:10px 0; }
.call-head { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
.method { font-weight:700; font-size:12px; color:var(--accent); } .path { font-family:Consolas, monospace; font-size:13px; word-break:break-all; flex:1; }
.safe { font-size:12px !important; color:var(--good-ink); margin:6px 0 0 !important; }
.msg { display:grid; grid-template-columns:auto 1fr; gap:2px 12px; margin-top:8px; font-size:14px; } .msg span { color:var(--muted); font-size:13px; } .msg strong { font-weight:600; word-break:break-word; }
details { margin-top:8px; } summary { cursor:pointer; color:var(--accent); font-size:13px; }
pre { background:var(--code); border:1px solid var(--line); border-radius:6px; padding:10px; overflow:auto; max-height:360px; font:12px/1.45 Consolas, monospace; white-space:pre-wrap; word-break:break-word; }
pre.error { color:var(--critical-ink); max-height:none; }
.steps { margin:6px 0 0; padding-left:18px; font-size:13px; } .steps li.bad { color:var(--critical-ink); }
footer { color:var(--muted); font-size:13px; margin-top:24px; }
@media (max-width:760px) { .two { grid-template-columns:1fr; } h1 { font-size:22px; } .msg { grid-template-columns:1fr; } table.list td:nth-child(4), table.list th:nth-child(4) { display:none; } }
</style>
</head>
<body><main>
<h1>CinescapeKiosk API tests</h1>
<p class="muted">Run ${esc(run.number)} · ${esc(when(run.started))}${run.url ? ` · <a href="${esc(run.url)}">GitHub Actions run</a>` : ''}${repoUrl ? ` · <a href="${esc(repoUrl)}">Repository</a> · <a href="${esc(repoUrl)}/actions">Actions</a>` : ''}${fs.existsSync(path.join(outputDir, 'playwright-report', 'index.html')) ? ' · <a href="playwright-report/index.html">Playwright HTML report</a>' : ''}</p>

<section class="tiles">
  <div class="tile"><b>${total}</b><span>Tests</span></div>
  <div class="tile"><b>${passed}</b><span>✓ Passed</span></div>
  <div class="tile"><b>${failed}</b><span>✗ Failed</span></div>
  <div class="tile"><b>${skipped}</b><span>– Skipped</span></div>
  <div class="tile"><b>${passRate}%</b><span>Pass rate</span></div>
  <div class="tile"><b>${callCount}</b><span>API calls (all read-only)</span></div>
  <div class="tile"><b>${secs(run.wallMs)}</b><span>Duration</span></div>
</section>

<section class="two">
  <div class="panel"><h2 style="margin-top:0">Trend: last ${history.length} run${history.length === 1 ? '' : 's'}</h2>${trendChart()}</div>
  <div class="panel"><h2 style="margin-top:0">Run &amp; environment</h2><table class="kv">${Object.entries(runInfo)
    .map(([k, v]) => `<tr><th>${esc(k)}</th><td>${v}</td></tr>`)
    .join('')}</table></div>
</section>

<h2>Overview</h2>
<div class="panel scroll"><table class="list"><thead><tr><th>Test</th><th>Result</th><th>HTTP</th><th>Response message</th><th>Last 10 runs</th></tr></thead><tbody>${overview}</tbody></table></div>

<h2>Test details</h2>
${testCards || '<p>No tests found.</p>'}
<footer>Generated from Playwright JSON results. The kiosk API key, cookies and API host are hidden. All calls pass the read-only allowlist.</footer>
</main>
<div class="tip" id="tip"></div>
<script>
// Tooltip for the trend chart columns (mouse hover and keyboard focus).
(function () {
  var tip = document.getElementById('tip');
  function show(e) { var c = e.currentTarget; tip.textContent = c.getAttribute('data-tip'); tip.style.display = 'block'; move(e); }
  function move(e) { var r = e.clientX !== undefined ? e : e.currentTarget.getBoundingClientRect(); var x = (r.clientX || r.left) + 12, y = (r.clientY || r.top) - 10;
    tip.style.left = Math.min(x, window.innerWidth - tip.offsetWidth - 8) + 'px'; tip.style.top = Math.max(8, y - tip.offsetHeight) + 'px'; }
  function hide() { tip.style.display = 'none'; }
  document.querySelectorAll('.col').forEach(function (c) {
    c.addEventListener('mouseenter', show); c.addEventListener('mousemove', move); c.addEventListener('mouseleave', hide);
    c.addEventListener('focus', show); c.addEventListener('blur', hide);
  });
})();
</script>
</body></html>`;

// Save the page and a copy of the history next to it (the history is also published).
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'index.html'), html);
fs.writeFileSync(path.join(outputDir, 'history.json'), JSON.stringify(history, null, 2));
console.log(`Dashboard: ${path.join(outputDir, 'index.html')} (${passed}/${total} passed, ${history.length} runs in history)`);

// ---------- Markdown summary (summary.md, and the GitHub job summary when on Actions) ----------
{
  // Make text safe inside a Markdown table cell.
  const md = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  // Status → emoji for the summary.
  const emoji = { pass: '✅', fail: '❌', skip: '⏭️', none: '▫️' };
  // Last 10 results of one test as emojis.
  const trail = (id) => history.slice(-10).map((h) => emoji[h.tests[id] ? kind(h.tests[id]) : 'none']).join('');
  // Heading, run details, trend and the main results table.
  const lines = [
    `## CinescapeKiosk API tests: ${passed}/${total} passed${failed ? `, ${failed} failed` : ''}${skipped ? `, ${skipped} skipped` : ''}`,
    '',
    `**Run** #${md(run.number)} · **commit** \`${md(run.commit)}\` ${md(run.commitMessage)} · **by** ${md(run.author)} · **trigger** ${md(run.trigger)}  `,
    `**Machine** ${md(run.machine)} · **Node** ${md(run.node)} · **Playwright** ${md(run.playwright)} · **Cinema** ${md(run.cinemaId)} · **Duration** ${secs(run.wallMs)}  `,
    `**Pass-rate trend** (oldest → newest): ${history.slice(-10).map((h) => `${h.total ? Math.round((h.passed / h.total) * 100) : 0}%`).join(' → ')}  `,
    pagesUrl ? `**Dashboard:** ${pagesUrl}` : '',
    '',
    '| Test | Result | Last 10 runs | API call | HTTP | Code | Response message |',
    '|---|---|---|---|---|---|---|',
  ];
  // One row per API call (the test name and result appear on its first row).
  for (const t of tests) {
    const calls = t.calls.length ? t.calls : [null];
    calls.forEach((c, i) => {
      lines.push(
        `| ${i === 0 ? md(t.title) : ''} | ${i === 0 ? `${emoji[kind(t.status)]} ${label(t.status)}` : ''} | ${i === 0 ? trail(t.id) : ''} | ${c ? `\`${md(c.request.method)} ${md(c.request.path)}\`` : ''} | ${c ? c.response.status : ''} | ${c ? md(c.response.code) : ''} | ${c ? md(c.response.msg || '(empty)') : ''} |`,
      );
    });
  }
  // Tables published by tests (e.g. "API-02 · Movies now showing").
  for (const t of tests) {
    for (const table of t.tables) {
      lines.push('', `### ${md(t.id)} · ${md(table.caption)} (${table.rows.length})`, '');
      if (!table.rows.length) {
        lines.push('_No rows: the API returned no data for this table._');
        continue;
      }
      lines.push(`| ${table.columns.map(md).join(' | ')} |`, `|${table.columns.map(() => '---').join('|')}|`);
      for (const row of table.rows) lines.push(`| ${row.map(md).join(' | ')} |`);
    }
  }
  // Every failed check with its expected and actual value.
  const failedChecks = tests.flatMap((t) => t.checks.filter((c) => !c.passed).map((c) => ({ t, c })));
  if (failedChecks.length) {
    lines.push('', '### Failed checks', '', '| Test | Check | Expected | Actual |', '|---|---|---|---|');
    for (const { t, c } of failedChecks) lines.push(`| ${md(t.id)} | ${md(c.label)} | \`${md(c.expected)}\` | \`${md(c.actual)}\` |`);
  }
  lines.push('', '_All calls passed the read-only allowlist. Full request/response details are on the dashboard._');
  // Save summary.md; on GitHub Actions also add it to the run page.
  const summary = lines.join('\n') + '\n';
  fs.writeFileSync(path.join(outputDir, 'summary.md'), summary);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
}
