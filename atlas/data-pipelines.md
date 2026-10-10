# Data pipelines and stream processing

Systems that move and transform data continuously: logs, queues, batch and
stream engines, and workflow schedulers. The unifying design idea — a
*durable, ordered log* with consumers — repeats from Kafka to Flink to
Airflow.

---

### Apache Kafka (Scala/Java, ~400k lines) — difficulty ★★★★

<https://github.com/apache/kafka> · ~29k★ · keywords: partitioned log, consumer groups, ISR, zero-copy

**Why it's here.** The canonical distributed log and the backbone of event
streaming. Everything interesting about event-driven architecture is visible:
partitioning for parallelism, offsets as the consumer contract, replication
via in-sync replicas, and delivery semantics you must design for (at-least-
once vs. effectively-once via idempotent producers and transactions).

**Reading path.**
1. The [Kafka paper](https://notes.stephenholiday.com/Kafka.pdf) first — the design section still reads as current.
2. `core/.../server/KafkaApis.scala` — how a produce/fetch request is handled.
3. `core/.../log/LogSegment.scala` + `Log.scala` — append, index, retention, compaction.
4. Consumer group protocol: the group coordinator's rebalance path.
5. Controller failover in `controller/`.

**Exercise.** Run a local broker; produce with `acks=all` and
`enable.idempotence=true`; kill the consumer mid-batch and observe offset
re-delivery. Then match each behavior to the code you read.

---

### Apache Flink (Java, ~1M lines) — difficulty ★★★★

<https://github.com/apache/flink> · ~24k★ · keywords: watermarks, checkpoint barriers, exactly-once, state backends

**Why it's here.** The reference implementation of *stateful* stream
processing: event-time watermarks, asynchronous distributed snapshots via
barrier alignment, and state backends with incremental checkpoints. Where
Kafka is the transport, Flink is the computation.

**Reading path.**
1. The [dataflow paper](https://www.vldb.org/pvldb/vol8/p1804-carbone.pdf).
2. `flink-streaming-java/.../operators/AbstractStreamOperator.java` — checkpoint calls.
3. `flink-runtime/.../checkpoint/` — the two-phase commit sink pattern.
4. Watermark generation/propagation in `flink-streaming-java`.

**Exercise.** Trace one barrier through a two-operator pipeline and write
down exactly when each state snapshot is taken.

---

### Apache Spark (Scala, ~1M lines) — difficulty ★★★★

<https://github.com/apache/spark> · ~40k★ · keywords: RDD lineage, DAG scheduler, lazy evaluation, shuffle

**Why it's here.** The definitive batch analytics engine; its core idea —
resilient datasets carrying *lineage* so failures replay transforms rather
than replicate data — reshaped the whole data field.

**Reading path.**
1. The [RDD paper](https://www.usenix.org/system/files/conference/nsdi12/nsdi12-final138.pdf).
2. `core/src/main/scala/org/apache/spark/scheduler/DAGScheduler.scala` — how a job becomes stages split at shuffles.
3. `core/.../rdd/RDD.scala` — lineage as `dependencies`.
4. Shuffle write/read path in `core/.../shuffle/`.

**Exercise.** Submit a two-stage job with a join; read the event timeline
inherited from the Spark UI and map each stage boundary to the DAGScheduler split.

---

### Apache Airflow (Python, ~300k lines) — difficulty ★★★


<https://github.com/apache/airflow> · ~39k★ · keywords: DAG scheduler, backfills, executor model

**Why it's here.** Workflow orchestration with a design you'll recognize
from Kubernetes: declared DAGs, a scheduler loop reconciling queue →
executor, and pluggable executors. Readable Python; a good bridge from
application code into systems code.

**Reading path.**
1. `airflow/jobs/` — the scheduler loop and trigger rules.
2. `airflow/models/dag.py` + `dagrun` — scheduling intervals vs. data intervals.
3. `airflow/executors/` — local vs. Celery vs. Kubernetes executors.

**Exercise.** Write a DAG with a failed branch and a trigger rule
(`all_done` vs `all_success`); then find the code path that decided whether
the downstream task ran.

---

### dbt (Python, ~150k lines) — difficulty ★★

<https://github.com/dbt-labs/dbt-core> · ~10k★ · keywords: compile-to-SQL, Jinja templating, DAG

**Why it's here.** A different pipeline idea: instead of moving data, compile
and push computation into the database. Models form a DAG rendered from
Jinja templates into SQL — a small, legible compiler whose "target language"
is SQL.

**Exercise.** `dbt compile` on a 3-model DAG; read the generated SQL and
identify where templating ended and SQL began.

---

## Domain exercises

- Write a 200-line log broker: append-only partition files, a consumer that tracks offsets, and replay after restart.
- Implement a toy watermark: out-of-order events, a windowed count, and late-event policy.

## Companion papers

- [Kafka paper](https://notes.stephenholiday.com/Kafka.pdf) · [Flink](https://www.vldb.org/pvldb/vol8/p1804-carbone.pdf) · [RDD](https://www.usenix.org/system/files/conference/nsdi12/nsdi12-final138.pdf)
- [The Log](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying)
- Kappa architecture / Lambda architecture write-ups.
