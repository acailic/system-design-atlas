# Cross-cutting design lessons

The patterns that recur across every domain in this atlas. When you see
one again in a new codebase, you already know the trade-off being made.
Each lesson ends with "Look at" pointers into the atlas projects.

## 1. Find the loop

Every large program is a loop plus dispatch: CPython's `ceval`, Redis's
`aeMain`, nginx's event loop, the kernel's scheduler, Prometheus's scrape
cycle. Find the loop and you've found the spine — everything else hangs off
it.

**Look at:** Redis `ae.c`; nginx `ngx_event.c`; Go `runtime/proc.go` `schedule()`.

## 2. Data structures are the architecture

The shape of the core types dictates what's easy and what's expensive.
A dict in Redis, `PyObject` in CPython, B-tree pages in SQLite, postings
lists in search: understand the structure and the algorithms fall out.

**Look at:** `redis/src/dict.c`; `sqlite` B-tree; `Objects/object.c`.

## 3. Writes are expensive; reads are cheap to scale

The write path is where engineering hides — WAL, fsync, locking, partial
failure, compaction. The read path is mostly navigation. That asymmetry is
the root of most scaling designs (replicate reads, serialize writes).

**Look at:** SQLite pager commit; PostgreSQL WAL (`xlog.c`); RocksDB flush.

## 4. Write-ahead logging: journal before you act

Record intent before mutating state so crashes can replay. Databases, filesystems, and message brokers all converged on the same answer.

**Look at:** SQLite WAL mode; PostgreSQL `xlog.c`; LMDB as the deliberate counterexample (COW instead).

## 5. LSM-tree vs B-tree: the write-vs-read trade

LSM-trees (RocksDB) batch writes sequentially, pay on reads (compaction,
Bloom filters). B-trees (SQLite, LMDB) update in place, pay on writes.
Most storage decisions descend from this fork.

**Look at:** RocksDB `db/compaction/` vs `sqlite3BtreeInsert`.

## 6. MVCC: keep versions instead of locking

PostgreSQL stores row versions and each transaction sees a consistent
snapshot — readers never block writers. etcd's watchable store applies the
same idea to a coordination system.

**Look at:** PostgreSQL visibility rules; etcd MVCC store.

## 7. Event loops over threads (when I/O-bound)

One thread multiplexing thousands of sockets beats one thread per socket
— until CPU-bound work or blocking calls break the loop. Redis and nginx
embody the pure form; Go's netpoller moves it into the runtime.

**Look at:** `redis/src/ae.c`; nginx worker model; `runtime/netpoll.go`.

## 8. The scheduler is the policy

Go's M:N scheduler, the kernel's CFS/EEVDF, nginx worker assignment:
whenever a resource is shared, some policy chooses who runs next. Scheduling
decisions are policy decisions made code.

**Look at:** `runtime/proc.go`; Linux `kernel/sched/`.

## 9. Consensus: replicate a log, not state

Raft and ZAB both agree on an ordered log, then let deterministic replay
produce consistent state on all replicas. The log is the unit of agreement.

**Look at:** hashicorp/raft `replication.go`; the Raft paper.

## 10. Declarative state + reconciliation loops

Kubernetes' entire model: users declare desired state; controllers
continuously reconcile reality toward it. The same pattern as Delta Blueprints.

**Look at:** client-go workqueue/informer; sample-controller.

## 11. Filter chains / middleware: compose behavior in a pipeline

Envoy's L4/L7 filter chains, nginx's phase engine, CPython's C protocol
layers: intercept a request at seams, keep each concern small and
independent.

**Look at:** Envoy `source/common/network/`; nginx phase engine.

## 12. Capability-oriented design: least privilege by construction

seL4's capabilities — pass a capability (a reference *with* permissions) instead of ambient authority.

**Look at:** seL4 `cnode.c`.

## 13. Content addressing: name things by hash

Git's object store, content-addressable stores generally — immutable, deduplicable, verifiable.

**Look at:** git `object.c`; SQLite's similar trick for pages.

## 14. Backpressure: apply the brake early

Slow consumers and bounded queues must signal producers (NATS
slow-consumer drops, Envoy overload manager). Unbounded buffers don't
degrade gracefully; they just fail later and worse.

**Look at:** NATS `subs.go` slow-consumer logic.

## 15. Idempotency and exactly-once is a lie

Distributed systems retry; retries re-deliver. Robust designs make
operations idempotent (or use dedup keys). "Exactly-once" is a marketing
term; at-least-once + dedup is the implementable reality.

**Look at:** Prometheus remote-write retry; Raft log dedup.

## 16. Layering with strict dependencies

Classic layer diagrams (OSI, POSIX storage stack) — the design rule is not "have layers" but "have a strict dependency order so you can understand layers in isolation."

**Look at:** SQLite's VFS abstraction; nginx core/event/http separation.

## 17. Single-writer simplicity

Redis: one thread processes commands, making reasoning trivial and
eliminating locks; concurrency lives at the I/O layer. A reminder that
simpler architectures can outperform complex ones until a specific wall is hit.

**Look at:** Redis `processCommand` path.

## 18. Protocol design as interface design

curl's API stability, SQLite's ABI discipline, Postgres' wire protocol: the
protocol *is* the public contract — changes ripple for decades. Design
extensibility (versioning, optional fields) from day one.

**Look at:** curl `include/curl/curl.h`; Postgres protocol v3 docs.

## 19. The config system is a design surface

nginx directives, HAProxy ACLs, Kubernetes YAML, Caddy modules: how
users express intent is part of the architecture, not an afterthought.

**Look at:** nginx config parser; Caddy module system.

## 20. Kill the feature you don't measure

Every project here is opinionated about what it *doesn't* do (SQLite has
no users/permissions by design; NATS doesn't persist by default).
Constraints are what make these systems excellent at their job.
