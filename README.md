# system-design-atlas

Learn system design thinking by reading great open-source code.

This is a curated atlas of public open-source projects, each chosen because its
codebase *teaches system design* — not because it is popular. Every deep-dive
is written from actually reading the source: real files, real functions, real
line-level landmarks, pinned to a specific commit. No invented architecture
diagrams, no folklore.

## Why an atlas, not another book

Books teach system design in the abstract: "use a write-ahead log", "prefer
event loops for I/O-bound work", "content-address your data". Those are true
and useless until you have watched a real codebase pay for them — where the
loop lives, what the log record looks like, what trade was made to get there.

The atlas points at ~20 (and growing) canonical codebases and walks through
the *decisions frozen into their code*: the two or three defining trade-offs,
the data structures that carry the design, the concurrency model, the seams
where the system extends. You read the atlas entry, then you read the code
alongside it. That is the whole method.

## How to use the atlas

1. **Pick a domain you want to understand** — cache, storage engine, VCS,
   web server, database, runtime... Browse [`catalog.yaml`](catalog.yaml)
   (entries are tagged by domain and difficulty).
2. **Read the catalog entry's "why" paragraph** — it tells you what design
   lesson this codebase is unusually good at teaching.
3. **Shallow-clone the project** so you can follow along:
   ```bash
   mkdir -p clones && git clone --depth 1 <repo-url> clones/<id>
   ```
   Deep-dives pin the commit they were written against; expect small drift,
   the file/function landmarks are stable for years in mature projects.
4. **Read the deep-dive top to bottom once** (architecture → data
   structures → concurrency → trade-offs), then **work the reading path**
   in the actual clone, opening every cited file. The reading path is the
   product; the prose is the guide.
5. **Steal the lessons** — each deep-dive ends with "what to steal":
   transferable design moves you can apply to your own systems.

Time budget: a deep-dive plus its reading path is a focused 3–8 hours
(depending on the entry's difficulty rating). Do not rush the reading path.

## Repository map

| Path | What it is |
|---|---|
| [`catalog.yaml`](catalog.yaml) | The catalog: every tracked project, domain tags, "why this teaches X" |
| [`CURATION.md`](CURATION.md) | How projects are selected (influence, clarity, teachability, domain diversity) |
| [`deep-dives/`](deep-dives/) | Complete deep-dives, one markdown file per project |
| [`DEEP-DIVE-TEMPLATE.md`](DEEP-DIVE-TEMPLATE.md) | The repeatable template every deep-dive follows |
| [`PATTERNS.md`](PATTERNS.md) | Cross-cutting design index: lessons that recur across deep-dives |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | How to add catalog entries and write new deep-dives |
| [`LICENSES.md`](LICENSES.md) | Licensing: MIT for tooling, CC-BY-4.0 for prose, snippet policy |

## Current coverage

Deep-dives (the exemplars — more added over time):

- [Redis](deep-dives/redis.md) — event loop + purpose-built data structures
- [SQLite](deep-dives/sqlite.md) — layered embedded database architecture
- [git](deep-dives/git.md) — content-addressed object model
- [LevelDB](deep-dives/leveldb.md) — LSM-tree storage engine
- [nginx](deep-dives/nginx.md) — master/worker process model
- [PostgreSQL](deep-dives/postgresql.md) — process-per-connection, MVCC, WAL durability
- [Kafka](deep-dives/kafka.md) — append-only log, zero-copy, ISR replication, KRaft metadata
- [Kubernetes](deep-dives/kubernetes.md) — declarative state, informers, reconcile loops
- [CPython](deep-dives/cpython.md) — object model, refcounting, adaptive interpreter, GIL
- [Moby/Docker](deep-dives/moby.md) — content-addressed layers, graphdrivers, delegation to containerd/runc
- [VS Code](deep-dives/vscode.md) — extension host isolation, RPC object graph, LSP/DAP seams
- [etcd](deep-dives/etcd.md) — Raft as deterministic FSM, MVCC revisions, ReadIndex reads
- [Elasticsearch](deep-dives/elasticsearch.md) — NRT write path, cluster state diffs, scatter-gather search

The catalog tracks 21 further heavyweight and high-teaching-value
candidates awaiting deep-dives — Linux kernel, Memcached, Apache
httpd, ZooKeeper, RocksDB, Prometheus-class classics and more —
across databases, queues, runtimes, containers, ML, browser engines,
load balancers, and editors. Linux and Chromium are cataloged for
targeted reading rather than deep-dives by design (see their entries).

## Status

Seeded and growing. Markdown-first, no build step, no UI. See
[CONTRIBUTING.md](CONTRIBUTING.md) to extend it.
