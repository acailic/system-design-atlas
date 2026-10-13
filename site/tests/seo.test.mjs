/* Gate 2 — sitemap.xml, robots.txt, and og/canonical meta on every page.
 *
 * Not automatically coverable here (documented per the brief): whether search
 * engines and link-preview crawlers actually consume these (submission,
 * indexation, rendered cards). The tests assert the contract of what we
 * publish, not third-party behavior.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { DOCS, discoverPages, siteBase, pageUrl } from './helpers.mjs';

const base = siteBase();

test('robots.txt exists, allows crawlers, and points at the sitemap', () => {
  assert.ok(existsSync(join(DOCS, 'robots.txt')), 'docs/robots.txt is missing');
  const robots = readFileSync(join(DOCS, 'robots.txt'), 'utf8');
  assert.match(robots, /^User-agent: \*$/m, 'robots.txt: no "User-agent: *"');
  assert.match(robots, /^Allow: \/$/m, 'robots.txt: no "Allow: /"');
  assert.match(robots, new RegExp(`^Sitemap: ${base}/sitemap\\.xml$`, 'm'), 'robots.txt: sitemap line wrong');
});

test('sitemap.xml covers every published page — no missing, no extra, no duplicates', () => {
  const xml = readFileSync(join(DOCS, 'sitemap.xml'), 'utf8');
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 0, 'sitemap.xml has no <loc> entries');
  assert.equal(new Set(locs).size, locs.length, 'sitemap.xml has duplicate <loc> entries');

  const pages = discoverPages();
  const pageUrls = new Set(pages.map((p) => pageUrl(base, p.urlDir)));
  for (const p of pages) {
    assert.ok(pageUrls.has(pageUrl(base, p.urlDir)) && locs.includes(pageUrl(base, p.urlDir)),
      `published page docs/${p.rel} is missing from sitemap.xml`);
  }
  for (const loc of locs) {
    assert.ok(pageUrls.has(loc), `sitemap entry ${loc} has no corresponding page under docs/`);
  }
});

test('every published page carries og:title, og:description, and a matching canonical', () => {
  for (const p of discoverPages()) {
    const html = readFileSync(p.file, 'utf8');
    const grab = (re) => html.match(re)?.[1];
    const title = grab(/<title>([^<]*)<\/title>/);
    const metaDesc = grab(/<meta name="description" content="([^"]*)">/);
    const ogTitle = grab(/<meta property="og:title" content="([^"]*)">/);
    const ogDesc = grab(/<meta property="og:description" content="([^"]*)">/);
    const ogUrl = grab(/<meta property="og:url" content="([^"]*)">/);
    const canonical = grab(/<link rel="canonical" href="([^"]+)">/);

    assert.ok(ogTitle, `${p.rel}: og:title missing`);
    assert.equal(ogTitle, title, `${p.rel}: og:title differs from <title>`);
    assert.ok(ogDesc && ogDesc.length > 0, `${p.rel}: og:description missing/empty`);
    assert.equal(ogDesc, metaDesc, `${p.rel}: og:description differs from meta description`);
    assert.ok(ogDesc.length <= 300, `${p.rel}: og:description is suspiciously long (${ogDesc.length})`);
    assert.ok(canonical, `${p.rel}: canonical link missing`);
    assert.equal(canonical, pageUrl(base, p.urlDir), `${p.rel}: canonical is not this page's URL`);
    assert.equal(ogUrl, canonical, `${p.rel}: og:url differs from canonical`);
    assert.match(html, /<meta property="og:type" content="website">/, `${p.rel}: og:type missing`);
    assert.match(html, /<meta property="og:site_name" content="[^"]+">/, `${p.rel}: og:site_name missing`);
  }
});
