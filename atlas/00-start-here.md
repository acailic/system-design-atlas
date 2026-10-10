# Start here — guided paths

Three honest starting points depending on where you are. Each is a
self-contained path with a clear finish line.

## If you're new to systems programming

**Goal:** read a complete, real system end-to-end, learn the shape of a
C codebase, and see one OS design in full.

**Path:** xv6 → Lua → SQLite

1. **[xv6-riscv](https://github.com/mit-pdos/xv6-riscv)** (~10k lines of C)
   — a complete Unix-like OS that fits in your head. Read alongside the free
   [xv6 book](https://pdos.csail.mit.edu/6.828/2024/xv6/book-riscv-rev4.pdf).
   Finish when you can explain how a `fork()` call works, file-descriptor
   table to page tables.
2. **[Lua](https://github.com/lua/lua)** (~30k lines) — a small, elegant
   interpreter. See [`compilers-and-interpreters.md`](compilers-and-interpreters.md)
   and [`languages-and-runtimes.md`](languages-and-runtimes.md) for the path.
3. **[SQLite](https://github.com/sqlite/sqlite)** — the deepest read on this
   ladder: one file, absurdly well-commented, a production database. See
   [`storage-and-databases.md`](storage-and-databases.md).

**Finish line:** you can modify each project in a small way (add a syscall,
add a Lua string function, add a SQL pragma) and explain the resulting
behavior.

## If you're a working backend / infra engineer

**Goal:** stop treating the systems under you as black boxes; build the
judgment to design services yourself.

**Path:** Redis → nginx → Raft/etcd → PostgreSQL

1. **[Redis](https://github.com/redis/redis)** — you probably use it; now
   learn why a single-threaded server handles 100k ops/sec. Path in
   [`storage-and-databases.md`](storage-and-databases.md).
2. **[nginx](https://github.com/nginx/nginx)** — the event-driven worker
   model that underlies half the web. Path in
   [`networking-and-servers.md`](networking-and-servers.md).
3. **[etcd + Raft](https://github.com/etcd-io/raft)** — consensus without
   hand-waving; the [Raft paper](https://raft.github.io/raft.pdf) plus the
   Go implementation. Path in [`distributed-systems.md`](distributed-systems.md).
4. **[PostgreSQL](https://github.com/postgres/postgres)** — MVCC, WAL, the
   planner. Path in [`storage-and-databases.md`](storage-and-databases.md).

**Finish line:** for each project, you can answer "what happens on a write,
physically, and what does it cost?"

## If you're preparing to design systems (interviews → judgment)

**Goal:** go beyond memorized answers. For every classic system-design
answer, read the code that implements it.

| Interview answer | Code that makes it real |
|---|---|
| "Add a cache" | Redis eviction (`evict.c`), nginx `proxy_cache` |
| "Use a queue" | NATS subject matching (`sublist.go`) |
| "Shard the data" | TiKV region split |
| "Use consensus" | hashicorp/raft, etcd |
| "Horizontal scale behind LB" | HAProxy schedulers, nginx workers |
| "Make it idempotent" | Prometheus TSDB replay, WAL redo |
| "Rate limit / backpressure" | Envoy overload manager |
| "Eventual consistency" | Redis replication `replication.c` |

Pair the table above with
[`design-patterns.md`](design-patterns.md), which extracts the cross-cutting
lessons.

## The 30-minute daily loop

1. (5 min) Review yesterday's trace — rebuild the mental model.
2. (20 min) Push the request one hop deeper, writing your map as you go.
3. (5 min) Write down what surprised you.

Surprise is the signal of learning. If nothing surprised you in a session,
you were reading comments, not code.

## Getting unstuck

- Lost in a forest of helpers? Go up one level: find the *caller*, not the callee.
- Can't find where work actually starts? Grep for the dispatch table, main loop, or event-loop registration.
- Overwhelmed by scale? Switch from "understand the system" to "understand one function completely." Rebuild confidence, then zoom out.

Proceed to any domain file. Recommended order for a full curriculum:
storage → networking → distributed systems → languages → OS → the rest.
