# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.

## Project: system-design-atlas

- Markdown-first curated atlas of open-source design deep-dives. No build step, no UI. English content.
- Source of truth for entries: `catalog.yaml` (schema documented at its top). Deep-dives live in `deep-dives/<id>.md` following `DEEP-DIVE-TEMPLATE.md`; the template's citation rules (pin commit, cite only what you opened) are the quality bar — see `CONTRIBUTING.md` for the checklist.
- Analyzed repos are shallow-cloned into `clones/` (gitignored); never vendor upstream code. Keep snippet policy from `LICENSES.md`.
- When adding a deep-dive: update `status: deep-dived` in catalog.yaml and the coverage list in README.md in the same change.
- Catalog selection weighs both popularity/ubiquity and design depth; heavyweight tools' `why:` paragraphs must tie popularity to the design decision that made them win (captain's standing emphasis).

## Deep-dive process addenda (learned during the 13-dive expansion)

- When adding a deep-dive, also update: `status:` in catalog.yaml, the coverage list in README.md, and (if the codebase instantiates a recurring lesson) the "Seen in" lists in PATTERNS.md — see CONTRIBUTING.md checklist.
- Upstream refactors happen: redis/sqlite/git/kafka/etcd have all recently moved core code (git's odb/ layer, kafka's log engine to storage module Java, etcd's raft extracted to etcd-io/raft, VS Code ext-host paths). Always grep for the function, never trust memory of layout.
