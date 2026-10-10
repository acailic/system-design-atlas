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
stops being a technique and becomes the product.

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
expendable snapshotter over copy-on-write memory.

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
machines instead of threads. (The catalog's libuv/node entries
generalize it to any runtime.)

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
resync periods as a safety net under the event stream.

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
policies are a reconcile loop over exit states).

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
(epoll/kqueue/select behind one macro).

**Why it recurs:** portability is architectural, not a build flag; the
interface is where testing doubles (in-memory VFS, memdb) come from.

**Reach for it when:** the system must outlive your current platform
assumptions. The failure mode is a leaky abstraction — SQLite's VFS
survived because its contract stayed small and honest.

## 9. Versioned data for concurrent readers (MVCC)

**Shape:** writers create new versions; readers pick a snapshot;
"current" is a query, not a location.

**Seen in:** [PostgreSQL](deep-dives/postgresql.md) — xmin/xmax and
snapshots from the procarray; [Redis](deep-dives/redis.md) — internal
keys carry (key, sequence) pairs, snapshots pin sequence numbers;
[Kubernetes](deep-dives/kubernetes.md) — resourceVersion optimistic
concurrency over every object; [LevelDB](deep-dives/leveldb.md) —
compaction drops versions below the oldest live snapshot.

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
OCI-standardized boundaries.

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
interpreter and its metadata.

**Why it recurs:** one source of truth removes drift between
implementation, documentation, and tooling — the places large systems
rot first.

**Reach for it when:** the surface is large and regular. For small
surfaces it is ceremony; past a few dozen operations it is survival.

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
