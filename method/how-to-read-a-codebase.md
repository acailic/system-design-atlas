# How to read a codebase

Reading a large codebase is its own skill. These are the methods that work
consistently; the order matters less than using at least three of them at once.

## The core method: trace one request

Pick one concrete, meaningful operation and follow it from entry to exit:

- Redis: `SET foo bar` → client socket → parse → dict write → reply.
- PostgreSQL: `SELECT 1` → parser → planner → executor → result.
- Go: `ch <- 1` → channel send → scheduler → receiver wakeup.

While tracing, you force the codebase to tell you its architecture: what it
checks first, what it locks, what it defers. One traced request beats a
month of passive browsing.

**Technique:** rename variables in your head or on paper to describe what
each *is* rather than what it *is called*. Keep a running list of the
question each function answers.

## 1. Run it before you read it

A codebase you can run is a codebase you can experiment on:

1. Build the project.
2. Use the finished product once (start the server, make it serve one request).
3. Attach a debugger, set a breakpoint on the operation you traced, and
   inspect the real call stack. IDEs show you the actual depth — read the
   stack top-down, then read each function.

## 2. Read the data structures first

> "Show me your tables and I can guess your algorithms" — classic systems wisdom.

Before any control flow, learn the shape of the core types. Redis is a
hash-table wrapper plus a struct of structs. CPython's `PyObject` explains
half the language's semantics. SQL tables in SQLite's B-tree pages reveal the
whole storage story. Data structures are architecture frozen in place.

## 3. Read the interfaces, not the implementations

Giant projects survive because they are layered behind small APIs. Skim the
module boundaries: `include/` headers, package `__init__.py`, `go` package
exports, Rust `pub` surfaces. Build the map of **who talks to whom** — that
is the architecture. Implementation files fill in the map later.

## 4. Read the tests as executable documentation

Good tests encode intent. A unit test for a subsystem show what inputs and
outputs exist and what invariants are guarded. Start from a small unit test,
then follow the function under test.

## 5. Follow a write path and a read path separately

In storage, networking, and OS code, the write path is where the hard
engineering hides (WALs, fsyncs, page locks, partial failures) while the read
path reveals the data model (B-tree descents, index scans, block caches).
Read each path separately so neither drowns the other.

## 6. Read the git history

`git log --follow <file>` and old PRs show *why* the code is shaped that
way. Fix commits explain the constraint, not just the bug. Learning the
reasons is what makes design judgment transferable.

## 7. Build a written map

Keep a `notes.md` in the cloned repo. For every traced request write:
entry → step → step → exit. When lost, reread your map: you are usually one
level deeper than the question you're actually asking.

## 8. Identify the dispatch points

Almost every large program is a loop plus dispatch: CPython's `ceval` giant
switch, Redis's `processCommand` looking up a command table, nginx's phase
engine, kernel syscall entry. Find the dispatch point and you've found the
spine of the codebase — every feature hangs off it.

## 9. Read the design docs first (if they exist)

PostgreSQL internals docs, SQLite's architecture guide, Envoy's overview,
Raft paper → etcd's raft. Read the doc, form a mental model, then read code
to verify or correct it. The doc gives you the vocabulary to grep for.

## 10. Read sibling implementations

Read the same concept in two codebases. One implementation makes a choice
look like fate; two make it look like a decision. Compare how nginx and
Envoy both multiplex connections, how Redis single-threaded and Go M:N
scheduler both resolve the same C10K problem differently.

## 11. Short reading sessions

Attention and depth matter more than hours logged. 90 minutes of focused
tracing beats a whole day of open-editor skimming. Reread what you read
yesterday before pushing forward: consolidation is the point.

## Common traps

- **Reading breadth-first.** A directory tree is not a curriculum. Trace a
  request; don't inventory folders.
- **Reading only comments.** Comments can lie; the code can't. Verify every
  important comment claim against the code.
- **Skipping what you don't understand.** Mark it, name what you don't
  understand, and keep tracing — often the missing context arrives in the
  next function, or the one after.
- **Trying to read everything.** Nobody reads the whole Linux kernel. Learn
  the subsystem that answers your question, thoroughly.
- **Passive reading.** You cannot learn to think in design without writing.
  Every traced request should end with at least one small change that you
  make and rebuild.

## Pace yourself

A new ~100k-line codebase takes several weeks of honest effort before
orientation clicks. That's normal. The second codebase in a domain takes half
that; the fifth takes days, because the *patterns* recur. Those recurring
patterns are collected in
[`../atlas/design-patterns.md`](../atlas/design-patterns.md).
