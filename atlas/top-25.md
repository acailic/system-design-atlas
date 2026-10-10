# Top 25 — the most popular systems, ranked

The greatest hits of open source, ranked by GitHub stars (exact counts via
the GitHub API, 2026-10). Every row links to the atlas entry that explains
what the project teaches and where to start reading. Popularity is not the
lesson — it's an entry point: these run so much of the world that their
design decisions are worth your attention.

| # | Project | Stars | Domain | One-line design lesson | Entry |
|---|---------|-------|--------|----------------------|-------|
| 1 | [Linux](https://github.com/torvalds/linux) | 251k | OS | 40M lines, still layered: read subsystems, not the whole | [operating-systems](operating-systems.md) |
| 2 | [React](https://github.com/facebook/react) | 251k | Frontend | Reconciliation + scheduling as a systems problem | [frontend-systems](frontend-systems.md) |
| 3 | [VS Code](https://github.com/microsoft/vscode) | 194k | Dev tools | Process isolation between UI and extensions | [dev-tools](dev-tools-and-editors.md) |
| 4 | [Ollama](https://github.com/ollama/ollama) | 183k | AI infra | Product-wrapping a runtime: blobs, runners, REST | [ai-infra](ai-infra.md) |
| 5 | [Go](https://github.com/golang/go) | 139k | Languages | M:N scheduling and channels in a compact runtime | [languages](languages-and-runtimes.md) |
| 6 | [llama.cpp](https://github.com/ggml-org/llama.cpp) | 131k | AI infra | Quantized kernels; zero-dependency inference | [ai-infra](ai-infra.md) |
| 7 | [Kubernetes](https://github.com/kubernetes/kubernetes) | 128k | Orchestration | Declarative state + reconciliation loops | [containers](containers-and-orchestration.md) |
| 8 | [Node.js](https://github.com/nodejs/node) | 122k | Runtimes | One event loop, libuv, non-blocking everything | [languages](languages-and-runtimes.md) |
| 9 | [Neovim](https://github.com/neovim/neovim) | 103k | Editors | Event loop, UI-as-protocol, embedded scripting | [applications](applications.md) |
| 10 | [vLLM](https://github.com/vllm-project/vllm) | 93k | AI infra | KV cache as pages; continuous batching | [ai-infra](ai-infra.md) |
| 11 | [Svelte](https://github.com/sveltejs/svelte) | 88k | Frontend | Compiler-driven: delete the runtime | [frontend-systems](frontend-systems.md) |
| 12 | [fzf](https://github.com/junegunn/fzf) | 84k | CLI | A sharp pipe-friendly interface beats features | [dev-tools](dev-tools-and-editors.md) |
| 13 | [Elasticsearch](https://github.com/elastic/elasticsearch) | 78k | Search | Inverted indexes, segments, shard replication | [big-data-search](big-data-search.md) |
| 14 | [Caddy](https://github.com/caddyserver/caddy) | 78k | Servers | Config-as-modules; automatic TLS | [networking](networking-and-servers.md) |
| 15 | [CPython](https://github.com/python/cpython) | 78k | Runtimes | Bytecode VM, refcounting + GC, C API seams | [languages](languages-and-runtimes.md) |
| 16 | [Redis](https://github.com/redis/redis) | 77k | Storage | Data structures first; single-writer simplicity | [storage](storage-and-databases.md) |
| 17 | [Grafana](https://github.com/grafana/grafana) | 77k | Observability | Plugin architecture at product scale | [observability](observability-and-search.md) |
| 18 | [Ansible](https://github.com/ansible/ansible) | 71k | Automation | Agentless: push modules over SSH, idempotency | [infra-automation](infra-automation.md) |
| 19 | [ripgrep](https://github.com/BurntSushi/ripgrep) | 69k | CLI | Throughput engineering: parallelism, mmap, SIMD | [dev-tools](dev-tools-and-editors.md) |
| 20 | [Prometheus](https://github.com/prometheus/prometheus) | 66k | Observability | Pull metrics, TSDB, PromQL | [observability](observability-and-search.md) |
| 21 | [git](https://github.com/git/git) | 64k | Tools | Content-addressed store + refs | [applications](applications.md) |
| 22 | [Meilisearch](https://github.com/meilisearch/meilisearch) | 60k | Search | Simple search done rigorously | [observability](observability-and-search.md) |
| 23 | [Vue](https://github.com/vuejs/core) | 55k | Frontend | Reactivity as a dependency graph | [frontend-systems](frontend-systems.md) |
| 24 | [ClickHouse](https://github.com/ClickHouse/ClickHouse) | 50k | OLAP | Columnar + MergeTree = OLAP at scale | [big-data-search](big-data-search.md) |
| 25 | [Terraform](https://github.com/hashicorp/terraform) | 50k | Infra as code | Graph of resources; plan before apply | [infra-automation](infra-automation.md) |

Honorable mentions just under the cut: tmux (50k), Spark (44k), curl (43k),
DuckDB (42k), Docker Compose (38k), Kafka (34k), RocksDB/nginx (32k),
Envoy/MongoDB (29k), etcd (52k — biggest miss of the 25), PostgreSQL (22k —
stars understate its importance; read it anyway).

## Suggested pairings

Popular projects teach best when read against a smaller sibling that makes
the same design choice visible:

- **Kubernetes** ↔ **sample-controller** (the pattern in miniature)
- **Kafka** ↔ **NATS** (log vs. subject tree)
- **Elasticsearch** ↔ **Meilisearch** (segments vs. simple inverted index)
- **Docker** ↔ **runc** (the daemon vs. the primitive)
- **Spark** ↔ **Airflow** (dataflow engine vs. scheduler)
- **Ollama** ↔ **llama.cpp** (product wrapper vs. the engine it wraps)

Read the small one first; the giant becomes legible as "the same idea, plus
a decade of operational hardening."
