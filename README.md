# system-design-atlas

Learn system design thinking by reading great open-source code.

**🌐 Read the atlas as a website:**
**https://acailic.github.io/system-design-atlas/** — every deep-dive with
rendered architecture diagrams, an "explain like I'm 10" section, an
interactive step-through walkthrough of each system's spine, and
read-aloud on every paragraph (voice + speed of your choice). The
markdown in this repo remains the source of truth; the site is generated
from it.

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

The atlas points at 35 (and growing) canonical codebases and walks through
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
| [`site/`](site/) | The static-site generator (`npm run build`) — no framework, marked + js-yaml |
| [`docs/`](docs/) | The generated GitHub Pages site (committed; regenerate with `npm run build`) |

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
- [Memcached](deep-dives/memcached.md) — slab allocator, segmented LRU, smart clients over smart server
- [Apache httpd](deep-dives/httpd.md) — hook-based module platform, filters, pools, swappable MPMs
- [ZooKeeper](deep-dives/zookeeper.md) — ZAB consensus, ordered znode tree, sessions + one-shot watches
- [NATS](deep-dives/nats.md) — subject trie routing, minimal text protocol, opt-in JetStream durability
- [libuv](deep-dives/libuv.md) — portable event loop: phases, watcher queues, thread pool + async doorbell
- [runc](deep-dives/runc.md) — containers as syscalls: re-exec twin, sync-pipe bootstrap, pivot_root
- [Lua](deep-dives/lua.md) — embeddable language core: one TValue, register VM, C-API virtual stack
- [Envoy](deep-dives/envoy.md) — API-driven data plane: worker snapshots, filter chains, xDS hot config
- [curl](deep-dives/curl.md) — transfer state machine that rents foreign event loops; layered cfilters
- [llama.cpp](deep-dives/llama-cpp.md) — framework-free LLM inference: ggml tensor graphs, quantization-first, mmap weights
- [Node.js](deep-dives/nodejs.md) — V8 + libuv wrapped into one platform: the C++/JS boundary as the core design
- [FFmpeg](deep-dives/ffmpeg.md) — thousands of components behind four uniform C-struct contracts, refcounted zero-copy data, DTS-paced thread-per-component scheduler
- [PyTorch](deep-dives/pytorch.md) — define-by-run autograd: the eager pass records its own tape over a C++ dispatcher
- [Servo](deep-dives/servo.md) — supervised message-passing pipelines: the constellation, a DOM pointer vocabulary for Rust + GC, layout as an in-thread visitor, runtime-switchable process topology
- [HAProxy](deep-dives/haproxy.md) — budgeted tasklet scheduler, ebtree run queues, socket-handoff seamless reload
- [Linux kernel](deep-dives/linux.md) — frozen syscall ABI over vtable seams: fair-share EEVDF scheduler, lock-free page cache, RCU reads
- [Go runtime](deep-dives/go.md) — M:N goroutines: GMP work-stealing scheduler, integrated netpoller, growable stacks + escape analysis, concurrent GC with a hybrid write barrier
- [RocksDB](deep-dives/rocksdb.md) — LevelDB paged into production: column families over one WAL, stall ladders and I/O budgets, pluggable compaction
- [V8](deep-dives/v8.md) — speculative optimization as architecture: feedback-driven tiering (Ignition → Sparkplug → Maglev → TurboFan), hidden classes, guarded deopt, concurrent GC, isolate-per-realm embedding
- [Chromium](deep-dives/chromium.md) — a security model that forced the architecture: sandboxed renderer processes, site isolation, Mojo capability IPC, the browser's mirrored frame tree
- [Caddy](deep-dives/caddy.md) — goroutines instead of state machines, config as a provisioned document, automatic HTTPS as a subsystem
- [Neovim](deep-dives/neovim.md) — editor as RPC server: msgpack-RPC UI seam, in-process Lua on the shared libuv loop

The catalog currently tracks no further heavyweight and
high-teaching-value candidates awaiting deep-dives — every
cataloged heavyweight already has one —
across databases, queues, runtimes, containers, ML, browser engines,
load balancers, and editors.

## Status

Seeded and growing. Markdown-first: the prose is the product, and the
[website](https://acailic.github.io/system-design-atlas/) is generated
from it (`npm run build` → committed `docs/`, served by GitHub Pages).
See [CONTRIBUTING.md](CONTRIBUTING.md) to extend it.
