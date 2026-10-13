/* Gate 1 — the committed docs/ output is exactly what site/build.mjs
 * produces from the markdown sources. This is the same check as
 * `npm run check`, run here so `npm test` alone is self-contained in CI. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { ROOT } from './helpers.mjs';

test('docs/ is fresh: node site/build.mjs --check exits 0', () => {
  const r = spawnSync(process.execPath, ['site/build.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, `stale or failing docs/ build:\n${r.stdout}${r.stderr}`);
});
