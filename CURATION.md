# Curation criteria

The atlas is deliberately **not** an awesome-list. An awesome-list answers
"what is good software?"; the catalog answers "**whose code will make me a
better system designer if I read it?**" Every entry must earn its place on
four axes. A project that is famous but unreadable, or readable but
design-trivial, does not belong here.

## The four axes

Each candidate is scored 1–5 per axis by whoever proposes it (and re-scored
in review). Rough bar for inclusion: **no axis below 3, total ≥ 15**.
Entries scoped as reference reading (e.g. Linux) may sit
below the bar when their why-paragraph argues targeted-reading value;
the bar governs deep-dive candidates.

### 1. Design influence (weight: high)

Did this codebase's design choices propagate? Do other systems copy its
approach, its terminology, or its architecture? Influence is evidence that
the frozen-in-code decisions were *good enough to steal repeatedly* — which
is exactly what we want the reader to practice.

- Redis popularized the single-threaded event-loop server with
  purpose-built data structures; every "Redis-clone" inherits the shape.
- LevelDB's LSM design begat RocksDB and a generation of storage engines.
- git's content-addressed object model is now the default mental model of
  modern VCS.

**Popularity is evidence, and we use it as such.** The atlas weighs
candidates by both fame (stars, ubiquity in production) and design depth —
chosen for *learning value*. The heavyweight tools the industry actually
runs (Linux, PostgreSQL, Redis, nginx, git, Kubernetes, Docker, Kafka,
SQLite, Elasticsearch, VS Code, Chromium...) belong here precisely because
they won, and their catalog entries must tie that popularity to the
specific design decision that made them win. Popularity without a
readable design story does not qualify; a brilliant design nobody adopted
needs a stronger clarity/teachability case to earn its slot.

Not required: the project must be *first*. Clones that are cleaner teaching
versions of an influential design (e.g. a minimal Raft implementation)
qualify via clarity instead — but mark `derivative_of` in the catalog.

### 2. Clarity of the codebase

Can a competent reader follow one operation end-to-end in a day? Signals:

- Cohesive modules with discoverable names; a visible spine (a main loop,
  a request path, a commit path) you can walk by following calls.
- Comments that explain *why* (nginx and SQLite are exemplary here).
- Bounded size for the teaching-relevant core — the atlas dives into the
  5–10% of files that carry the design, but those files must be findable.
- Stable idiomatic use of one primary language.

Counter-examples: projects whose design lives in generated code, macro
forests, or 10k-line files; projects where the interesting logic is smeared
across hundreds of micro-services.

### 3. Teachability

Stronger than clarity: does the codebase *expose* its design?

- There is a natural "one story to follow": one request (nginx), one query
  (SQLite), one write (LevelDB), one commit (git).
- The defining trade-offs are visible in structure, not hidden behind
  abstractions — you can put your finger on the line where latency was
  traded for durability.
- Prerequisites are learnable in a sitting (e.g. LSM basics from a blog
  post), not a semester (e.g. type theory).

### 4. Diversity of problem domains

The catalog as a whole must span forces, not cluster on one: latency vs
throughput, durability vs speed, single-node vs distributed, parsing vs
rendering, kernel-adjacent vs user-space. Before adding an entry, check
whether its domain tag already has 3+ representatives — if so, the bar for
that entry rises, or it should displace a weaker incumbent (say so in the
PR).

Domains tracked today: `os-kernel`, `database`, `storage-engine`, `cache`,
`web-server`, `proxy-lb`, `vcs`, `queue-log`, `runtime`, `language`,
`compiler`, `container`, `orchestration`, `ml-framework`, `browser-engine`,
`editor`, `distributed`, `search-engine`, `networking`, `media`, `observability`.

## Scoring rubric

```
design_influence: 1–5
clarity:           1–5
teachability:      1–5
domain_fit:        1–5   (does the atlas need this domain / this entry?)
```

Scores live in the catalog entry as a comment block, so drift is visible
when entries are re-reviewed.

## Anti-goals

- **Exhaustiveness.** The catalog is curated and grows slowly. Hundreds of
  entries are fine *eventually*; hundreds next month are not.
- **Fashion.** Stars and momentum are weak proxies for teaching value.
- **Beginner-friendliness at all costs.** Difficulty is a dimension we
  *record* (see the deep-dive template), not one we optimize away. Some
  essential systems are hard; we label the prerequisites honestly.
- **Live-docs duty.** We pin commits and don't chase HEAD. Stale-ish is
  fine; wrong is not.
