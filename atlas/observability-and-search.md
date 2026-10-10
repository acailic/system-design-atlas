# Observability and search

Systems whose job is to ask questions about other systems — time-series
storage, metrics pipelines, and search indexes. Teaches ingestion pipelines,
query languages, and index design.

---

### Prometheus (Go, ~250k lines) — difficulty ★★★

<https://github.com/prometheus/prometheus> · keywords: pull-based metrics, TSDB, PromQL, service discovery

**Why it's here.** A complete monitoring system with an exemplary three-part
architecture: scrape loop → TSDB → query engine. The TSDB (head block,
WAL, out-of-order handling) is a serious storage engine that happens to be readable.

**Reading path.**
1. `scrape/manager.go` + `discovery/` — how targets are found and scraped.
2. `tsdb/head.go` — ingested samples, WAL append; `tsdb/db.go` blocks.
3. `promql/engine.go` — the query engine and its evaluation model.
4. `web/api/v1` — where queries enter.

**Exercise.** Follow one sample from an HTTP `/metrics` scrape to disk
(WAL → head chunk) and name each structure it lands in. Then trace one
`rate()` query's evaluation plan.

---

### Meilisearch (Rust, ~150k lines) — difficulty ★★★

<https://github.com/meilisearch/meilisearch> · keywords: search engine, inverted index, typo tolerance

**Why it's here.** A modern, small search engine (compared to Lucene-scale
systems) — indexing pipeline, query planner, ranking rules — in Rust with
clear module boundaries. The `milli` engine crate is the heart.

**Reading path.** Start at `crates/meilisearch/src/routes/` for the query path;
then `crates/milli/src/index/` for indexing; read the
[design docs](https://github.com/meilisearch/product/).

**Exercise.** Index a small document set, issue a query with a deliberate
typo, and find the fuzzy-matching code path it exercised.

---

## Domain exercises

- Write a tiny pull-based scraper: fetch a metrics page, parse, store in an in-memory TSDB, answer `avg over time` queries.
- Implement a mini inverted index: tokenize → postings lists → boolean AND/OR query evaluation.

## Companion materials

- [Prometheus docs on storage](https://prometheus.io/docs/prometheus/latest/storage/).
- *Introduction to Information Retrieval* (Manning et al., free online) — theory behind search.

## Verified paths

Upstream trees checked 2026-10-10 (shallow clones): prometheus@2213e3c, meilisearch@9d3365c.
