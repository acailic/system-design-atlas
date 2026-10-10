# Developer tools — editors, CLIs, high-performance utilities

Tools developers touch daily, hiding real systems design: process isolation,
incremental computation, and performance engineering. These are smaller than
the giants and more directly imitable — you can build a mini version.

---

### Visual Studio Code (TypeScript, ~500k lines core) — difficulty ★★★★

<https://github.com/microsoft/vscode> · 194k★ (2026-10) · keywords: extension host, LSP, IPC, workbench layers

**Why it's here.** A masterclass in **process isolation for stability**:
the renderer runs separately from the extension host, so an extension crash
doesn't kill the editor. Also the birthplace of LSP — the Language Server
Protocol — a protocol design so clean it now spans every editor.

**Reading path.**
1. Read the [process model](https://code.visualstudio.com/api/advanced-topics/extension-host) docs first.
2. `src/vs/workbench/services/extensions/common/extensionHostManager.ts` + `extensionHostProtocol.ts` — how extensions run out-of-process and talk over IPC.
3. `extensions/` — built-in language features as extensions.
4. `src/vs/editor/` — the Monaco editor core (separate product lineage).

**Exercise.** Write a tiny extension (vscode-extension-samples) and observe in the process explorer which process your code actually ran in.

---

### ripgrep (Rust, ~50k lines) — difficulty ★★★

<https://github.com/BurntSushi/ripgrep> · 69k★ (2026-10) · keywords: parallel traversal, memory-mapped search, SIMD, ignore rules

**Why it's here.** A hierarchy of performance engineering: a directory walk with
ignore rules (the `ignore` crate), parallelism per worker thread, and
adapters that switch between mmap and streaming I/O. The fastest grep in the world — every line justifies itself.

**Reading path.** Read the [`GUIDE.md`](https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md) user guide; then the `ignore` crate's parallel walker and the `grep-searcher` strategy switching. Pair with the author's blog posts.

**Exercise.** Benchmark vs `grep -r`; profile where time goes; explain the
three biggest design wins in a paragraph.

---

### gh — GitHub CLI (Go, ~200k lines) — difficulty ★★

<https://github.com/cli/cli> · 47k★ (2026-10) · keywords: API client design, Go CLI conventions, extensions

**Why it's here.** Exemplary CLI design in Go: `pkg/cmd` command tree, API
layer over GraphQL/REST, extension mechanism. The codebase you'd hand to
anyone building a polished CLI tool in Go.

**Reading path.** `pkg/cmd/` command tree → `pkg/cmdutil/` factory wiring → `internal/api/` + GraphQL client layer.

**Exercise.** Trace `gh pr view` from command dispatch to GraphQL query. Then
write a tiny extension.

---

### fzf (Go, ~60k lines) — difficulty ★★

<https://github.com/junegunn/fzf> · 84k★ (2026-10) · keywords: fuzzy matching, generic interfaces, terminal UI

**Why it's here.** A small, universal tool with a sharp interface: stdin →
fuzzy match → selection. Shows how far careful interface design (compose with pipes, language-agnostic) carries a simple algorithm.

**Reading path.** `src/core.go` (event loop) → `src/algo/algo.go` (matching) → `src/terminal.go` (UI) → `src/server.go` (client/server mode).

**Exercise.** Read `src/algo/algo.go` (fuzzy match scoring) and the Go concurrency model for streaming results.

---

### htop (C, ~30k lines) — difficulty ★★

<https://github.com/htop-dev/htop> · 8k★ (2026-10) · keywords: /proc parsing, ncurses UI, portability layers

**Why it's here.** A classic small systems program: reads /proc, renders
under ncurses, abstracts platform differences (`linux/Platform.c`, `darwin/Platform.c`).
Approachable in a weekend.

**Reading path.** `main.c` → `ProcessList.c` (the /proc walk) → `linux/Platform.c` → `ScreenManager.c` / `InfoScreen.c` (rendering).

**Exercise.** Find where the CPU meter's data comes from in `/proc` — start at `Process.c` and `linux/Platform.c`, the exact files parsed.

## Verified paths

Upstream trees checked 2026-10-10 (shallow clones): vscode@a5aeada, ripgrep@3fce3b5, cli/cli@ec5b512, fzf@33a3456, htop@44a59cf.
