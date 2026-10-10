# Languages and runtimes

A language runtime is a whole system in one binary: allocator, scheduler,
GC, I/O, and a foreign-function boundary. Reading runtimes teaches
performance thinking like nothing else.

---

### CPython (C, ~1M lines) — difficulty ★★★

<https://github.com/python/cpython> · keywords: VM, object model, GIL, refcounting

**Why it's here.** You already know Python; now learn what `x = x + 1`
actually does. CPython is the most approachable mainstream interpreter.

**Reading path.**
1. `Python/bltinmodule.c` or `Modules/main.c` — startup.
2. `Python/ceval.c` — the bytecode interpreter loop; in 3.11+ generated cases live in `Python/generated_cases.c.h`.
3. `Objects/object.c` + `Include/object.h` — `PyObject`, refcounting, protocols.
4. `Python/gc.c` — the cycle collector, and how it coexists with refcounts.
5. `Objects/dictobject.c` — the famously clever compact dict.

**Exercise.** Compile a small module with `python -m dis` to see the bytecode; find two opcodes in the dump and their cases in `generated_cases.c.h`.

---

### Go (runtime in Go/asm, `src/runtime`) — difficulty ★★★★

<https://github.com/golang/go> · keywords: M:N scheduler, channels, GC, memory model

**Why it's here.** The most readable industrial runtime: `src/runtime` is a
complete scheduler + allocator + GC in ~100k lines of Go (plus some asm).

**Reading path.**
1. `runtime/proc.go` — `schedule()`, `findRunnable()`: how M's run G's on P's.
2. `runtime/chan.go` — channel send/recv, `gopark`/`goready`.
3. `runtime/runtime2.go` — the core types (g, m, p).
4. `runtime/mgc.go` — concurrent mark-sweep, `gcStart`.
5. `runtime/netpoll.go` — network I/O integrated with the scheduler.

**Exercise.** Build a scheduler-stats GODEBUG run (`GODEBUG=schedtrace=1000`)
and match each trace line to the fields in `schedt` from `runtime2.go`.

---

### Lua (C, ~30k lines) — difficulty ★★

<https://github.com/lua/lua> · keywords: compact VM, register machine, incremental GC

**Why it's here.** The whole language fits in a book. The interpreter is a
register VM with an incremental generational GC — every subsystem is present
and small.

**Reading path.** `lvm.c` (execute loop) → `ldo.c` (call stack) →
`lparser.c`/`lcode.c` (one-pass parse & codegen) → `lgc.c`.

**Exercise.** Add a string function to the stdlib, following the
`lua_pushstring`/`lua_newtable` C API. 

---

### musl libc (C, ~80k lines) — difficulty ★★★

<https://github.com/bminor/musl> · keywords: system-call wrappers, printf engine, portability

**Why it's here.** A complete libc in the space others spend on startup code.
Every syscall wrapper is visible; `src/stdio/printf` is a famous piece of
engineering. Read when you want to see what sits *below* the runtime.

**Exercise.** Follow `fopen` → `malloc` → syscall wrappers; list every
kernel boundary crossed to read one line from a file.

---

## Domain exercises

- Write a tiny stack VM (add, load, store, call) — then a mark-sweep GC for its heap.
- Compare goroutines and green threads in your toy runtime; implement work-stealing.

## Companion materials

- *Crafting Interpreters* (Nystrom) — before CPython.
- [Go runtime scheduler slides](https://docs.google.com/document/d/1TTj4T2DS42LyOQxo39o3NMwbaLYJP76Q90y2j2awcufo/edit) — history & design.
- CPython devguide internals section.
