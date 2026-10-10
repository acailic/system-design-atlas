# Distributed systems

Consensus, replication, and message-passing. This domain has the strongest
theory-to-code mapping in the atlas: read the paper, then read the
implementation that runs a shocking amount of production infrastructure.

---

### hashicorp/raft (Go, ~5k lines core) — difficulty ★★★

<https://github.com/hashicorp/raft> · 9k★ (2026-10) · keywords: Raft, leader election, log replication

**Why it's here.** The single cleanest production Raft implementation. Small
enough to read *all of*, complete enough to run real state machines. The
best theory-to-code bridge in distributed systems.

**Reading path.**
1. The [Raft paper](https://raft.github.io/raft.pdf) first — sections 3–5.
2. `raft.go` — the core type and `runFollower/runCandidate/runLeader` loops.
3. `replication.go` — AppendEntries flow to each follower.
4. `log.go` — the log and stability semantics.
5. `api.go` — Apply/Commit pipeline, the state machine interface.

**Exercise.** Enable the [trace logger](https://pkg.go.dev/github.com/hashicorp/raft#Config) and run the example; capture one election and one log
replication in the trace output and annotate each line with the paper's
figure it corresponds to (Fig. 2 terms).

---

### etcd (Go, ~200k lines) — difficulty ★★★★

<https://github.com/etcd-io/etcd> · 52k★ (2026-10) · keywords: consensus in production, watch, MVCC store, leases

**Why it's here.** Raft from the paper, wrapped in everything a production
coordination system actually needs: an MVCC watchable store, leases, and a
gRPC API. Kubernetes' source of truth.

**Reading path.**
1. (Note: the raft library itself lives in
   [etcd-io/raft](https://github.com/etcd-io/raft).)
2. `server/etcdserver/` — how commands go through Raft and are applied.
3. The MVCC store: how watchers see consistent historical states.
4. The design doc [learning-etcd](https://github.com/etcd-io/etcd/tree/main/Documentation).

**Exercise.** List the steps between a `PUT /v3/kv/put` HTTP request and the
value being visible to a `Watch` client, noting which step is the Raft commit.

---

### Apache ZooKeeper (Java, ~150k lines) — difficulty ★★★★

<https://github.com/apache/zookeeper> · 13k★ (2026-10) · keywords: ZAB, watches, linearizable coordination, quorum

**Why it's here.** The classic coordination kernel — locks, leader election,
config distribution. Its ZAB protocol predates Raft and solves the same
problem differently; watching the design differences is the lesson.

**Reading path.** `zookeeper-server/src/main/java/org/apache/zookeeper/`
— `server/quorum/` (the ZAB state machine, Leader/Follower/Zab.java),
`server/DataTree.java` (the in-memory data model), client watch semantics.

**Exercise.** Use four-letter commands (`stat`, `srvr`, `mntr`) on a local
ensemble to see ZAB state per server; then explain a session expiry from
the client's point of view from the code.

---

### TiKV (Rust, ~400k lines) — difficulty ★★★★★

<https://github.com/tikv/tikv> · 17k★ (2026-10) · keywords: distributed transactions, Raft groups, region scheduling

**Why it's here.** The reference distributed KV built on RocksDB + Raft +
a full transaction layer. Read after etcd: here Raft is per-*region*, and
you see how sharding, placement (PD), and consensus compose.

**Reading path.** `components/raftstore/` — one region's state machine.
Then transactions: `Percolator` model in `src/storage/txn`.

**Exercise.** Follow one prewrite/commit pair through the code and name
every cross-region RPC.

---

### NATS Server (Go, ~20k lines) — difficulty ★★

<https://github.com/nats-io/nats-server> · 21k★ (2026-10) · keywords: pub/sub, subject trees, backpressure

**Why it's here.** A fast, small, famously legible message broker. The best
starting point for "how does a broker work" before Kafka-scale complexity.

**Reading path.**
1. `server.go` — `Server`, client connection lifecycle.
2. `sublist.go` — the subject-matching trie (`*` / `>` wildcards).
3. `subs.go` — subscription types and slow-consumer backpressure.
4. `client.go` — parse loop and msg routing.

**Exercise.** Add a new special subject prefix (e.g. `$FOO.`) that logs to
stdout when subscribed; rebuild, and verify via the Go client. Teaches the
broker's routing spine.

---

## Domain exercises

- Build a toy Raft: election timer, RequestVote, AppendEntries, a map state machine. Then break it with network partitions and logs.
- Compare ZAB and Raft side by side: write the terms side by side, and one paragraph on what each protocol chose differently for leader recovery.

## Companion papers

- [Raft](https://raft.github.io/raft.pdf) — the entry point.
- [Paxos Made Simple](https://lamport.azurewebsites.net/pubs/paxos-simple.pdf) — the ancestor.
- [ZooKeeper: Wait-free coordination](https://www.usenix.org/legacy/event/atc10/tech/full_papers/Hunt.pdf)
- [Kafka paper](https://notes.stephenholiday.com/Kafka.pdf) — log compaction, consumer groups, ISR.
- [Jepsen analyses](https://jepsen.io/analyses) — how real systems fail under partitions; the best design-judgment training available.

## Verified paths

Upstream trees checked 2026-10-10 (shallow clones): hashicorp/raft@871f108, etcd-io/raft@638f427, etcd@f061acd, zookeeper@48f7cb0, tikv@5f7037a, nats-server@64dda80.
