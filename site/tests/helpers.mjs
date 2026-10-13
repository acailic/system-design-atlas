/* Shared helpers for the site test suite (run: npm test / node --test site/tests/).
 *
 * Tests read the *published* output under docs/ — exactly what GitHub Pages
 * serves — and never rebuild it themselves (a staleness gate test does that).
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const DOCS = join(ROOT, 'docs');

/* Every published HTML page: docs/index.html → '', docs/dive/redis/index.html
 * → 'dive/redis/'. Any future non-index .html file surfaces as its relative
 * path so the sitemap-coverage test forces it to be published on purpose. */
export function discoverPages() {
  const pages = [];
  const walk = (dir) => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, f.name);
      if (f.isDirectory()) walk(full);
      else if (f.name.endsWith('.html')) {
        const rel = relative(DOCS, full).split('\\').join('/');
        const urlDir =
          rel === 'index.html' ? '' : rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
        pages.push({ file: full, rel, urlDir });
      }
    }
  };
  walk(DOCS);
  pages.sort((a, b) => a.urlDir.localeCompare(b.urlDir));
  return pages;
}

/* The deployed site base URL, derived from robots.txt's Sitemap line — the
 * single source of truth stays in site/build.mjs; tests never hardcode it. */
export function siteBase() {
  const robots = readFileSync(join(DOCS, 'robots.txt'), 'utf8');
  const m = robots.match(/^Sitemap:\s+(\S+)\/sitemap\.xml$/m);
  if (!m) throw new Error('robots.txt has no "Sitemap: <base>/sitemap.xml" line');
  return m[1];
}

export const pageUrl = (base, urlDir) => `${base}/${urlDir}`;
