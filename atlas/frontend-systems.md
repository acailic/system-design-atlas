# Frontend systems — React, Vue, Svelte

The most popular runtime code on Earth, and a legitimate systems study:
reconciliation, scheduling, reactivity, and compiler-driven optimization.
Systems thinking transfers directly between these and the rest of the atlas.

---

### React (JavaScript, ~300k lines) — difficulty ★★★★

<https://github.com/facebook/react> · ~230k★ · keywords: reconciliation, fibers, scheduling, hooks

**Why it's here.** The most-used UI runtime in the world, whose design is a systems curriculum: a work loop with cooperative scheduling, incremental reconciliation over a fiber tree, priority lanes, and a hook model based on linked lists. It's an OS scheduler for UI.

**Reading source.**
1. Skip `node_modules`-style noise; go to `packages/react-reconciler/src/ReactFiberWorkLoop.js` — the main loop with `shouldYield` time slicing.
2. `ReactFiber.js` — the node type.
3. `ReactFiberBeginWork.js` / `ReactFiberCommitWork.js` — render vs commit phases.
4. Hooks in `ReactFiberHooks.js`.
5. `ReactFiberClassUpdateQueue.js` — batching and priority (plus `ReactUpdateQueue` types in `packages/react/src/`).
6. A guided reading helps: react.gg's React Internals, and the original Fiber architecture notes in the repo's `notes/`.

**Exercise.** In a demo, toggle `StartTransition` vs normal setState and observe in the scheduler's tracing which lane each took. Then match to `ReactFiberLane.js`.

---

### Vue 3 (TypeScript, ~150k lines) — difficulty ★★★

<https://github.com/vuejs/core> · ~49k★ · keywords: reactivity graph, proxies, effect scheduling

**Why it's here.** The cleanest implementation of reactivity as a systems
graph — ES `Proxy` intercepts → effect tracking → computed scheduler.
Exceptionally readable source ("reactivity as a dependency graph" is a
system design lesson in miniature).

**Reading path.**
1. `packages/reactivity/src/effect.ts` — track/trigger.
2. `reactive.ts` — proxy instrumentation.
3. `packages/runtime-core/src/renderer.ts` — the patch pipeline.
4. `packages/runtime-core/src/apiCreateApp.ts` — lifecycle from app to mount.

**Exercise.** Use `effect()` with a computed chain; watch triggering order; predict it from `effect.ts` before running.

---

### Svelte (TypeScript/JS, ~100k lines) — difficulty ★★★

<https://github.com/sveltejs/svelte> · ~81k★ · keywords: compiler, no virtual DOM, static analysis

**Why it's here.** The compiler-first design: instead of shipping a runtime, analyze at build time, emit minimal DOM updates. Reading `packages/svelte/src/compiler` shows optimization as *analysis* — what a runtime wastes, a compiler can delete.

**Exercise.** Read the compiler output of a small component with reactivity; note how much runtime work became generated code.

---

## Why include frontend in a systems atlas?

The core problems are the same problems elsewhere in the atlas:
- Reconciliation → desired vs actual state (Kubernetes).
- Scheduling work with priorities and interruptions → OS schedulers (Go runtime, Linux).
- Change propagation with minimal recomputation → incremental view maintenance, build systems.
- Fine-grained reactivity → dataflow graphs (streams, spreadsheets, signal networks).

If you design state-heavy systems, React/Vue internals are a direct masterclass.

## Verified paths

Upstream trees checked 2026-10-10 (shallow clones): react@b618bbb, vue@4ab865a, svelte@707c281.
