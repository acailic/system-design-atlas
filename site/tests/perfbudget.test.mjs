/* Gate 4 — page-weight budget (perf budget).
 *
 * The captain's rule: the read-aloud JS and the 25+ published pages must not
 * *accidentally* grow. Every test here reads the published docs/ output and
 * enforces size budgets over what a cold visitor downloads per page:
 *
 *   - per page: the page's HTML plus every local asset it references
 *     (stylesheet / script with a site-relative href — today that is
 *     assets/site.css and assets/site.js on every page)
 *   - separately: the two shared assets themselves, so growth in site.js /
 *     site.css is named directly instead of only surfacing as "every page
 *     got heavier"
 *
 * Budgets are raw (uncompressed) bytes, set from the sizes at introduction
 * plus headroom for intentional work:
 *   PAGE    96 KiB — heaviest page then was docs/index.html at 74.2 KiB
 *                   (37.9 html + 20.2 css + 15.2 js), i.e. ~32% headroom
 *   SITE.JS 24 KiB — site.js was 15.2 KiB (read-aloud + steppers), ~57%
 *   SITE.CSS 28 KiB — site.css was 20.2 KiB, ~38%
 * Exceeding a budget is a deliberate act: bump the constant here with a
 * justification, the same way the SEL constant in readaloud.test.mjs is
 * maintained.
 *
 * NOT automatically coverable here (documented per the brief): runtime
 * performance (TTFB, render, CDN latency), the mermaid.min.js payload
 * (external CDN, version- and integrity-pinned, cached cross-site), and warm
 * visits where the shared JS/CSS is already cached (budgets model the cold
 * first download of a page).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { DOCS, discoverPages } from './helpers.mjs';

const KiB = 1024;
const PAGE_BUDGET = 96 * KiB;
const SITE_JS_BUDGET = 24 * KiB;
const SITE_CSS_BUDGET = 28 * KiB;

const fmt = (bytes) => `${(bytes / KiB).toFixed(1)} KiB (${bytes} B)`;

/* Local stylesheet/script references in a page's HTML. Absolute URLs
 * (http(s)://, protocol-relative //) and data: URIs are external or inline
 * and don't hit our budget: the CDN mermaid script is version-pinned, and
 * the inline SVG favicon is already counted inside the HTML bytes. */
function localAssetRefs(html) {
  const refs = [];
  for (const m of html.matchAll(/<link\s[^>]*rel="stylesheet"[^>]*>/g)) {
    const href = m[0].match(/\bhref="([^"]+)"/)?.[1];
    if (href) refs.push(href);
  }
  for (const m of html.matchAll(/<script\s[^>]*\bsrc="([^"]+)"/g)) {
    refs.push(m[1]);
  }
  return refs.filter((r) => !/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(r) && !r.startsWith('data:'));
}

/* [label, absPath, size|null] for the page HTML and each referenced local
 * asset; null size = referenced but missing on disk (broken page, and a way
 * to dodge the budget — reported as a violation, not skipped). */
function pageParts(p) {
  const html = readFileSync(p.file, 'utf8');
  const parts = [{ label: 'html', path: p.file, size: statSync(p.file).size }];
  for (const ref of localAssetRefs(html)) {
    const abs = resolve(dirname(p.file), ref);
    const outside = relative(DOCS, abs).startsWith('..');
    parts.push({ label: ref, path: abs, outside, size: existsSync(abs) ? statSync(abs).size : null });
  }
  return parts;
}

test('every published page fits the per-page weight budget (HTML + local JS/CSS)', () => {
  const pages = discoverPages();

  /* guard against a vacuous pass: the captain's concern is explicitly about
   * a 25+ page site; if pages silently disappear, this loop must not pass
   * just because it iterated over nothing */
  assert.ok(pages.length >= 20,
    `expected at least 20 published pages, found ${pages.length} — did publishing break?`);

  const violations = [];
  for (const p of pages) {
    const parts = pageParts(p);
    const broken = parts.filter((x) => x.size == null || x.outside);
    if (broken.length > 0) {
      violations.push(`${p.rel}: references missing or docs/-external asset(s): ${broken.map((x) => x.label).join(', ')}`);
      continue;
    }
    const total = parts.reduce((s, x) => s + x.size, 0);
    if (total > PAGE_BUDGET) {
      const breakdown = parts.map((x) => `${x.label} ${fmt(x.size)}`).join(' + ');
      violations.push(`${p.rel}: ${fmt(total)} > budget ${fmt(PAGE_BUDGET)} (${breakdown})`);
    }
  }
  assert.deepEqual(violations, [],
    `${violations.length} page(s) over the ${fmt(PAGE_BUDGET)} weight budget:\n  - ${violations.join('\n  - ')}\n` +
    'If the growth is intentional, bump PAGE_BUDGET in site/tests/perfbudget.test.mjs with a justification.');
});

test('shared assets fit their own budgets: site.js and site.css', () => {
  const budgets = [
    { file: join(DOCS, 'assets', 'site.js'), budget: SITE_JS_BUDGET },
    { file: join(DOCS, 'assets', 'site.css'), budget: SITE_CSS_BUDGET },
  ];
  const violations = [];
  for (const { file, budget } of budgets) {
    assert.ok(existsSync(file), `${file} is missing`);
    const size = statSync(file).size;
    if (size > budget) {
      violations.push(`${relative(DOCS, file)}: ${fmt(size)} > budget ${fmt(budget)}`);
    }
  }
  assert.deepEqual(violations, [],
    `${violations.length} shared asset(s) over budget:\n  - ${violations.join('\n  - ')}\n` +
    'If the growth is intentional, bump the budget constant in site/tests/perfbudget.test.mjs with a justification.');
});
