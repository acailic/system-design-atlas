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
  (no code ticks in titles), and ```mermaid fenced diagrams. The
  `## Walkthrough:` heading itself must also be plain text — inline code
  ticks there silently break the stepper (build.mjs matches
  `Walkthrough:[^<]*` and the test suite stays green; only the
  step-through UI is lost). Numbered
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
- Upstream refactors happen: redis/sqlite/git/kafka/etcd have all recently moved core code (git's odb/ layer, kafka's log engine to storage module Java, etcd's raft extracted to etcd-io/raft, VS Code ext-host paths, linux v7.2's do_syscall_64 now in arch/x86/entry/syscall_64.c and sched_ext under kernel/sched/ext/). ClickHouse (dive #37): the old `IMergedBlockOutputStreamWriter` is now the `IMergeTreeDataPartWriter*` family, `QueryPipeline` moved to `src/QueryPipeline/`, `PipelineExecutor` to `src/Processors/Executors/Runtime/` — the sparse-index analysis landmark is `MergeTreeDataSelectExecutor::markRangesFromPKRange`. Always grep for the function, never trust memory of layout. Same for Go: at go1.27 the size-class table moved to `internal/runtime/gc/sizeclasses.go`, `mallocgc` grew specialized paths (`mallocgcTiny`, `mallocgcSmallNoscan`), and Green Tea marking (`mgcmark_greenteagc.go`, baseline-on via `internal/buildcfg/exp.go`) replaced the classic `gcDrain`/`scanobject` story — pin releases (go1.27.3 tag fetches fine with `git fetch --depth 1 origin tag <tag>`), not master, and clone from github.com/golang/go or go.googlesource.com (SHAs match). Chromium's frame_host/ logic now lives under content/browser/renderer_host/, and site-isolation concepts are split SiteInstance (principal) / SiteInstanceGroup (process view) / AgentSchedulingGroup (ordering) — classic-era docs are misleading.
- The chromium shallow clone is ~7 GB / ~510k files (~45M LOC counted via `git ls-files | xargs wc -l`); plan clone time accordingly and never attempt full-file greps without a path filter.
- HotSpot (dive #38, pinned jdk-27-ga 2026-08-19) moved a lot of lore: tieredThresholdPolicy is gone — the policy (5-level doc comment included) lives in share/compiler/compilationPolicy.{hpp,cpp}; safepointSynchronize.cpp → runtime/safepoint.cpp; oops/oopDesc.hpp → oops/oop.hpp; GenCollectedHeap → gc/serial/SerialHeap, markSweep → serialFullGC.cpp; HeapRegion renamed G1HeapRegion; G1 young pause extracted to G1YoungCollector; ZGC is generational (ZDriverMinor/Major actor threads) with colored-pointer layout documented in gc/z/zAddress.hpp. JVMCI/Graal JIT modules are NOT in the JDK 27 tree — don't cite them as in-tree pluggables. Cloning openjdk/jdk: plain `git clone --depth 1 --branch jdk-2N-ga` works (~1.1 GB checkout); resolve the tag sha via `git ls-remote --tags` for the pinned commit.
- Parallel dive PRs collide in catalog.yaml/README.md/PATTERNS.md and the generated `docs/` (dive-count footers, index, sitemap): rebase onto main, union-resolve the source files (both dives' entries stay), recount README's "tracks N further" sentence by actually counting non-deep-dived catalog entries, then rebuild `docs/` instead of hand-merging generated HTML.
- Cross-dive links use the `[Name](<id>.md)` form in deep-dives source; the builder rewrites them to `../<id>/` only when `deep-dives/<id>.md` exists on the branch — a link to a dive still sitting in an open PR renders as a (wrong-path) GitHub blob fallback until that PR merges and docs rebuild. Self-heals on the next rebuild after the sibling dive lands.
