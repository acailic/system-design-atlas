# Compilers and interpreters

No better domain for learning to reason about data transformation
pipelines: front-end (lex/parse), middle (types/IR), back-end (codegen).
Start with a teaching compiler, not gcc.

---

### chibicc (C, ~10k lines) — difficulty ★★

<https://github.com/rui314/chibicc> · 12k★ (2026-10) · keywords: teaching C compiler, one commit per stage

**Why it's here.** A C11 compiler that can compile git, qemu, sqlite…
built as a teaching ladder: each commit adds one stage. The single best
on-ramp to real compilers.

**Reading path.** Follow the commit history in order — tokenizer → parser →
types → codegen. Read `main.c` and `parse.c` alongside the commit messages.

**Exercise.** Add unary `+` support (it's mostly a no-op) — locate the
parser rule, extend it, and rebuild chibicc, then chibicc-compiles-git.

---

### Crafting Interpreters (Java + C, book + repo) — difficulty ★★

<https://github.com/munificent/craftinginterpreters> · 11k★ (2026-10) · keywords: bytecode VM, GC, closures

**Why it's here.** The on-ramp: build two full interpreters (tree-walking
jlox, then bytecode clox) from scratch. Working the book makes reading
CPython/Lua dramatically easier.

**Reading path.** The book itself, front to back — it *is* the path.

**Exercise.** Do the book's chapters; after each, diff your design choices
against Lua's.

---

### QBE (C, ~12k lines) — difficulty ★★★

<https://c9x.me/compile/> ([source mirror](https://github.com/fixpoint/qbe)) · keywords: SSA backend, register allocation, retargeting

**Why it's here.** A small compiler backend in SSA form — the layer most
tutorials skip, implemented legibly and compactly.

**Reading path.** Read the [doc](https://c9x.me/compile/), then follow a
function through `parse` → SSA (ssa.c) → `rega.c` register allocation → emit.

**Exercise.** Compile a small C file to QBE IL with a simple front end; trace one value's SSA life.

---

### rustc / LLVM (huge) — difficulty ★★★★★

<https://github.com/rust-lang/rust> · <https://github.com/llvm/llvm-project>

**Why it's here.** For advanced study: rustc's guides ([rustc-dev-guide](https://rustc-dev-guide.rust-lang.org/)) explain a modern type-checking,
borrow-checking, LLVM-lowering pipeline; LLVM is the industry compiler
backend. Read the guides and seams, not the whole tree.

**Reading path.** The rustc-dev-guide chapters in order; then `compiler/` crates the guide names for each phase.

**Exercise.** Use `-Z unpretty=hir` / `--emit=llvm-ir` to see the same
function at successive IR stages; name what each stage decided.

---

## Domain exercises

- Write a lexer + Pratt parser for a small expression language; emit your VM's bytecode from `languages-and-runtimes.md`.
- Implement lambda lifting / closure conversion in your interpreter.

## Companion materials

- *Writing a C Compiler* (Nora Sandler) — the natural next step after chibicc.
- "SSA-based Compiler Design" (Hack) for theory grounding.
- [Let's Build a Compiler](https://www.compilers.iecc.com/crenshaw/) for the ladder below chibicc.

## Verified paths

Upstream trees checked 2026-10-10 (shallow clones): chibicc@90d1f7f, craftinginterpreters@4a840f7, qbe@d2f7b69 (rustc not tree-checked).
