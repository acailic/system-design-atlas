# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.

## Project: system-design-atlas

- Markdown-first curated atlas of open-source design deep-dives; English content.
  The site (GitHub Pages, served from `docs/` on `main`) is *generated* — never
  hand-edit `docs/`.
- Source of truth for entries: `catalog.yaml` (schema documented at its top). Deep-dives live in `deep-dives/<id>.md` following `DEEP-DIVE-TEMPLATE.md`; the template's citation rules (pin commit, cite only what you opened) are the quality bar — see `CONTRIBUTING.md` for the checklist.
- Analyzed repos are shallow-cloned into `clones/` (gitignored); never vendor upstream code. Keep snippet policy from `LICENSES.md`.
- When adding a deep-dive: update `status: deep-dived` in catalog.yaml and the coverage list in README.md in the same change.
- Catalog selection weighs both popularity/ubiquity and design depth; heavyweight tools' `why:` paragraphs must tie popularity to the design decision that made them win (captain's standing emphasis).

## Site build (docs/ = generated GitHub Pages output)

- Build: `npm ci && npm run build` regenerates `docs/` from the markdown;
  `npm run check` fails if committed `docs/` is stale — run it before every
  push that touches prose. Deps are pinned in package.json (marked, js-yaml;
  no framework).
- After editing ANY prose (deep-dives, PATTERNS.md, README, catalog.yaml),
  rebuild and commit `docs/` in the same change.
- Deep-dive markdown conventions the builder depends on: unnumbered
  `## Explain like I'm 10` section (with a `**Why the grown-ups did it this
  way:**` paragraph), unnumbered `## Walkthrough: …` section whose steps are
  exactly `**Step N — Title.**` / `**Outcome — Title.**` bold-lead paragraphs
  (no code ticks in titles), and ```mermaid fenced diagrams. Numbered
  sections 1–9 keep their order; the two new sections are unnumbered so
  citations like "the reading path in section 6" stay stable.
- Read-aloud + steppers are progressive enhancement in `site/assets/site.js`;
  keep them working without JS (raw readable pages, mermaid source visible).
- Site tests: `npm test` = `node --test "site/tests/*.test.mjs"` — staleness gate
  plus jsdom DOM/JS wiring tests over the published `docs/` output (sitemap/
  robots/og/canonical per page; per-paragraph read-aloud play/stop toggle;
  home domain-filter + name-search wiring), plus a per-page weight budget (`site/tests/perfbudget.test.mjs`: HTML +
  local JS/CSS per page under 96 KiB, site.js 24 KiB, site.css 28 KiB —
  exceeding a budget is deliberate: bump the constant there with a reason).
  CI (`.github/workflows/ci.yml`) runs it on every PR. Keep the SEL constant
  in `site/tests/readaloud.test.mjs` in sync with site.js, and never run a
  bare `node --test` here — it would scan gitignored `clones/` for tests.
- Testing speechSynthesis locally: headless Chrome via libspeechd
  (speech-dispatcher + espeak-ng installed) exposes ~13k voices — every espeak
  "Name+variant" as its own entry, langs as bare codes ("sr", "en-US"). The
  voice picker filters `+` variants for this reason; cancel() surfaces as an
  `interrupted` error event (handled by the stale-utterance guard), and no
  boundary events fire, so verify progress by polling `speaking`.

## Deep-dive process addenda (learned during the 13-dive expansion)

- When adding a deep-dive, also update: `status:` in catalog.yaml, the coverage list in README.md, and (if the codebase instantiates a recurring lesson) the "Seen in" lists in PATTERNS.md — see CONTRIBUTING.md checklist.
- Upstream refactors happen: redis/sqlite/git/kafka/etcd have all recently moved core code (git's odb/ layer, kafka's log engine to storage module Java, etcd's raft extracted to etcd-io/raft, VS Code ext-host paths). Always grep for the function, never trust memory of layout.
- V8 (dive #31, pinned 2026-10-16) drifted from common lore in four
  places worth remembering if revisited: binary-op/compare feedback now
  lives *in the bytecode* as operand bytes ("embedded feedback",
  `kFeedbackIsEmbedded`, globals.h) with in-place baseline patching
  (Sparkplug+, already shipped per src/flags/feature-flags.h); the
  `--minor-ms` flag is gone — the Scavenger is the only young-gen
  collector; IsolateGroup lives in src/init/ (not src/execution/);
  and `turbolev` (Maglev graph builder feeding TurboFan) is
  flag-gated, so the sea-of-nodes path is still the default.
- Parallel dive PRs collide in catalog.yaml/README.md/PATTERNS.md and the generated `docs/` (dive-count footers, index, sitemap): rebase onto main, union-resolve the source files (both dives' entries stay), recount README's "tracks N further" sentence by actually counting non-deep-dived catalog entries, then rebuild `docs/` instead of hand-merging generated HTML.
