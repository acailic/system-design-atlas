# Big data, analytics, and search engines

Storage engines at the scale where one node stops mattering: sharded
search, columnar OLAP, wide-column stores, and document databases. The
throughput designs differ wildly from SQLite/PostgreSQL — that contrast is
the lesson.

---

### Elasticsearch (Java, ~1M lines) — difficulty ★★★★★

<https://github.com/elastic/elasticsearch> · 78k★ (2026-10) · keywords: inverted index, segments, shards, distributed queries

**Why it's here.** Search at production scale: Lucene segments merged in
the background, indices sharded and replicated, and a query coordinated
across nodes. Read the docs + seams, not the whole tree.

**Reading path.**
1. [Lucene](https://lucene.apache.org/core/) first: segments, posting lists, doc values.
2. `server/` — REST layer → `IndicesService` → Lucene interaction.
3. Shard allocation & routing: `gateway` and `cluster/routing/`.
4. Query coordination: `search/` coordinator path (fan-out, gather, early termination).

**Exercise.** Index 100 docs, run `GET /_search?q=foo`, and note from the
response which shards answered; then find the coordinator code that fanned out.

---

### ClickHouse (C++, ~1M lines) — difficulty ★★★★

<https://github.com/ClickHouse/ClickHouse> · 50k★ (2026-10) · keywords: columnar, MergeTree, vectorization, sparse index

**Why it's here.** The fastest open-source OLAP engine. Its MergeTree table
engine (immutable parts merged in the background, sparse primary index,
column-by-column storage) is the cleanest industrial lesson in "design for
scans, not lookups."

**Reading path.**
1. Docs: [MergeTree design](https://clickhouse.com/docs/en/engines/table-engines/mergetree-family/mergetree) (the best system design doc in this atlas).
2. `src/Storages/MergeTree/` — parts lifecycle, merges.
3. Execution: `src/Processors/` — streaming vectorized pipeline.
4. Sparse index & skipping: `MergeTreeData.cpp`.

**Exercise.** Insert 1M rows in batches; `OPTIMIZE TABLE ... FINAL` and
explain what merged from the code you read.

---

### Apache Cassandra (Java, ~400k lines) — difficulty ★★★★

<https://github.com/apache/cassandra> · 10k★ (2026-10) · keywords: LSM storage, consistent hashing, gossip, tunable consistency

**Why it's here.** The opposite design point from PostgreSQL: availability
first, no single coordinator, every node equal. Consistent hashing with
virtual nodes, gossip for membership, LSM storage, and per-query consistency
levels (`ONE` to `QUORUM` `LOCAL_QUORUM`).

**Reading path.**
1. [Architecture docs](https://cassandra.apache.org/doc/latest/cassandra/architecture/overview.html).
2. `src/java/org/apache/cassandra/locator/` — token ring and replication strategies.
3. `gms/` — gossip protocol.
4. Write path: commit log + memtable; read path with read-repair.

**Exercise.** Write with consistency ONE, read with QUORUM; then locate the
code that decides how many replicas must acknowledge each.

---

### MongoDB (C++, ~500k lines) — difficulty ★★★

<https://github.com/mongodb/mongo> · 29k★ (2026-10) · keywords: document model, oplog, replica sets, sharding

**Why it's here.** The document store everyone has met; reading it explains
what's under the API — a binary (BSON) storage engine, replica sets built
on an oplog, and range-based sharding with config servers.

**Reading path.** `src/mongo/db/` — write path and journal; replication in
`src/mongo/db/repl/` (oplog, primary election); sharding in `s/` and `sharding/`.

**Exercise.** Insert in a replica set; read the oplog (`local.oplog.rs`);
then map an entry to the code that wrote it.

---

### Meilisearch (Rust, ~150k lines) — difficulty ★★

<https://github.com/meilisearch/meilisearch> · 60k★ (2026-10) · keywords: inverted index, typo tolerance

**Why it's here.** The small counterpoint to Elasticsearch — read it *after*
understanding Lucene segments, and you'll see how much of "search" is
index structure + ranking rules. (Full entry in
[observability-and-search.md](observability-and-search.md).)

**Reading path.** Cross-reference entry: see [observability-and-search.md](observability-and-search.md) for routes → `milli` index internals.

**Exercise.** Index 1k docs, enable typo tolerance, and find where the query gets rewritten for typos in `milli`.

---

## Domain exercises

- Build a tiny columnar store: append-only column files + a min/max per block; answer `SELECT sum(col)` by scanning only matching blocks.
- Implement consistent hashing with virtual nodes; simulate node failure and observe key movement.

## Companion materials

- [Elasticsearch: The Definitive Guide](https://www.elastic.co/guide/en/elasticsearch/guide/current/index.html)
- ClickHouse MergeTree docs and "LSM vs columnar" comparisons.
- Cassandra SIGMOD paper, Dynamo (AP side).

## Verified paths

Upstream trees checked 2026-10-10 (shallow clones): elasticsearch@36a8b81, clickhouse@727bdd7, cassandra@0e2f6d3, mongodb@2f3d83b.
