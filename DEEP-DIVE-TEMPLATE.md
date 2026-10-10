# Deep-dive template

Copy this file to `deep-dives/<id>.md` and fill every section. A deep-dive
**teaches**, it does not describe: every claim must be verifiable by the
reader in a clone of the project at the pinned commit. If you cannot cite a
file/function for a claim, either the claim is wrong or you have not read
enough — fix that before shipping.

Rules for all deep-dives:

- **Pin the commit.** Shallow-clone, record `git rev-parse HEAD`, put it in
  the header. Cite landmarks as `path/to/file.c:function` (line numbers as
  `file.c:123` drift, but are allowed *in addition* to the function name).
- **Cite only what you opened.** Never invent landmarks. If the reading path
  says "notice X at function Y", you opened function Y.
- **Snippets:** ≤ 10 lines each, few of them, attributed, with the upstream
  license named. Paraphrase when prose works as well (see LICENSES.md).
- **Trade-offs need evidence:** each trade-off section must show where in
  the code the choice is *made* (a flag, a flush point, a lock, a copy).

---

```markdown
# <Project>: <one-line design headline>

> **Atlas id:** `<id>` · **Domains:** `<tag>, <tag>` ·
> **Upstream:** <repo-url> · **License:** <spdx> ·
> **Pinned commit:** `<full-sha>` (<yyyy-mm-dd>)

<One paragraph: what this system is, and the single design idea this
deep-dive will teach. The headline names the lesson, not the product.>

## 1. Architecture overview

- The layer map / process map of the system (ASCII diagram is ideal).
- One paragraph per layer or process: responsibility, boundaries, what it
  does NOT do.
- Where the "spine" is: the one path a request/operation/query walks
  end-to-end. Name the functions along the spine.

## 2. Core data structures — and why these

For each structure that carries the design (2–5 of them):

- **What:** the structure and its invariants.
- **Where:** `file.c:function` (or the header that defines it).
- **Why:** why THIS structure here — what does it buy, what was rejected?
  (e.g. skip list vs red-black tree; page-oriented B-tree vs row store;
  append-only log vs in-place update.)

## 3. Concurrency and failure model

- Processes/threads/event loop: what runs concurrently, what is serialized,
  and where the code draws the line (cite the loop, the fork, the lock).
- What happens when it crashes mid-operation? How does restart recovery
  work — which code performs it?
- Backpressure / overload behavior, if the system has one.

## 4. API and extension design

- The public surface: what the system exposes to its users, and the shape
  of that surface (commands, library calls, config).
- The seams: where the code intends extension (modules, VFS, drivers,
  hooks). How does a third party add behavior without forking?
- One honest note on what the API design gets wrong or has outgrown.

## 5. The defining trade-offs

2–3 trade-offs, each with code evidence. Use this shape:

### Trade-off N: <X> over <Y>
- **Tension:** the force that made the choice necessary.
- **Choice:** what was picked.
- **Evidence:** `file.c:function` — where the code pays for the choice.
- **Given up:** what the alternative would have bought.
- **Verdict:** why the trade is right *for this system's* workload — and
  when it would be wrong for yours.

## 6. Reading path

An ordered walk through the clone — the heart of the deep-dive. 6–12 stops,
each: `file:function` + what to notice there. Sequence must build
understanding (spine first, then structures, then failure paths). Example
shape:

1. `src/foo.c:main` — startup; note what is initialized before the loop.
2. `src/bar.c:bar_loop` — the spine; step through one request.
3. ...

End with: "you have now traced <the story> end-to-end."

## 7. What to steal

3–6 transferable design moves, each one sentence of lesson + one sentence of
where you saw it. Written for a reader designing their own system tomorrow.

## 8. Difficulty and prerequisites

- Difficulty: `gentle | moderate | demanding` and a realistic hour budget.
- Prerequisites: languages, algorithms, systems concepts needed (with a
  pointer for each if non-trivial).

## 9. Further reading

Upstream docs, the classic paper, talks — only sources that exist.
```
