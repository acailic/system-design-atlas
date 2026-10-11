#!/usr/bin/env node
/* system-design-atlas site generator.
 *
 * Markdown is the source of truth; this script renders it into the static
 * site committed under docs/ (served by GitHub Pages from main /docs).
 *
 *   node site/build.mjs          generate docs/
 *   node site/build.mjs --check  fail if docs/ is stale
 *   node site/build.mjs --serve  serve docs/ on :8092 (rerun build on change)
 *
 * No framework: marked (markdown) + js-yaml (catalog), pinned in package.json.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync, statSync, watch } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { Marked } from 'marked';
import yaml from 'js-yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const SERVE = process.argv.includes('--serve');

const GITHUB_BASE = 'https://github.com/acailic/system-design-atlas';
const MERMAID_VERSION = '11.6.0';

/* ── markdown pipeline ─────────────────────────────────────────── */

const marked = new Marked({ gfm: true });
const renderMd = (md) => marked.parse(md);

const decodeEntities = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");
const slugify = (s) =>
  decodeEntities(s).replace(/<[^>]+>/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';

/* turn ```mermaid fences into mermaid figures (raw source degrades gracefully) */
function transformMermaid(html) {
  return html.replace(
    /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g,
    (_, src) =>
      `<figure class="diagram"><pre class="mermaid">${src}</pre>` +
      `<span class="diagram-fallback-note">Diagram source — enable JavaScript to render the diagram.</span></figure>`,
  );
}

/* wrap the "Explain like I'm 10" section in a styled aside */
function transformEli10(html) {
  const h = html.match(/<h2[^>]*>Explain like I(?:&#39;|&apos;|')m 10<\/h2>/);
  if (!h) return html;
  const start = h.index;
  const rest = html.slice(start + h[0].length);
  const next = rest.search(/<h2[\s>]/);
  const inner = next === -1 ? rest : rest.slice(0, next);
  const end = next === -1 ? html.length : start + h[0].length + next;
  const body = inner.replace(
    /<p><strong>Why the grown-ups did it this way:<\/strong>\s*/g,
    '<p class="eli-why"><strong>Why the grown-ups did it this way:</strong> ',
  );
  const section =
    `<section class="eli10">\n<h2><span class="eli-emoji">🧒</span> Explain like I'm 10</h2>\n${body}\n</section>`;
  return html.slice(0, start) + section + html.slice(end);
}

/* convert "## Walkthrough" bold-step paragraphs into step blocks */
function transformWalkthrough(html) {
  const h = html.match(/<h2[^>]*>Walkthrough:[^<]*<\/h2>/);
  if (!h) return html;
  const start = h.index;
  const rest = html.slice(start + h[0].length);
  const next = rest.search(/<h2[\s>]/);
  const inner = next === -1 ? rest : rest.slice(0, next);
  const end = next === -1 ? html.length : start + h[0].length + next;

  const stepRe = /<p><strong>(?:Step (\d+)|Outcome)( — [^<]+)\.<\/strong>\s*([\s\S]*?)<\/p>/g;
  let sawStep = false;
  const converted = inner.replace(stepRe, (_m, num, title, prose) => {
    sawStep = true;
    const isOutcome = num === undefined;
    const label = title.replace(/^ — /, '');
    const marker = isOutcome ? '✓' : num;
    return (
      `<div class="step${isOutcome ? ' step-outcome' : ''}">` +
      `<span class="step-marker" aria-hidden="true">${marker}</span>` +
      `<div class="step-body"><h3 class="step-title">${label}</h3>\n<p>${prose}</p></div></div>`
    );
  });
  if (!sawStep) return html;

  const wrapped = `<div class="walkthrough">\n${h[0]}\n${converted.trim()}\n</div>`;
  /* the paragraph(s) before the first step are the intro */
  const firstStepAt = wrapped.indexOf('<div class="step"');
  const firstPAt = wrapped.indexOf('<p>');
  const withIntro =
    firstPAt !== -1 && firstPAt < firstStepAt
      ? wrapped.slice(0, firstPAt) + '<p class="walkthrough-intro">' + wrapped.slice(firstPAt + 3)
      : wrapped;
  return html.slice(0, start) + withIntro + html.slice(end);
}

/* add ids to h2/h3 and return (html, toc) */
function addHeadingIds(html) {
  const toc = [];
  const seen = new Map();
  const out = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g, (_m, lvl, attrs, inner) => {
    let slug = slugify(inner);
    const n = seen.get(slug) || 0;
    seen.set(slug, n + 1);
    if (n > 0) slug = `${slug}-${n + 1}`;
    if (lvl === '2') toc.push({ id: slug, text: decodeEntities(inner.replace(/<[^>]+>/g, '')) });
    const kept = attrs.replace(/\s*id="[^"]*"/, '');
    return `<h${lvl}${kept} id="${slug}">${inner}</h${lvl}>`;
  });
  return { html: out, toc };
}

/* ── link rewriting: repo-relative → site pages or GitHub links ── */

const diveIdSet = new Set();

/* resolve href against the page directory, then classify */
function normalizeTarget(href, fromDir) {
  if (/^(https?:|mailto:|#)/.test(href)) return { kind: 'external' };
  const anchor = href.includes('#') ? '#' + href.split('#').slice(1).join('#') : '';
  let path = href.split('#')[0];
  if (!path) return { kind: 'external' };
  const stack = (fromDir + path).split('/');
  const resolved = [];
  for (const part of stack) {
    if (part === '' || part === '.') continue;
    if (part === '..') resolved.pop();
    else resolved.push(part);
  }
  path = resolved.join('/');
  const m = path.match(/^(?:.*\/)?deep-dives\/([^/.]+)\.md$/) || path.match(/^([^/.]+)\.md$/);
  if (m && diveIdSet.has(m[1])) return { kind: 'site', path: `dive/${m[1]}/`, anchor };
  if (path === 'PATTERNS.md') return { kind: 'site', path: 'patterns/', anchor };
  return { kind: 'github', url: `${GITHUB_BASE}/blob/main/${path}` };
}

function relUrl(fromDir, toPath) {
  const trailing = toPath.endsWith('/') ? '/' : '';
  const from = fromDir.split('/').filter(Boolean);
  const to = toPath.split('/').filter(Boolean);
  let i = 0;
  while (i < from.length && i < to.length && from[i] === to[i]) i++;
  return '../'.repeat(from.length - i) + to.slice(i).join('/') + trailing;
}

function rewriteLinks(html, fromDir) {
  return html.replace(/href="([^"]+)"/g, (m, href) => {
    const t = normalizeTarget(href, fromDir);
    if (t.kind === 'external') return m;
    if (t.kind === 'github') return `href="${t.url}"`;
    return `href="${relUrl(fromDir, t.path)}${t.anchor}"`;
  });
}

/* ── deep-dive parsing ─────────────────────────────────────────── */

function parseDive(raw, id, catalogEntry) {
  const titleMatch = raw.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1] : id;

  const grab = (key) => {
    const m = raw.match(new RegExp(`\\*\\*${key}:\\*\\*\\s*\`([^\`]+)\``));
    return m ? m[1] : null;
  };
  const meta = {};
  meta.id = grab('Atlas id') || id;
  meta.domains = (grab('Domains') || (catalogEntry?.domains || []).join(', '))
    .split(',').map((s) => s.trim()).filter(Boolean);
  const up = raw.match(/\*\*Upstream:\*\*\s*(\S+)/);
  meta.upstream = up ? up[1] : catalogEntry?.repo;
  const lic = raw.match(/\*\*License:\*\*\s*([^·\n]+)/);
  meta.license = lic ? lic[1].trim() : catalogEntry?.license;
  const commit = raw.match(/\*\*Pinned commit:\*\*\s*`([0-9a-f]{7,40})`(?:\s*\(([^)]*)\))?/);
  meta.commit = commit ? commit[1] : null;
  meta.commitNote = commit && commit[2] ? commit[2] : '';
  meta.difficulty = catalogEntry?.difficulty || 'moderate';

  const body = raw.replace(/^# .+\n/, '');
  let html = renderMd(body);

  /* the header metadata blockquote becomes page chips — strip it */
  const bqStart = html.indexOf('<blockquote>');
  const firstH2 = html.indexOf('<h2');
  const firstP = html.indexOf('<p>');
  if (bqStart !== -1 && (firstH2 === -1 || bqStart < firstH2) && (firstP === -1 || bqStart < firstP)) {
    const bqEnd = html.indexOf('</blockquote>', bqStart);
    html = (html.slice(0, bqStart) + html.slice(bqEnd + 13)).trimStart();
  }

  html = transformMermaid(html);
  html = transformWalkthrough(html);
  html = transformEli10(html);
  const { html: withIds, toc } = addHeadingIds(html);
  html = withIds;
  html = html.replace(/^(\s*)<p>/, '$1<p class="lead">');

  /* ELI10 teaser for the home cards */
  const eli = raw.split(/## Explain like I.m 10\n/)[1];
  let eliTeaser = '';
  if (eli) {
    const firstPara = eli.split(/\n\n/).find((p) => p.trim() && !p.trim().startsWith('**Why'));
    if (firstPara) {
      eliTeaser = decodeEntities(renderMd(firstPara).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      if (eliTeaser.length > 200) eliTeaser = eliTeaser.slice(0, 197).replace(/\s\S*$/, '') + '…';
    }
  }

  const headline = title.includes(':') ? title.split(':').slice(1).join(':').trim() : title;
  const introPara = raw.split('\n\n').slice(2).find((p) => p.trim() && !p.trim().startsWith('>') && !p.trim().startsWith('#')) || headline;
  const description = decodeEntities(renderMd(introPara).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 190);
  return { id, title, headline, meta, html, toc, eliTeaser, description };
}

/* ── page shell ────────────────────────────────────────────────── */

const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function page({ title, description, body, fromDir = '' }) {
  const asset = (p) => relUrl(fromDir, p);
  const home = fromDir ? relUrl(fromDir, '') : 'index.html';
  const patternsHref = fromDir === 'patterns/' ? './' : relUrl(fromDir, 'patterns/');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeAttr(title)}</title>
<meta name="description" content="${escapeAttr(description)}">
<meta property="og:title" content="${escapeAttr(title)}">
<meta property="og:description" content="${escapeAttr(description)}">
<meta property="og:type" content="website">
<link rel="stylesheet" href="${asset('assets/site.css')}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🧭%3C/text%3E%3C/svg%3E">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<nav class="site-nav" aria-label="Site">
  <a class="brand" href="${home}"><span class="compass">🧭</span> System Design Atlas</a>
  <a href="${home}#dives">Deep-dives</a>
  <a href="${patternsHref}">Patterns</a>
  <span class="spacer"></span>
  <a href="${GITHUB_BASE}" rel="noopener">GitHub ↗</a>
</nav>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <span>Prose <a href="${GITHUB_BASE}/blob/main/LICENSES.md">CC-BY-4.0</a> · Tooling MIT · Site generated from the markdown source.</span>
  <span><a href="${GITHUB_BASE}">github.com/acailic/system-design-atlas</a></span>
</footer>
<noscript><div class="read-bar-unsupported">JavaScript is off — diagrams show as source and read-aloud is unavailable. Everything is still readable.</div></noscript>
<script src="https://cdn.jsdelivr.net/npm/mermaid@${MERMAID_VERSION}/dist/mermaid.min.js" integrity="sha384-zkWMJO4sgpPUzyuOgDx8HB/K55glbAwajEpk1Go2NWRuPkPA/wIhoEJTuSkmOYrV" crossorigin="anonymous" defer></script>
<script src="${asset('assets/site.js')}" defer></script>
</body>
</html>
`;
}

const chip = (text, cls = '') => `<span class="chip ${cls}">${text}</span>`;

/* ── inputs ────────────────────────────────────────────────────── */

const catalog = yaml.load(readFileSync(join(ROOT, 'catalog.yaml'), 'utf8'));
const diveFiles = readdirSync(join(ROOT, 'deep-dives')).filter((f) => f.endsWith('.md')).sort();
const dives = diveFiles.map((f) => {
  const id = f.replace(/\.md$/, '');
  const entry = catalog.projects.find((p) => p.id === id);
  return parseDive(readFileSync(join(ROOT, 'deep-dives', f), 'utf8'), id, entry);
});
dives.forEach((d) => diveIdSet.add(d.id));

/* README sections for the home page (single source with the repo README) */
function extractSection(md, headingRe) {
  const m = md.match(headingRe);
  if (!m) return '';
  const after = md.slice(m.index + m[0].length);
  const next = after.search(/^##? /m);
  return renderMd((next === -1 ? after : after.slice(0, next)).trim());
}
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
const whySection = extractSection(readme, /^## Why an atlas, not another book\n/m);
const howSection = extractSection(readme, /^## How to use the atlas\n/m);

/* reading order follows the README coverage list, falling back to catalog order */
const coverageOrder = [];
{
  const re = /\[([^\]]+)\]\(deep-dives\/([^)]+)\.md\)/g;
  let m;
  while ((m = re.exec(readme))) coverageOrder.push(m[2]);
}
const ordered = [...dives].sort((a, b) => {
  const ia = coverageOrder.indexOf(a.id), ib = coverageOrder.indexOf(b.id);
  return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
});

/* ── dive pages ────────────────────────────────────────────────── */

function divePage(d, prev, next, i, total) {
  const fromDir = `dive/${d.id}/`;
  const chips = [
    ...d.meta.domains.map((dom) => chip(dom, 'domain')),
    chip(`difficulty: ${d.meta.difficulty}`, `diff-${d.meta.difficulty}`),
    `<span class="chip">license: <a href="${d.meta.upstream}" rel="noopener">${d.meta.license}</a></span>`,
  ].join('');
  const commitLine = `<p class="pinned-commit">Pinned commit: <code>${d.meta.commit || '—'}</code>` +
    (d.meta.commitNote ? ` · ${d.meta.commitNote}` : '') +
    ` · <a href="${d.meta.upstream}" rel="noopener">upstream ↗</a></p>`;

  const tocHtml = d.toc.length
    ? `<nav class="toc" aria-label="Contents"><div class="toc-title">On this page</div><ol>${d.toc
        .map((t) => `<li><a href="#${t.id}">${t.text}</a></li>`)
        .join('')}</ol></nav>`
    : '';

  const navHtml = `<div class="dive-nav">
  ${prev ? `<a href="${relUrl(fromDir, 'dive/' + prev.id + '/')}"><span class="dir">← Previous dive</span>${prev.title}</a>` : '<span></span>'}
  ${next ? `<a href="${relUrl(fromDir, 'dive/' + next.id + '/')}" style="text-align:right"><span class="dir">Next dive →</span>${next.title}</a>` : '<span></span>'}
</div>`;

  const body = `<div class="page article-layout">
${tocHtml}
<div>
  <header class="article-header">
    <h1>${d.title}</h1>
    <div class="meta-chips">${chips}</div>
    ${commitLine}
  </header>
  <article>
${rewriteLinks(d.html, fromDir)}
  </article>
  ${navHtml}
  <p style="font-family:var(--sans);font-size:.8rem;color:var(--ink-faint)">Deep-dive ${i + 1} of ${total} ·
    <a href="${relUrl(fromDir, 'patterns/')}">see which patterns this system instantiates</a></p>
</div>
</div>`;

  return {
    path: `${fromDir}index.html`,
    html: page({ title: `${d.title} — System Design Atlas`, description: d.description, body, fromDir }),
  };
}

const divePages = ordered.map((d, idx) =>
  divePage(d, ordered[idx - 1], ordered[idx + 1], idx, ordered.length));

/* ── patterns page ─────────────────────────────────────────────── */

function patternsPage() {
  const raw = readFileSync(join(ROOT, 'PATTERNS.md'), 'utf8');
  let html = renderMd(raw.replace(/^# .+\n/, ''));
  html = transformMermaid(html);
  const { html: withIds, toc } = addHeadingIds(html);
  const tocHtml = toc.length
    ? `<nav class="toc" aria-label="Contents"><div class="toc-title">Patterns</div><ol>${toc
        .map((t) => `<li><a href="#${t.id}">${t.text}</a></li>`)
        .join('')}</ol></nav>`
    : '';
  const body = `<div class="page article-layout">
${tocHtml}
<div>
  <header class="article-header"><h1>Patterns index: design lessons that recur</h1>
  <p class="lead">The deep-dives teach systems; this index teaches <strong>design</strong>. Each pattern appears in two or more canonical codebases — the recurrence is the signal.</p></header>
  <article>
${rewriteLinks(withIds, 'patterns/')}
  </article>
</div>
</div>`;
  return {
    path: 'patterns/index.html',
    html: page({
      title: 'Patterns index — System Design Atlas',
      description: 'Cross-cutting design lessons that recur across the atlas deep-dives, from content addressing to reconcile loops.',
      body,
      fromDir: 'patterns/',
    }),
  };
}

/* ── home page ─────────────────────────────────────────────────── */

function homePage() {
  const domainSet = [...new Set(dives.flatMap((d) => d.meta.domains))].sort();
  const cards = ordered
    .map(
      (d) => `<a class="dive-card" href="dive/${d.id}/" data-domains="${d.meta.domains.join(' ')}">
  <span class="dc-name">${escapeAttr(d.title.split(':')[0])}</span>
  <span class="dc-headline">${escapeAttr(d.headline)}</span>
  ${d.eliTeaser ? `<span class="dc-eli"><b>Like you're 10:</b> ${escapeAttr(d.eliTeaser)}</span>` : ''}
  <span class="dc-meta">${d.meta.domains.map((dom) => chip(escapeAttr(dom), 'domain')).join('')}${chip(d.meta.difficulty, `diff-${d.meta.difficulty}`)}</span>
</a>`,
    )
    .join('\n');

  const groups = new Map();
  for (const p of catalog.projects) {
    const key = (p.domains && p.domains[0]) || 'other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  const catalogHtml = [...groups.entries()]
    .map(([domain, ps]) => {
      const items = ps
        .map((p) => {
          const dived = dives.find((d) => d.id === p.id);
          const why = decodeEntities(String(p.why || '').replace(/\s+/g, ' ').trim());
          const whyShort = why.length > 220 ? why.slice(0, 217).replace(/\s\S*$/, '') + '…' : why;
          const nameHtml = dived
            ? `<a href="dive/${p.id}/">${escapeAttr(p.name)}</a>`
            : `<a href="${p.repo}" rel="noopener">${escapeAttr(p.name)} ↗</a>`;
          return `<li><span class="cat-name">${nameHtml}</span><span class="cat-status ${dived ? 'deep-dived' : 'cataloged'}">${dived ? 'deep-dived' : 'cataloged'}</span>
  <div class="cat-why">${escapeAttr(whyShort)}</div></li>`;
        })
        .join('\n');
      return `<details class="catalog-group"${domain === 'cache' ? ' open' : ''}>
<summary>${escapeAttr(domain)} <span class="count">(${ps.length})</span></summary>
<ul class="catalog-list">${items}</ul>
</details>`;
    })
    .join('\n');

  const body = `<div class="page">
<section class="hero">
  <div class="kicker">A curated atlas of great open-source code</div>
  <h1>Learn system design by reading the code that proved it</h1>
  <p class="tagline">${dives.length} canonical codebases, walked file-by-file at a pinned commit — the trade-offs frozen into real code, not folklore. Every page reads aloud, every system gets an “explain it like I'm 10”, every walkthrough steps through the request path.</p>
  <div class="cta">
    <a class="btn btn-primary" href="#dives">Browse the deep-dives</a>
    <a class="btn btn-ghost" href="patterns/">Patterns index</a>
    <a class="btn btn-ghost" href="${GITHUB_BASE}" rel="noopener">Read the markdown on GitHub ↗</a>
  </div>
</section>

<section class="home-section">
  <h2>Why an atlas, not another book</h2>
  <div class="readable">
${rewriteLinks(whySection, '')}
  </div>
</section>

<section class="home-section" id="dives">
  <h2>The deep-dives</h2>
  <div class="filter-row" role="group" aria-label="Filter by domain">
    <button type="button" class="filter-chip" aria-pressed="true">All</button>
    ${domainSet.map((d) => `<button type="button" class="filter-chip" data-domain="${escapeAttr(d)}" aria-pressed="false">${escapeAttr(d)}</button>`).join('\n    ')}
  </div>
  <div class="dive-grid">
${cards}
  </div>
</section>

<section class="home-section">
  <h2>How to use the atlas</h2>
  <div class="readable">
${rewriteLinks(howSection, '')}
  </div>
</section>

<section class="home-section">
  <h2>The wider catalog</h2>
  <p style="color:var(--ink-soft)">The atlas tracks ${catalog.projects.length} projects; ${dives.length} have deep-dives so far. Grouped by primary domain:</p>
  ${catalogHtml}
</section>
</div>`;

  return {
    path: 'index.html',
    html: page({
      title: 'System Design Atlas — learn system design from great open-source code',
      description: 'A curated atlas of canonical open-source codebases: deep-dives written from the source, ELI10 explainers, step-through walkthroughs, and read-aloud pages.',
      body,
      fromDir: '',
    }),
  };
}

/* ── emit ──────────────────────────────────────────────────────── */

const pages = [...divePages, patternsPage(), homePage()];
const outputs = new Map();
for (const p of pages) outputs.set(p.path, p.html);
outputs.set('assets/site.css', readFileSync(join(ROOT, 'site/assets/site.css'), 'utf8'));
outputs.set('assets/site.js', readFileSync(join(ROOT, 'site/assets/site.js'), 'utf8'));
outputs.set('.nojekyll', '');

const DOCS = join(ROOT, 'docs');
if (CHECK) {
  let ok = true;
  for (const [path, content] of outputs) {
    const file = join(DOCS, path);
    if (!existsSync(file) || readFileSync(file, 'utf8') !== content) {
      console.error(`STALE: docs/${path}`);
      ok = false;
    }
  }
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir)) {
      const full = join(dir, f);
      if (statSync(full).isDirectory()) walk(full);
      else if (!outputs.has(relative(DOCS, full))) { console.error(`EXTRA: docs/${relative(DOCS, full)}`); ok = false; }
    }
  };
  walk(DOCS);
  if (!ok) { console.error('docs/ is out of date — run: npm run build'); process.exit(1); }
  console.log(`docs/ is up to date (${outputs.size} files).`);
} else {
  rmSync(DOCS, { recursive: true, force: true });
  for (const [path, content] of outputs) {
    const file = join(DOCS, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  console.log(`Wrote ${outputs.size} files to docs/.`);
}

/* ── dev server ────────────────────────────────────────────────── */

if (SERVE) {
  const { createServer } = await import('node:http');
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
  createServer((req, res) => {
    let p = req.url.split('?')[0];
    if (p.endsWith('/')) p += 'index.html';
    try {
      res.setHeader('Content-Type', types[p.slice(p.lastIndexOf('.'))] || 'text/plain');
      res.end(readFileSync(join(DOCS, p.replace(/^\//, ''))));
    } catch { res.statusCode = 404; res.end('not found'); }
  }).listen(8092, () => console.log('serving docs/ at http://localhost:8092'));
  let timer;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => spawn(process.execPath, [join(ROOT, 'site/build.mjs')], { stdio: 'inherit' }), 150);
  };
  for (const dir of [join(ROOT, 'deep-dives'), join(ROOT, 'site/assets'), join(ROOT, 'PATTERNS.md'), join(ROOT, 'README.md'), join(ROOT, 'catalog.yaml')]) {
    if (existsSync(dir)) watch(dir, { recursive: true }, rebuild);
  }
}
