/* Tests for the generated site output: sitemap.xml, robots.txt, and the
 * per-page meta head. Runs the builder first so it asserts what build.mjs
 * actually emits (docs/ is generated — never hand-edited).
 *
 *   npm test
 *
 * Zero dependencies: node:test ships with Node. If these fail, the fix
 * belongs in site/build.mjs (or the markdown it reads), not in docs/.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const SITE_URL = 'https://acailic.github.io/system-design-atlas';

/* ── rebuild docs/ fresh, once, before any assertion ────────────── */

const build = spawnSync(process.execPath, [join(ROOT, 'site/build.mjs')], { encoding: 'utf8' });
if (build.status !== 0) console.error(build.stdout, build.stderr);

/* ── helpers ────────────────────────────────────────────────────── */

function discoverPages() {
  const pages = [{ dir: '', file: 'index.html' }, { dir: 'patterns/', file: 'index.html' }];
  for (const id of readdirSync(join(DOCS, 'dive'))) {
    if (existsSync(join(DOCS, 'dive', id, 'index.html'))) pages.push({ dir: `dive/${id}/`, file: 'index.html' });
  }
  return pages;
}
const pages = discoverPages();
const read = (p) => readFileSync(join(DOCS, p), 'utf8');
const meta = (html, key) => html.match(new RegExp(`<meta (?:name|property)="${key}" content="([^"]*)">`))?.[1];
const linkRel = (html, rel) => html.match(new RegExp(`<link rel="${rel}" href="([^"]*)">`))?.[1];

/* ── build ──────────────────────────────────────────────────────── */

test('build.mjs exits cleanly', () => assert.equal(build.status, 0, build.stderr));

/* ── robots.txt ─────────────────────────────────────────────────── */

test('robots.txt allows crawlers and points at the sitemap', () => {
  const robots = read('robots.txt');
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.equal(robots.match(/^Sitemap: (.+)$/m)?.[1], `${SITE_URL}/sitemap.xml`);
});

/* ── sitemap.xml ────────────────────────────────────────────────── */

test('sitemap.xml is well-formed with a urlset namespace', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(sitemap, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(sitemap, /<\/urlset>\n?$/);
  /* every <url> holds exactly one <loc> */
  assert.equal(sitemap.match(/<url>/g)?.length, sitemap.match(/<\/url>/g)?.length);
  assert.equal(sitemap.match(/<loc>/g)?.length, sitemap.match(/<\/loc>/g)?.length);
});

test('sitemap.xml covers exactly the published pages, uniquely', () => {
  const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = new Set(pages.map((p) => `${SITE_URL}/${p.dir}`));
  assert.deepEqual([...new Set(locs)].sort(), [...expected].sort(), 'sitemap drift vs docs/ pages');
  assert.equal(locs.length, new Set(locs).size, 'duplicate <loc> entries');
  /* home first, patterns last — the reading order the site presents */
  assert.equal(locs[0], `${SITE_URL}/`);
  assert.equal(locs.at(-1), `${SITE_URL}/patterns/`);
});

/* ── per-page head meta ─────────────────────────────────────────── */

for (const { dir, file } of pages) {
  test(`meta head: ${dir || '(home)'}`, () => {
    const html = read(join(dir, file));
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
    assert.ok(title, '<title> present');

    const ogTitle = meta(html, 'og:title');
    assert.equal(ogTitle, title, 'og:title mirrors <title>');
    assert.ok(ogTitle.includes('System Design Atlas'), 'site name present for consistent link previews');

    const desc = meta(html, 'description');
    const ogDesc = meta(html, 'og:description');
    assert.ok(desc?.length >= 40, 'description non-trivial');
    assert.equal(ogDesc, desc, 'og:description mirrors description');

    assert.equal(meta(html, 'og:type'), 'website');
    assert.equal(meta(html, 'og:site_name'), 'System Design Atlas');

    const canonical = linkRel(html, 'canonical');
    assert.equal(canonical, `${SITE_URL}/${dir}`, 'canonical is the page URL');
    assert.equal(meta(html, 'og:url'), canonical, 'og:url mirrors canonical');

    /* the tag-stripping artifact these tests lock out: "foo , bar" */
    assert.doesNotMatch(desc, /\s+[,.;:!?]/, 'no space-before-punctuation artifact');
  });
}

test('canonical URLs are unique across all pages', () => {
  const canonicals = pages.map(({ dir, file }) => linkRel(read(join(dir, file)), 'canonical'));
  assert.equal(new Set(canonicals).size, canonicals.length);
});

/* ── home-page ELI10 teasers (same tag-stripping path) ──────────── */

test('home-page ELI10 teasers have no punctuation artifact', () => {
  const teasers = [...read('index.html').matchAll(/dc-eli"><b>[^<]*<\/b> ([^<]*)</g)].map((m) => m[1]);
  assert.ok(teasers.length > 0, 'home cards render ELI10 teasers');
  for (const t of teasers) assert.doesNotMatch(t, /\s+[,.;:!?]/, `artifact in teaser: ${t.slice(0, 60)}`);
});

/* ── no stray files: check parity is enforced by build --check too ── */

test('docs/ contains no extra files beyond the build output', async () => {
  const { statSync } = await import('node:fs');
  const extras = [];
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const full = join(d, f);
      if (statSync(full).isDirectory()) walk(full);
      else extras.push(relative(DOCS, full));
    }
  };
  walk(DOCS);
  /* only generated outputs may exist — .nojekyll, assets/, pages, sitemap, robots */
  const allowed = new Set([
    '.nojekyll', 'sitemap.xml', 'robots.txt', 'index.html',
    'assets/site.css', 'assets/site.js', 'patterns/index.html',
    ...pages.filter((p) => p.dir.startsWith('dive/')).map((p) => `${p.dir}index.html`),
  ]);
  assert.deepEqual(extras.filter((f) => !allowed.has(f)), []);
});
