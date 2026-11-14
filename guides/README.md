# Guides

The deep-dives go deep on one codebase each. These guides go **wide**:
where to start, which codebases teach each domain, and how to read a
large codebase without drowning. They also cover projects that don't
have a full deep-dive yet, such as xv6, React, vLLM and Ollama.

## Start with these

| Guide | Use it when |
|---|---|
| [Start here: guided paths](start-here.md) | You want a ready-made route: new to systems, working backend/infra engineer, preparing for design interviews, or building AI products |
| [How to read a codebase](how-to-read-a-codebase.md) | You've cloned something huge and don't know where to begin. Trace one request, and other methods that hold up |
| [Top 25 most popular systems](top-25.md) | You want the greatest hits of open source, ranked by stars, each with its one-line design lesson |
| [Cross-cutting design lessons](design-patterns.md) | You want the recurring patterns in one place (see also the evidence-backed [patterns index](../PATTERNS.md)) |

## Domain guides

| Domain | What it teaches |
|---|---|
| [Operating systems](operating-systems.md) | Isolation, scheduling, virtual memory, concurrency: the original curriculum |
| [Storage and databases](storage-and-databases.md) | Durability, crash recovery, concurrency control, data-structure engineering |
| [Distributed systems](distributed-systems.md) | Consensus, replication, message passing, with papers mapped to code |
| [Networking, servers and protocols](networking-and-servers.md) | Accepting millions of connections, multiplexing, TLS, load balancing |
| [Languages and runtimes](languages-and-runtimes.md) | Allocators, schedulers, GCs and FFI boundaries in one binary |
| [Compilers and interpreters](compilers-and-interpreters.md) | Lex, parse, IR and codegen as a data-transformation pipeline |
| [Containers and orchestration](containers-and-orchestration.md) | Linux primitives composed into containers, then the biggest control loop in the industry |
| [Data pipelines and stream processing](data-pipelines.md) | The durable ordered log, from Kafka to Flink to Airflow |
| [Big data, analytics and search](big-data-search.md) | Sharded search, columnar OLAP, wide-column and document stores |
| [Observability and search](observability-and-search.md) | Time-series storage, metrics pipelines, query languages, index design |
| [AI inference infrastructure](ai-infra.md) | KV caches, continuous batching, quantization |
| [Frontend systems](frontend-systems.md) | Reconciliation, scheduling, reactivity, compiler-driven UI |
| [Developer tools and editors](dev-tools-and-editors.md) | Process isolation, incremental computation, performance engineering |
| [Applications: editors and tools](applications.md) | Long-lived interactive programs with plugin systems and real-time constraints |
| [Infrastructure automation](infra-automation.md) | Declarative desired state for networks, VMs and cloud resources |

---

← Back to the [main README](../README.md) · [Browse the deep-dives](../deep-dives/) · [Read on the website](https://acailic.github.io/system-design-atlas/)
