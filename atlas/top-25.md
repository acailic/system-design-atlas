# Top 25 — the most popular systems, ranked

The greatest hits of open source, ranked roughly by GitHub stars (ballpark,
early 2026 — repos evolve). Every row links to the atlas entry that explains
what the project teaches and where to start reading. Popularity is not the
lesson — it's an entry point: these run so much of the world that their
design decisions are worth your attention.

| # | Project | ~Stars | Domain | One-line design lesson | Entry |
|---|---------|--------|--------|----------------------|-------|
| 1 | [Linux](https://github.com/torvalds/linux) | ~180k | OS | 40M lines, still layered: read subsystems, not the whole | [operating-systems](operating-systems.md) |
| 2 | [React](https://github.com/facebook/react) | ~230k | Frontend | Reconciliation + scheduling as a systems problem | [frontend-systems](frontend-systems.md) |
| 3 | [Kubernetes](https://github.com/kubernetes/kubernetes) | ~112k | Orchestration | Declarative state + reconciliation loops | [containers](containers-and-orchestration.md) |
| 4 | [VS Code](https://github.com/microsoft/vscode) | ~164k | Dev tools | Process isolation between UI and extensions | [dev-tools](dev-tools-and-editors.md) |
| 5 | [Node.js](https://github.com/nodejs/node) | ~110k | Runtimes | One event loop, libuv, non-blocking everything | [languages](languages-and-runtimes.md) |
| 6 | [Redis](https://github.com/redis/redis) | ~69k | Storage | Data structures first; single-writer simplicity | [storage](storage-and-databases.md) |
| 7 | [Elasticsearch](https://github.com/elastic/elasticsearch) | ~72k | Search | Inverted indexes, segments, shard replication | [big-data-search](big-data-search.md) |
| 8 | [Kafka](https://github.com/apache/kafka) | ~29k | Pipelines | The distributed log as the primitive | [data-pipelines](data-pipelines.md) |
| 9 | [PostgreSQL](https://github.com/postgres/postgres) | ~17k | Databases | MVCC + WAL, engineered for decades | [storage](storage-and-databases.md) |
| 10 | [Go](https://github.com/golang/go) | ~125k | Languages | M:N scheduling and channels in ~100k lines of runtime | [languages](languages-and-runtimes.md) |
| 11 | [Grafana](https://github.com/grafana/grafana) | ~66k | Observability | Plugin architecture at product scale | [observability](observability-and-search.md) |
| 12 | [Prometheus](https://github.com/prometheus/prometheus) | ~57k | Observability | Pull metrics, TSDB, PromQL | [observability](observability-and-search.md) |
| 13 | [Terraform](https://github.com/hashicorp/terraform) | ~45k | Infra as code | Graph of resources; plan before apply | [infra-automation](infra-automation.md) |
| 14 | [Ansible](https://github.com/ansible/ansible) | ~63k | Automation | Agentless: push modules over SSH, idempotency | [infra-automation](infra-automation.md) |
| 15 | [Spark](https://github.com/apache/spark) | ~40k | Data | RDD lineage → DAG scheduling | [data-pipelines](data-pipelines.md) |
| 16 | [ClickHouse](https://github.com/ClickHouse/ClickHouse) | ~38k | OLAP | Columnar + MergeTree = OLAP at scale | [big-data-search](big-data-search.md) |
| 17 | [Airflow](https://github.com/apache/airflow) | ~39k | Pipelines | DAGs as first-class schedulable objects | [data-pipelines](data-pipelines.md) |
| 18 | [Envoy](https://github.com/envoyproxy/envoy) | ~25k | Networking | Filter chains + dynamic config (xDS) | [networking](networking-and-servers.md) |
| 19 | [MongoDB](https://github.com/mongodb/mongo) | ~27k | Databases | Document store; oplog replication | [big-data-search](big-data-search.md) |
| 20 | [Cassandra](https://github.com/apache/cassandra) | ~9k | Databases | Consistent hashing + vnodes, gossip, tunable consistency | [big-data-search](big-data-search.md) |
| 21 | [Flink](https://github.com/apache/flink) | ~24k | Streaming | Checkpointing barriers, watermarks, exactly-once | [data-pipelines](data-pipelines.md) |
| 22 | [git](https://github.com/git/git) | ~54k | Tools | Content-addressed store + refs | [applications](applications.md) |
| 23 | [Neovim](https://github.com/neovim/neovim) | ~85k | Editors | Event loop, UI-as-protocol, embedded scripting | [applications](applications.md) |
| 24 | [Docker/runc](https://github.com/opencontainers/runc) | ~30k | Containers | Namespaces + cgroups + overlayfs = a container | [containers](containers-and-orchestration.md) |
| 25 | [Ollama](https://github.com/ollama/ollama) / [llama.cpp](https://github.com/ggml-org/llama.cpp) | ~110k/~80k | AI infra | KV caching, batching, quantization | [ai-infra](ai-infra.md) |

## Suggested pairings

Popular projects teach best when read against a smaller sibling that makes
the same design choice visible:

- **Kubernetes** ↔ **sample-controller** (the pattern in miniature)
- **Kafka** ↔ **NATS** (log vs. subject tree)
- **Elasticsearch** ↔ **Meilisearch** (segments vs. simple inverted index)
- **Docker** ↔ **runc** (the daemon vs. the primitive)
- **Spark** ↔ **Airflow** (dataflow engine vs. scheduler)

Read the small one first; the giant becomes legible as "the same idea, plus
a decade of operational hardening."
