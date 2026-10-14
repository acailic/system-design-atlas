/* Gate 5 — home deep-dive filter + name search wiring.
 *
 * The home page lists every deep-dive as a card; readers narrow it by
 * domain (filter chips, server-rendered from the dives' `Domains:` header)
 * and by name (a client-side search box). These tests assert the wiring:
 *   - statically: every card carries data-domains + a lowercase
 *     data-search name, a domain chip exists per domain used by the cards,
 *     and the search input + aria-live status are in the published HTML
 *   - behaviorally (deployed docs/assets/site.js evaluated in jsdom):
 *     a domain chip shows only that domain's cards and reports the count,
 *     clicking it again restores all, typing narrows by name, domain +
 *     search combine (AND), a no-match query hides everything with a
 *     helpful status, and Escape clears the search.
 *
 * NOT automatically coverable here: real keystroke/IME composition,
 * :focus-visible outlines, and layout/wrapping of the filter bar —
 * covered by the manual browser pass.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { JSDOM } from 'jsdom';
import { DOCS, siteBase } from './helpers.mjs';

const siteJs = readFileSync(join(DOCS, 'assets', 'site.js'), 'utf8');
const homeHtml = readFileSync(join(DOCS, 'index.html'), 'utf8');

/* Evaluate the deployed site.js against the published home page, the same
 * way readaloud.test.mjs does. */
async function loadHome() {
  const dom = new JSDOM(homeHtml, { url: siteBase() + '/', runScripts: 'outside-only' });
  const w = dom.window;
  await new Promise((r) => setTimeout(r, 0));
  if (w.document.readyState === 'loading') {
    await new Promise((r) => w.document.addEventListener('DOMContentLoaded', r, { once: true }));
  }
  w.eval(siteJs);
  return { dom, w };
}

const allCards = (w) => Array.from(w.document.querySelectorAll('.dive-card'));
const visible = (w) => allCards(w).filter((c) => c.style.display !== 'none');
const visibleNames = (w) => visible(w).map((c) => c.querySelector('.dc-name').textContent);
const statusText = (w) => w.document.querySelector('.filter-status').textContent;

function type(w, text) {
  const input = w.document.querySelector('.filter-search');
  input.value = text;
  input.dispatchEvent(new w.Event('input', { bubbles: true }));
}
function pressEscape(w) {
  w.document.querySelector('.filter-search')
    .dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}
function clickDomain(w, domain) {
  const chip = w.document.querySelector(`.filter-chip[data-domain="${domain}"]`);
  assert.ok(chip, `no filter chip for domain "${domain}"`);
  chip.click();
  return chip;
}

test('static wiring: cards carry domains + searchable name; search box and status exist', () => {
  const cardTags = [...homeHtml.matchAll(/<a class="dive-card"[^>]*>/g)].map((m) => m[0]);
  assert.ok(cardTags.length >= 20, `expected 20+ dive cards, found ${cardTags.length}`);

  const cardDomains = new Set();
  for (const tag of cardTags) {
    const doms = tag.match(/data-domains="([^"]*)"/)?.[1];
    assert.ok(doms && doms.trim(), `card missing data-domains: ${tag}`);
    doms.split(' ').forEach((d) => cardDomains.add(d));
    assert.match(tag, /data-search="[a-z0-9][^"]*"/, `card data-search must be a lowercase name: ${tag}`);
  }

  /* a filter chip per domain used by the cards (the build derives them
   * from the same source; assert the two sides agree) */
  const chipDomains = new Set(
    [...homeHtml.matchAll(/<button[^>]*class="filter-chip"[^>]*data-domain="([^"]+)"/g)].map((m) => m[1]),
  );
  assert.deepEqual([...chipDomains].sort(), [...cardDomains].sort(),
    'filter chips do not cover exactly the domains on the cards');

  /* search input with an accessible name + live status region */
  assert.match(homeHtml, /<input type="search" class="filter-search"[^>]*aria-label="Search deep-dives by name"/,
    'search input missing or not labeled');
  assert.match(homeHtml, /<p class="filter-status" aria-live="polite">/,
    'filter status (aria-live) missing');

  /* progressive enhancement: with JS off, all cards stay visible —
   * no inline display:none ships in the static HTML */
  assert.ok(!homeHtml.includes('style="display:none"'), 'static HTML ships hidden cards');
});

test('domain chip filters cards, reports the count, and toggles back off', async () => {
  const { dom, w } = await loadHome();
  try {
    const total = allCards(w).length;
    const chip = clickDomain(w, 'storage-engine');

    const shown = visible(w);
    assert.ok(shown.length >= 1, 'storage-engine filter shows nothing');
    assert.ok(shown.length < total, 'storage-engine filter does not narrow');
    for (const c of shown) {
      assert.ok(c.dataset.domains.split(' ').includes('storage-engine'),
        'a card without the domain survived the filter');
    }
    assert.equal(chip.getAttribute('aria-pressed'), 'true', 'active chip not aria-pressed');
    assert.match(statusText(w), new RegExp(`^${shown.length} of ${total} deep-dives$`),
      'status does not report "N of M deep-dives"');

    chip.click(); // same chip again = deselect
    assert.equal(visible(w).length, total, 'toggle-off did not restore all cards');
    assert.equal(chip.getAttribute('aria-pressed'), 'false');
    assert.equal(statusText(w), '', 'status not cleared when unfiltered');
  } finally {
    dom.window.close();
  }
});

test('search by name narrows cards; clearing restores them', async () => {
  const { dom, w } = await loadHome();
  try {
    type(w, 'redis');
    assert.deepEqual(visibleNames(w), ['Redis'], "searching 'redis' should show exactly the Redis dive");

    type(w, 'redis again'); // matches nothing
    assert.equal(visible(w).length, 0, 'non-matching query still shows cards');
    assert.match(statusText(w), /^0 of \d+ deep-dives match — try another area or search\.$/);

    pressEscape(w); // Escape clears the query
    assert.equal(w.document.querySelector('.filter-search').value, '', 'Escape did not clear the input');
    assert.equal(visible(w).length, allCards(w).length, 'Escape did not restore all cards');
  } finally {
    dom.window.close();
  }
});

test('domain filter and name search combine (both must match)', async () => {
  const { dom, w } = await loadHome();
  try {
    clickDomain(w, 'storage-engine');
    type(w, 'sql');
    /* 'sql' matches SQLite and PostgreSQL; both carry storage-engine */
    assert.deepEqual(visibleNames(w).sort(), ['PostgreSQL', 'SQLite'],
      'domain + search did not intersect correctly');

    /* widening the search past the domain's candidates empties the grid */
    type(w, 'nginx');
    assert.equal(visible(w).length, 0);
    assert.match(statusText(w), /^0 of \d+ deep-dives match/);
  } finally {
    dom.window.close();
  }
});
