# Storage and databases

The richest domain for learning systems design: durability, concurrency,
crash recovery, and data-structure engineering all collide. Read order
suggested below goes small → large.

---

### SQLite (C, ~150k lines in one file) — difficulty ★★★

<https://github.com/sqlite/sqlite> · keywords: ACID, B-tree, WAL, pager, VDBE

**Why it's here.** The most widely deployed database on Earth is a single
C file with the best comments in the industry. It is possible to understand
*all* of it, and doing so teaches how a real database actually works.

**Reading path.**
1. Read the [architecture overview](https://www.sqlite.org/arch.html) — tokenizer → parser → code generator → VDBE → B-tree → pager → OS interface.
2. Open the amalgamation source; start at `sqlite3Prepare` and follow to `sqlite3VdbeExec` — the virtual machine that executes the compiled program.
3. Study the pager (`pager.c` / `sqlite3PagerCommit`): how pages are cached,
   journaled, and committed. This is where crash safety lives.
4. Trace `INSERT` through `sqlite3BtreeInsert` — how a B-tree splits.

**Exercise.** Use [EXPLAIN VDBE ADDOPTRACE](https://sqlite.org/opcode.html) to
dump the bytecode for `CREATE TABLE t(x); INSERT INTO t VALUES (1);` and map
each opcode to its handler in the VDBE switch.

**Companions.** [How SQLite Works](https://fly.io/blog/how-sqlite-works/);
*SQLite Database System: Design and Implementation* (Gaffney & Owens).

---

### Redis (C, ~140k lines) — difficulty ★★★

<https://github.com/redis/redis> · keywords: event loop, data structures, single-threaded, replication

**Why it's here.** A complete, self-contained networked data store famous
for speed. The clearest real-world lesson in "data structures first" design
and event-driven I/O.

**Reading path.**
1. `src/server.c` — `main()` → `initServer()`; then `aeMain()` in `src/ae.c`,
   the event loop (epoll backend in `ae_epoll.c`).
2. `src/networking.c` — `readQueryFromClient` and `processInputBuffer`:
   how bytes become commands.
3. `src/server.c` — `processCommand`: the command dispatch table and
   everything checked before execution (permissions, memory, persistence).
4. Data structures: `src/dict.c` (hash table), `src/t_string.c` (the `SET`
   command), `src/object.c` (the `redisObject`).
5. Durability: `src/rdb.c` and `src/aof.c`.
6. Replication: `src/replication.c`.

**Exercise.** Add a new command `APPEND2` (appends twice) — register it in
`server.h`'s command table, implement in `t_string.c`, write a test, run
with `./runtest`. This is the community's onboarding path for real
contributions.

**Companions.**
[Redis internals](https://github.com/huangz1990/redis-3.0-annotated) (an
annotated 3.0 fork); the official `topics/internals` docs.

---

### PostgreSQL (C, ~1M lines) — difficulty ★★★★

<https://github.com/postgres/postgres> · keywords: MVCC, WAL, planner, process model

**Why it's here.** The reference point for how serious relational databases
are engineered: multi-version concurrency, write-ahead logging, a cost-based
query planner, and a process-per-connection model.

**Reading path.**
1. The [internals docs](https://www.postgresql.org/docs/current/internals.html)
   first — never start blind here.
2. `src/backend/tcop/postgres.c` — `PostgresMain`, the per-connection main
   loop: read → parse → plan → execute.
3. Simple query path: `postgres.c` → `pquery.c` → `executor/execMain.c`.
4. MVCC: how a row version is laid out (`storage/page/` `ItemId`,
   `HeapTupleHeader`), visibility rules, and vacuum.
5. WAL: `access/transam/xlog.c` — every change before the data file.
6. Planner: `optimizer/plan/planagg.c` and the cost model in
   `optimizer/path/costsize.c`.

**Exercise.** Run `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM t WHERE id = 5;`
on a seeded table and match each plan node to the executor module that
produces it.

**Companions.** *The Internals of PostgreSQL* (interdb.jp) — chapter-by-chapter mapping to source.

---

### LMDB (C, ~10k lines) — difficulty ★★★

<https://github.com/LMDB/lmdb> (`libraries/liblmdb/mdb.c`) · keywords: B+tree, mmap, copy-on-write

**Why it's here.** A key-value store with an extreme design thesis: one
memory-mapped file, no WAL, full ACID via copy-on-write B+trees. The
sharpest small counterexample to "every database needs a write-ahead log."

**Reading path.** `mdb.c` — `mdb_txn_begin` → `mdb_cursor_put` (a B+tree
descent with page splits) → `mdb_txn_commit` (COW root update).

**Exercise.** Explain to yourself why LMDB never needs crash recovery
despite having no journal, and what it trades for that (write amplification).

**Companions.** LMDB author's
[WriteConf](https://www.symas.com/symas-post/lmdb-write-conf) posts.

---

### RocksDB (C++, ~500k lines) — difficulty ★★★★

<https://github.com/facebook/rocksdb> · keywords: LSM-tree, compaction, memtable, Bloom filters

**Why it's here.** The state of the art for LSM-tree storage engines —
embeddable, everything tunable, and the foundation under many databases
(TiKV, CockroachDB's Pebble heritage, MyRocks).

**Reading path.**
1. Read the [overview docs](https://github.com/facebook/rocksdb/wiki) — memtable / immutable memtables / SSTs / compaction.
2. `db/db_impl/db_impl.cc` — `WriteImpl`: the write path and WAL append.
3. `db/memtable.cc` — skiplist-backed memtable.
4. `db/compaction/` — how levels are merged.
5. `table/` — SST format, indexes, Bloom filters.

**Exercise.** Draw the journey of one key-value pair from `Put()` through
memtable → flush → compaction to level 2.

**Companions.** *RocksDB wiki* LevelCompaction; LSM-tree papers (Bigtable,
LevelDB's original design).

---

### DuckDB (C++, ~250k lines) — difficulty ★★★★

<https://github.com/duckdb/duckdb> · keywords: vectorized execution, columnar, OLAP

**Why it's here.** The analytical (columnar) counterpart to SQLite's OLTP —
shows how a completely different query model (vectorized batches, columnar
storage) is engineered in practice.

**Reading path.** Read the [architecture](https://duckdb.org/docs/dev/architecture/overview/devarchitectureoverview.html):
parser → binder → logical optimizer → physical planner → vectorized
execution. Trace a simple aggregate query from `src/execution/`.

**Exercise.** Use the `EXPLAIN ANALYZE` output to map plan nodes to the
executors you read.

---

## Domain exercises

- Implement a tiny [bitcask](https://riak.com/assets/bitcask-intro.pdf) log-structured KV store in any language: append-only log, in-memory keydir, compaction. Teaches WAL thinking from the inside.
- Benchmark `sync` vs `async` writes in your own toy store and explain the durability/performance trade.

## Companion papers

- [Bigtable](https://research.google/pubs/bigtable-a-distributed-storage-system-for-structured-data/) — SSTables/LSM lineage.
- [Amazon Dynamo](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) — consistent hashing, vector clocks, hinted handoff.
- [The Log: What every software engineer should know](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying) — why logs are everywhere.
