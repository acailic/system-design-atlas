# System Design Atlas

Learn system design thinking by reading great open-source code. A curated
atlas of public open-source projects with reading paths, entry-point maps,
exercises, and the design lessons each codebase teaches.

## Why read source instead of blog posts

Interview prep material describes system design as answers to memorize:
"add a cache", "use a queue". Real code shows the *decisions behind the
answers* — what a cache actually invalidates, when a queue drops messages,
what a lock really costs. Reading the code that runs a database, a proxy, or
an operating system is the difference between reciting design patterns and
having design judgment.

This atlas is a curriculum, not a link dump. Every entry explains **why the
project teaches system design, exactly which files to read, in what order,
with what exercise to prove comprehension.**

## How to use this atlas

1. Pick a starting point from the ladders below (by level) or
   [`atlas/00-start-here.md`](atlas/00-start-here.md).
2. Read [`method/how-to-read-a-codebase.md`](method/how-to-read-a-codebase.md)
   once — it will save you dozens of hours.
3. Clone the target repo, open the first file in the reading path, and work
   the exercise at the end of each domain file.

The golden rule: **trace one request.** Pick one operation (an HTTP request,
a SQL query, a channel send) and follow it from entry to exit through the
code. One traced request teaches more than a month of passive browsing.

## The ladders

**Ladder A — read a whole system (small enough to finish):**

| # | Project | Language | Size (approx.) | Difficulty |
|---|---------|----------|------|------------|
| 1 | [xv6](https://github.com/mit-pdos/xv6-riscv) | C | ~10k lines | ★★ |
| 2 | [SQLite](https://github.com/sqlite/sqlite) | C | one file, ~150k | ★★★ |
| 3 | [Redis](https://github.com/redis/redis) | C | ~140k | ★★★ |
| 4 | [Lua](https://github.com/lua/lua) | C | ~30k | ★★ |
| 5 | [Git (core)](https://github.com/git/git) | C | big, modular | ★★★ |

**Ladder B — read one subsystem of a giant:**

| # | Project | Subsystem | Difficulty |
|---|---------|-----------|------------|
| 1 | [CPython](https://github.com/python/cpython) | the eval loop + object model | ★★★ |
| 2 | [Go](https://github.com/golang/go) | `src/runtime` — scheduler, channels, GC | ★★★★ |
| 3 | [PostgreSQL](https://github.com/postgres/postgres) | a query's path + WAL | ★★★★ |
| 4 | [nginx](https://github.com/nginx/nginx) | event loop + one HTTP phase | ★★★★ |
| 5 | [Linux](https://github.com/torvalds/linux) | one syscall end-to-end | ★★★★ |

**Ladder C — read the design docs + the seams (for very large systems):**

| # | Project | Read instead | Difficulty |
|---|---------|--------------|------------|
| 1 | [Envoy](https://github.com/envoyproxy/envoy) | filter-chain seams | ★★★★ |
| 2 | [Kubernetes](https://github.com/kubernetes/kubernetes) | client-go + sample-controller | ★★★★ |
| 3 | [etcd](https://github.com/etcd-io/etcd) | raft library first | ★★★★ |

## Atlas index

- [`atlas/00-start-here.md`](atlas/00-start-here.md) — guided paths by goal
- [`atlas/storage-and-databases.md`](atlas/storage-and-databases.md) — SQLite, Redis, PostgreSQL, LMDB, RocksDB, DuckDB
- [`atlas/distributed-systems.md`](atlas/distributed-systems.md) — Raft, etcd, ZooKeeper, TiKV, NATS
- [`atlas/networking-and-servers.md`](atlas/networking-and-servers.md) — nginx, HAProxy, Envoy, Caddy, curl
- [`atlas/languages-and-runtimes.md`](atlas/languages-and-runtimes.md) — CPython, Go, Lua, musl
- [`atlas/compilers-and-interpreters.md`](atlas/compilers-and-interpreters.md) — chibicc, Crafting Interpreters, QBE
- [`atlas/operating-systems.md`](atlas/operating-systems.md) — xv6, seL4, Redox, Linux
- [`atlas/containers-and-orchestration.md`](atlas/containers-and-orchestration.md) — runc, containerd, Kubernetes
- [`atlas/applications.md`](atlas/applications.md) — Neovim, git, tmux
- [`atlas/observability-and-search.md`](atlas/observability-and-search.md) — Prometheus, Meilisearch
- [`atlas/big-data-search.md`](atlas/big-data-search.md) — Elasticsearch, ClickHouse, Cassandra, MongoDB
- [`atlas/data-pipelines.md`](atlas/data-pipelines.md) — Kafka, Flink, Spark, Airflow, dbt
- [`atlas/infra-automation.md`](atlas/infra-automation.md) — Terraform, Ansible, Docker Compose
- [`atlas/dev-tools-and-editors.md`](atlas/dev-tools-and-editors.md) — VS Code, ripgrep, gh CLI, fzf, htop
- [`atlas/ai-infra.md`](atlas/ai-infra.md) — vLLM, llama.cpp, Ollama
- [`atlas/frontend-systems.md`](atlas/frontend-systems.md) — React, Vue, Svelte
- [`atlas/design-patterns.md`](atlas/design-patterns.md) — cross-cutting lessons from all of the above

## Curation principle

Not every famous project is here, and that is deliberate. Inclusion criteria:

1. **Source is the best teacher** — actively maintained, readable code or
   famously well-commented (SQLite's comments are legendary).
2. **Teaches a system, not just an implementation** — the design ideas
   transfer (event loops, WAL, consensus, MVCC, scheduling).
3. **A path exists for a learner** — real entry points, companion books or
   papers, exercises you can actually do.

Line counts and star counts are ballparks for orientation; repos evolve —
verify against upstream. Reading paths in the atlas files are checked
against real upstream trees (see the "Verified paths" footers; spot-checked
2026-10-10 via shallow clones).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — see [LICENSE](LICENSE).
