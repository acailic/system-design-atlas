# Applications — editors and tools

Long-lived, interactive programs with real-time constraints, huge state,
plugin systems, and TUI/GUI rendering. This domain teaches how *product*
systems are structured — where you can't be purely theoretical about
latency.

---

### Neovim (C, ~350k lines) — difficulty ★★★

<https://github.com/neovim/neovim> · keywords: event loop, TUI grid, msgpack-RPC, embedded Lua

**Why it's here.** The most comprehensively modernized classic: an event
loop, a separated UI protocol (TUI is just another client), Lua runtime,
and async jobs — inside a 30-year-old architecture.

**Reading path.**
1. `src/nvim/main.c` — the loop starts; input from `os/input.c`.
2. `src/nvim/state.c` — editor state machine (Normal/Insert/…).
3. `src/nvim/screen.c` — the UI grid model; how redraws are computed as diffs.
4. `src/nvim/msgpack_rpc/` — the RPC protocol between editor and UI.

**Exercise.** Write a small Lua plugin that uses `vim.api.nvim_buf_set_lines`, then find that API call's C handler in `src/nvim/api/` to see the boundary from both sides.

---

### Git (C, big, modular) — difficulty ★★★

<https://github.com/git/git> · keywords: content-addressable store, refs, packed objects

**Why it's here.** The design is a gem: immutable, content-addressed object
store + tiny mutable pointer layer (refs). Understanding that split explains
every git weirdness you've ever hit.

**Reading path.**
1. The [Git book chapter 10](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects) — the model first.
2. `builtin/commit.c` — how a commit is created.
3. `object.c`, `refs.c`, `packfile.c`.
4. Read [Git from scratch](https://maryrosecook.com/blog/post/git-from-the-bits-up) alongside.

**Exercise.** Write a 100-line "mini-git" that hashes files into
`.git-like/objects`, then replay an `init/add/commit` by hand.

---

### tmux (C, ~70k lines) — difficulty ★★★

<https://github.com/tmux/tmux> · keywords: event loop, terminal emulator state, panes

**Why it's here.** A clean libevent-based daemon with a terminal emulator
state machine inside — small enough to read whole, interesting enough
(scrollback, modes, panes) to be worth it.

**Exercise.** Trace one keystroke from the client process to the pane's
`tty.c` write.

---

## Domain exercises

- Build a tiny editor: 200-line TUI with cursor movement, one-line buffer, and redraw diffing.
- Write a content-addressable store tool (`hash-object` / `cat-file`) with zlib compression.

## Companion materials

- *The Craft of Text Editing* (Finseth) — TUI architecture classic.
- "My Ideal Text Editor" (destroyallsoftware screencasts).
- Pro Git book, chapter 10 (Internals).
