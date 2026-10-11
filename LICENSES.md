# Licensing

The atlas is documentation-first with a little tooling. Licensing is split
by artifact type:

| Artifact | License |
|---|---|
| Prose: `README.md`, `CURATION.md`, `DEEP-DIVE-TEMPLATE.md`, `CONTRIBUTING.md`, `LICENSES.md`, everything in `deep-dives/`, `catalog.yaml` | **CC-BY-4.0** (full text: [`LICENSE-CC-BY-4.0.txt`](LICENSE-CC-BY-4.0.txt)) |
| Tooling: any scripts, code, or configuration added to this repo now or later | **MIT** (full text: [`LICENSE`](LICENSE)) |
| Generated site: `docs/` — output of `site/` (regenerate with `npm run build`; never hand-edit) | **CC-BY-4.0** — inherits the prose it renders |

Rationale: CC-BY-4.0 lets anyone reuse and remix the educational prose with
attribution; MIT keeps any tooling maximally compatible with normal
development workflows. Files carrying their own license header override
this table.

## Code from analyzed projects

The atlas never vendors, mirrors, or redistributes upstream trees (see
CONTRIBUTING.md). Deep-dives quote from upstream code only as commentary:

- **Minimal quotation**: snippets are ≤ 10 lines, few per document, and
  always in service of an analytical point (the license analysis, not the
  code, is the product).
- **Attribution**: every snippet names the project, the file, the function,
  and the upstream license (SPDX id) in the accompanying text or the
  deep-dive header block, and the deep-dive pins the exact commit.
- **Compatibility**: analyzed projects' licenses at the time of writing:

  | Project | SPDX | Note |
  |---|---|---|
  | Redis | RSALv2 OR SSPL-1.0 OR AGPL-3.0 | source-available/AGPL triple license since Redis 8; keep quotes minimal & commentary-bound |
  | SQLite | public domain (blessing) | no restriction |
  | git | GPL-2.0 | keep quotes minimal & commentary-bound; do not copy functional blocks |
  | LevelDB | BSD-3-Clause | permissive; short attributed quotes fine |
  | nginx | BSD-2-Clause | permissive; short attributed quotes fine |
  | PostgreSQL | PostgreSQL | BSD-like; short attributed quotes fine |
  | Kafka | Apache-2.0 | permissive; short attributed quotes fine |
  | CPython | Python-2.0 | permissive; short attributed quotes fine |
  | Elasticsearch | SSPL-1.0 OR Elastic-License-2.0 | source-available; keep quotes minimal & commentary-bound |
  | Kubernetes | Apache-2.0 | permissive; short attributed quotes fine |
  | Moby | Apache-2.0 | permissive; short attributed quotes fine |
  | etcd | Apache-2.0 | permissive; short attributed quotes fine |
  | VS Code | MIT | permissive; repo code only — product binaries are Microsoft-licensed |
  | Memcached | BSD-3-Clause | permissive; short attributed quotes fine |
  | Apache httpd | Apache-2.0 | permissive; short attributed quotes fine |
  | Apache ZooKeeper | Apache-2.0 | permissive; short attributed quotes fine |
  | NATS | Apache-2.0 | permissive; short attributed quotes fine |
  | libuv | MIT | permissive; short attributed quotes fine |

- When in doubt, paraphrase in prose and cite `file:function` as a pointer
  instead of quoting. A pointer is always license-clean.
