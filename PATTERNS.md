# Patterns index: design lessons that recur across the atlas

The deep-dives teach systems; this index teaches **design**. Each
pattern below appears independently in two or more canonical
codebases — usually invented by one and rediscovered (or inherited) by
the others. That recurrence is the strongest signal in the atlas: when
very different teams under different constraints converge on the same
shape, you are looking at a real pattern, not a fashion.

Read this file two ways: top-down as a course in applied system design
(each pattern ends with "reach for it when…"), or bottom-up as a
back-of-the-book index into the deep-dives.

---

## 1. Content addressing (name things by their hash)

**Shape:** immutable artifacts whose identifier is a digest of their
bytes; identity, integrity, and dedup collapse into one mechanism.

**Seen in:** [git](deep-dives/git.md) — the entire object database is
hash-keyed, so verification and dedup are free;
[Moby](deep-dives/moby.md) — image layers are digest-named, which is
why registries are dumb blob stores and builds cache globally.

**Why it recurs:** it deletes an entire class of coordination problems
(no registry to maintain, no trust needed in transport), and it makes
caching trivially correct.

**Reach for it when:** artifacts are immutable or versioned, produced
once and consumed many times. Beware: it converts "update" into "add
new + garbage-collect old" — you are signing up for a GC story.

## 2. Write-ahead logging (make the log the truth)

**Shape:** append the change to a log before (or instead of) mutating
data pages; recovery = replay; durability = fsync the log.

**Seen in:** [SQLite](deep-dives/sqlite.md) — journal and WAL as
selectable modes behind the pager; [PostgreSQL](deep-dives/postgresql.md)
— XLogInsert/redo as *the* durability mechanism for every subsystem;
[LevelDB](deep-dives/leveldb.md) — WAL as the boundary between
"durable" and "cache"; [Kafka](deep-dives/kafka.md) — where the log
stops being a technique and becomes the product; [etcd](deep-dives/etcd.md)
— raft entries and snapshots framed in a WAL the server replays on
restart; [Elasticsearch](deep-dives/elasticsearch.md) — the translog
is the WAL that decouples "searchable" (refresh) from "durable" (flush);
[ZooKeeper](deep-dives/zookeeper.md) — FileTxnLog appends every
proposal and fsyncs before the follower acks, so election is just
"highest log wins."

**Why it recurs:** sequential appends are the cheapest thing storage
does; a single log turns unbounded crash-consistency problems into one
mechanical replay.

**Reach for it when:** you must survive crashes — which is always.
The pattern's costs are write amplification and a checkpoint/compaction
story, both cheaper than the alternative.

## 3. Immutable core, tiny mutable surface

**Shape:** the bulk of state is append-only/immutable; all mutation is
concentrated in one small, carefully synchronized component.

**Seen in:** [git](deep-dives/git.md) — objects never change; refs are
the only mutable pointers; [LevelDB](deep-dives/leveldb.md) — SSTables
are immutable; the manifest (itself a log) is the mutable layout;
[Kafka](deep-dives/kafka.md) — KRaft moved broker metadata into an
append-only raft log.

**Why it recurs:** small mutable surfaces are auditable, lockable, and
crash-safe; everything else becomes shareable and cacheable.

**Reach for it when:** reads dominate writes and history matters. The
price is always a GC/compaction subsystem — budget it from day one.

## 4. Supervisor + expendable workers

**Shape:** a stateless supervisor owns listening sockets/lifecycle;
per-connection or per-job work happens in workers whose death is an
incident, not an outage.

**Seen in:** [nginx](deep-dives/nginx.md) — master holds the sockets,
workers die and respawn; [PostgreSQL](deep-dives/postgresql.md) — the
postmaster forks backends, one connection per process;
[Redis](deep-dives/redis.md) — persistence by fork: the child is an
expendable snapshotter over copy-on-write memory;
[Apache httpd](deep-dives/httpd.md) — the MPM parent supervises score-
board-tracked children and respawns them while a graceful restart
drains the old generation;
[Servo](deep-dives/servo.md) — the
constellation thread supervises expendable pipelines (script
threads or sandboxed child processes) and is chaos-tested against
random pipeline death;
[HAProxy](deep-dives/haproxy.md) — the
master re-executes itself per reload and the old worker hands its
listening sockets to the new one over a socketpair, so the supervisor
ever only owns supervision, never a single connection;
[Chromium](deep-dives/chromium.md) — the
browser process supervises sandboxed renderer processes it assumes
are hostile: a dead renderer is a sad tab and a policy-ladder
respawn, and a lying one is killed on a catalogued
BadMessageReason.

**Why it recurs:** crash containment composes; supervision is easy
precisely when the supervisor owns nothing user-visible.

**Reach for it when:** work is parallelizable and per-unit state is
small. Workers that hold large in-memory state (databases' backends
mid-transaction) pay on restart — that's the trade PostgreSQL accepts
knowingly.

## 5. Event loop / readiness demultiplexing

**Shape:** one thread per process blocks in epoll/kqueue and dispatches
callbacks; concurrency without shared-memory parallelism.

**Seen in:** [Redis](deep-dives/redis.md) — `ae` loop, plus the
evolution of IO threads around a still-serial command core;
[nginx](deep-dives/nginx.md) — one loop per worker with state
machines instead of threads;
[Memcached](deep-dives/memcached.md) — one libevent loop per worker
thread, connections dispatched round-robin at accept;
[libuv](deep-dives/libuv.md) — the pattern distilled into a portable
library: phases, watcher queues, and a poller backend per OS;
[Envoy](deep-dives/envoy.md) — one dispatcher per worker thread over
thread-local config snapshots;
[curl](deep-dives/curl.md) — the tenant's side of the same contract:
a transfer state machine that rents any foreign loop via pollsets;
[Servo](deep-dives/servo.md) — one task-queue event loop per
site-instance script thread implements the WHATWG event-loop
processing model, so one page's hang cannot stall another site;
[HAProxy](deep-dives/haproxy.md) — one poll loop per thread, but with
the loop's own scheduler made explicit: budgeted tasklet run queues
in ebtrees, weighted by class, policed by a CPU-time watchdog;
[Chromium](deep-dives/chromium.md) — every
process is threads-over-queues: the browser's named UI/IO threads
plus a trait-tagged ThreadPool, and renderers whose main thread is
the HTML event loop — with PostTask messages, not locks, as the
officially documented cross-thread contract.

**Why it recurs:** I/O-bound servers are bounded by ready descriptors,
not by CPU; a loop removes per-connection stacks and most locking.

**Reach for it when:** workload is I/O-bound with cheap per-event
work. The moment per-event work is CPU-heavy you need the worker/
process variants (pattern 4) or threads — C10K logic does not survive
a 100ms handler.

## 6. Amortize every unbounded operation

**Shape:** rehash, expiry, compaction, and freeing move a bounded
amount of work per operation or per tick, never in one burst.

**Seen in:** [Redis](deep-dives/redis.md) — incremental rehash and
time-budgeted active expiry; [LevelDB](deep-dives/leveldb.md) —
leveled compaction with slowdown/stop triggers;
[PostgreSQL](deep-dives/postgresql.md) — vacuum as a background GC
with autovacuum tuning; [Kubernetes](deep-dives/kubernetes.md) —
resync periods as a safety net under the event stream;
[Memcached](deep-dives/memcached.md) — hash-table expansion by a
background thread moving buckets under the same stripe locks the
request path uses; [Lua](deep-dives/lua.md) — the GC advances in
allocation-debt-paced steps (`luaC_step`) so a guest language never
pauses its host's frame budget.

**Why it recurs:** latency SLOs are p99 problems; any O(n) pause
inside a request path eventually lands in someone's tail.

**Reach for it when:** anything grows. The rule of thumb from these
codebases: if the work is unbounded, it belongs to a background loop
with a budget, not to the request.

## 7. Declarative state + reconcile loops

**Shape:** clients write desired state; controllers observe and
converge; events are hints, truth is compared, not remembered.

**Seen in:** [Kubernetes](deep-dives/kubernetes.md) — the entire
control plane; [Moby](deep-dives/moby.md) — Config/HostConfig/State
is the same spec/status split at container granularity (and restart
policies are a reconcile loop over exit states);
[NATS](deep-dives/nats.md) — JetStream converges stream placement
toward `desiredRaftGroup` state when servers fail or are added.

**Why it recurs:** distributed systems miss events; idempotent
convergence from any state survives what edge-triggered designs
cannot.

**Reach for it when:** multiple unreliable actors must eventually
agree on a world state. Cost: everything becomes eventually
consistent, and debugging means diffing desired vs actual.

## 8. Quarantine the environment behind one interface

**Shape:** all OS/platform dependency funnels through a narrow
abstraction; ports are implementations of it.

**Seen in:** [SQLite](deep-dives/sqlite.md) — VFS is why it runs from
phones to airliners; [LevelDB](deep-dives/leveldb.md) — `Env` as the
whole OS surface; [nginx](deep-dives/nginx.md) — event-module vtables
(epoll/kqueue/select behind one macro);
[libuv](deep-dives/libuv.md) — the whole product is this pattern: one
loop core, one `uv__io_poll` per platform.

**Why it recurs:** portability is architectural, not a build flag; the
interface is where testing doubles (in-memory VFS, memdb) come from.

**Reach for it when:** the system must outlive your current platform
assumptions. The failure mode is a leaky abstraction — SQLite's VFS
survived because its contract stayed small and honest.

## 9. Versioned data for concurrent readers (MVCC)

**Shape:** writers create new versions; readers pick a snapshot;
"current" is a query, not a location.

**Seen in:** [PostgreSQL](deep-dives/postgresql.md) — xmin/xmax and
snapshots from the procarray; [Kubernetes](deep-dives/kubernetes.md) —
resourceVersion optimistic concurrency over every object; [LevelDB](deep-dives/leveldb.md) —
compaction drops versions below the oldest live snapshot; [etcd](deep-dives/etcd.md)
— the whole keyspace is revision-stamped history, watch replays it,
compaction truncates it.

**Why it recurs:** locking readers against writers is the bottleneck
MVCC deletes; every system that did it never went back.

**Reach for it when:** read concurrency matters more than write
amplification. Always pair it with a GC story (vacuum, compaction).

## 10. Extension seams placed where the design flexes

**Shape:** third parties extend the system without forking it,
through hooks located at genuine joints (planner, filters, drivers,
process boundaries).

**Seen in:** [PostgreSQL](deep-dives/postgresql.md) — planner/
executor hooks spawned Citus and TimescaleDB; [nginx](deep-dives/nginx.md)
— phase handlers and filter chains; [SQLite](deep-dives/sqlite.md) —
VFS, virtual tables, loadable extensions; [Kubernetes](deep-dives/kubernetes.md)
— CRDs turn the API server into a platform; [CPython](deep-dives/cpython.md)
— the C API whose safety shaped (and constrained) everything,
including the GIL; [Moby](deep-dives/moby.md) — plugin protocols and
OCI-standardized boundaries; [VS Code](deep-dives/vscode.md) — the
stable/proposed two-tier API plus LSP/DAP as protocol-level seams;
[Apache httpd](deep-dives/httpd.md) — hooks, filters, and even the
process model (MPM) are extension surfaces, which is why one binary
served a decade of web-ecosystem roles; [Envoy](deep-dives/envoy.md)
— network/HTTP filter factories plus registered load-balancer
policies make even core scheduling an extension;
[curl](deep-dives/curl.md) — connection filters and protocol scheme
tables as composable seams; [llama.cpp](deep-dives/llama-cpp.md) —
model architectures as graph-builder files (160 of them) over a
dumb tensor core; [Lua](deep-dives/lua.md) — the metatable protocol
as the single seam users build inheritance, prototypes, and DSLs
through; [Node.js](deep-dives/nodejs.md) — two deliberate tiers:
a private `internalBinding` seam that churns with V8 and a frozen
N-API C ABI that lets precompiled native addons outlive engine
upgrades; [FFmpeg](deep-dives/ffmpeg.md) — codecs, demuxers, muxers,
and filters as plain C structs behind one callback contract each
(with per-arch SIMD as a second dispatch seam), which is how 880
compatible implementations coexist in one program;
[PyTorch](deep-dives/pytorch.md) — every extension (custom
ops, backends, interceptors, compilers) registers at the one
dispatch table, which is how eager Python stayed a platform;
[Servo](deep-dives/servo.md) — the engine grew an embedding API
(ServoBuilder/WebView delegates, protocol registry, factory traits)
so shells and C hosts (servoshell, ffi/capi) extend without forking.

**Why it recurs:** ecosystems compound only where extension is
contractual; the seams' *placement* decides which ecosystem you get.

**Reach for it when:** you can name who will extend you and what they
will want to change. Misplaced hooks become load-bearing mistakes
(CPython's is both its greatest asset and its hardest constraint).

## 11. Sequential I/O and zero-copy as throughput primitives

**Shape:** move bytes by appending and by kernel page-cache handoff;
avoid copies and random access on the hot path.

**Seen in:** [Kafka](deep-dives/kafka.md) — `transferFrom` to sockets,
sparse index + ≤4KB scan instead of per-record pointers;
[LevelDB](deep-dives/leveldb.md) — LSM writes are sequential by
construction, reads amortized by Bloom filters;
[git](deep-dives/git.md) — pack files and delta chains trade random
access for density on the shipping path.

**Why it recurs:** hardware grants sequential bandwidth an order of
magnitude beyond random; the designs that treat this as physics, not
preference, win throughput decades.

**Reach for it when:** volume is the product. Costs are read
amplification and index machinery to find things again.

## 12. Generate the surface from data

**Shape:** commands/APIs/config described as data (tables, JSON,
schemas) and compiled into dispatch, docs, validation, and clients.

**Seen in:** [Redis](deep-dives/redis.md) — commands.json → table →
dispatch/ACL/docs; [Kubernetes](deep-dives/kubernetes.md) — OpenAPI
schemas → typed clients for unknown future types;
[CPython](deep-dives/cpython.md) — bytecodes.c DSL generating the
interpreter and its metadata; [FFmpeg](deep-dives/ffmpeg.md) —
configure generates codec_list.c / filter_list.c from its component
lists, so the "plugin registry" is a static C array at link time
(print_enabled_components in configure:8774);
[PyTorch](deep-dives/pytorch.md) —
native_functions.yaml + derivatives.yaml generate the bindings,
autograd kernels, backward nodes, and dispatch registrations for
2,000+ operators from one schema pair;
[Servo](deep-dives/servo.md) — 576 WebIDL files are code-generated
into Rust DOM bindings and JS glue, so the web API surface cannot
drift from its implementations;
[Chromium](deep-dives/chromium.md) — ~1,900
.mojom IDL files compile into typed, versioned IPC bindings for
every process boundary, so validation and version skew are build
artifacts, not review diligence.

**Why it recurs:** one source of truth removes drift between
implementation, documentation, and tooling — the places large systems
rot first.

**Reach for it when:** the surface is large and regular. For small
surfaces it is ceremony; past a few dozen operations it is survival.

## 13. Dumb core, smart edges

**Shape:** the server/daemon stays a simple mechanism (a hash-map
daemon, an append-only log) and pushes sharding, routing, failover,
and retry into client libraries that every ecosystem implements
independently.

**Seen in:** [Memcached](deep-dives/memcached.md) — zero cluster
code in the server; consistent hashing (Ketama) and failover live in
clients, so the server is just a slab-allocated hash map;
[Kafka](deep-dives/kafka.md) — the broker is a dumb partitioned log;
producers and consumer groups own routing, batching, and rebalancing;
[Redis](deep-dives/redis.md) — the cluster era kept the same split,
with MOVED/ASK redirects resolved client-side.

**Why it recurs:** a dumb core is trivially fast, auditable, and
never needs a consensus protocol — provided the data can be rebuilt
or reread from somewhere else (a cache's source DB, a log's
retention).

**Reach for it when:** the system's data is derivable and
edge-intelligence is deployable (fat clients everywhere). The cost is
ecosystem-wide: behavior becomes client-library version skew, and
operations that need a global view (rebalancing without client
updates, multi-key transactions) become impossible or bolted on
later — which is exactly the cliff both Memcached and early Kafka
hit, and what ZooKeeper/etcd exist to catch on the coordination side.

---

## How to use this index while learning

1. After finishing any deep-dive, return here and find the patterns it
   instantiated — the recognition is the lesson compounding.
2. When designing your own system, scan the "reach for it when" lines:
   most architecture mistakes visible in review are a pattern applied
   where its "when" doesn't hold (MVCC without GC, event loop with
   CPU-heavy handlers, CAS without a retention story).
3. When two patterns conflict (amortization vs responsiveness,
   immutability vs latency), the deep-dives' trade-off sections show
   real systems pricing the conflict — that pricing, not the choice,
   is the transferable skill.
