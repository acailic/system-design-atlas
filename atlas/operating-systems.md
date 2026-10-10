# Operating systems

The original systems-design curriculum. Everything about isolation,
scheduling, virtual memory, and concurrency shows up first in an OS kernel.

---

### xv6-riscv (C, ~10k lines) — difficulty ★★

<https://github.com/mit-pdos/xv6-riscv> · 11k★ (2026-10) · keywords: teaching Unix, syscalls, page tables, file system

**Why it's here.** A complete Unix reimplementation for teaching, with a
free companion book that walks every file. If you read one OS in your life,
read this one.

**Reading path.**
1. `kernel/main.c` → `kernel/vm.c` (virtual memory setup) → `kernel/proc.c` (process table, `scheduler`).
2. `kernel/syscall.c` — the syscall dispatch; follow `exec` or `open`.
3. `kernel/fs.c` + `kernel/file.c` — a whole filesystem in ~1k lines.
4. Labs: MIT 6.1810's [assignments](https://pdos.csail.mit.edu/6.1810/2024/) let you implement syscalls, locks, and copy-on-write.

**Exercise.** Add a new syscall `int sysinfo(struct sysinfo*)`; this is the
first xv6 lab and proves you can navigate the whole kernel.

**Companion.** *xv6: a simple, Unix-like teaching operating system* (free PDF).

---

### seL4 (C + proofs) — difficulty ★★★★

<https://github.com/seL4/seL4> · keywords: microkernel, formal verification, capabilities

**Why it's here.** The only OS kernel with a machine-checked functional
correctness proof. Reading it teaches what a *minimal* kernel design looks
like when you take isolation seriously.

**Reading path.** Start with the [seL4 whitepaper](https://sel4.systems/About/seL4-whitepaper.pdf); the code's architecture
(docs + `src/api`, `src/kernel`) is small and profoundly disciplined.

**Exercise.** Explain how a capability grant differs from a Unix fd by
pointing at the code in `src/object/cnode.c`.

---

### Redox OS (Rust, ~400k lines) — difficulty ★★★★

<https://github.com/redox-os/kernel> (repo: [redox-os/redox](https://github.com/redox-os/redox)) · keywords: Rust microkernel, URL schemes, drivers in userspace

**Why it's here.** A modern Rust microkernel where drivers run in userspace
and "everything is a URL scheme" — see Unix ideas rebuilt with modern
tooling.

---

### Linux (C, ~40M lines) — difficulty ★★★★ (targeted reads only)

<https://github.com/torvalds/linux> · 251k★ (2026-10) · keywords: scheduler, memory management, block layer

**Why it's here.** Not for reading whole — for targeted subsystem reads with
a guide. Good starting points:
- Follow one syscall (e.g. `write`) from `fs/read_write.c` → VFS → a filesystem.
- `kernel/sched/` (CFS/EEVDF core), `mm/` (page allocator).
- Robert Love's *Linux Kernel Development*; [kernelnewbies.org](https://kernelnewbies.org/) FAQs.

**Exercise.** Print the kernel's scheduler stats (`/proc/schedstat`) and
map fields to `kernel/sched/stats.c`.

---

## Domain exercises

- Implement a tiny cooperative scheduler: context switch via `setjmp`/asm, two tasks, a round-robin tick.
- Write a page-table walker on paper for xv6's SV39; trace a virtual address to a physical frame step by step.

## Companion materials

- OSTEP (free online) — the theory matched to xv6.
- *The Design of the UNIX Operating System* (Bach) — the classic System V design.
- Arpaci-Dusseau's [OS book](https://pages.cs.wisc.edu/~remzi/OSTEP/).

## Verified paths

Upstream trees checked 2026-10-10 (shallow clones): xv6-riscv@06aad25 (Linux entry is docs-guided; tree too large to enumerate).
