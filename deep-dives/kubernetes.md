# Kubernetes: desired state + reconcile loops — an operating system as a control system

> **Atlas id:** `kubernetes` · **Domains:** `orchestration, container, distributed` ·
> **Upstream:** https://github.com/kubernetes/kubernetes · **License:** Apache-2.0 ·
> **Pinned commit:** `031bf130d6f34a01456892be80ee21c343ffb7a8` (2026-10-09, master)

Kubernetes is the operating system of the datacenter, and it won that
position with one architectural bet, repeated everywhere: **declarative
desired state stored in one versioned API, converged by level-triggered
reconcile loops**. Users describe the world they want; controllers
continuously drive reality toward it. This deep-dive teaches the
controller pattern (informer → workqueue → reconcile), the API machinery
that makes "the API is the product" true (etcd store, watch cache, field
management), and why level-triggered beats edge-triggered in systems
that must survive missed events.

## 1. Architecture overview

```
 kubectl apply ─► kube-apiserver ─► etcd (single source of truth)
                   │  versioned REST, RBAC, admission, field manager
                   │  watch stream (cacher: in-memory watch cache)
                   ▼
        ┌────────── controllers (kube-controller-manager) ─────────┐
        │  each = informer (reflector→DeltaFIFO→store) + handlers  │
        │  → rate-limited workqueue → reconcile (e.g. syncReplica-  │
        │    Set: create/delete pods until count matches Spec)      │
        └───────────────────────────────────────────────────────────┘
                   ▼ pods assigned to nodes (scheduler: plugins)
        ┌────────── kubelet per node ───────────────────────────────┐
        │  pod workers + PLEG events → container runtime (CRI)      │
        │  status reported back through the same API                │
        └───────────────────────────────────────────────────────────┘
```

- The **spine** — "scale to 5 replicas" — is: `kubectl scale` writes a
  `ReplicaSet.Spec.replicas=5` through the API into etcd; the
  ReplicaSet controller's informer sees the update event
  (`pkg/controller/replicaset/replica_set.go:273` wires the sync
  handler); `syncReplicaSet` (756) enqueues the key;
  `manageReplicas` (653) creates or deletes pods until reality
  matches; the scheduler binds new pods; each kubelet's `UpdatePod`
  (`pkg/kubelet/pod_workers.go:761`) starts containers and writes
  `Pod.Status` back.

## 2. Core data structures — and why these

### Spec/Status split (`staging/src/k8s.io/api/core/v1/types.go`)

Every object is `metadata + Spec + Status` (e.g. `PodSpec:4461`,
`PodStatus:5694`, `Pod:5899`). Spec is the *input* (what the user
wants), Status is the *output* (what the system observed). Why: the
split makes the control-theory contract physical — reconcile = f(Spec,
observed) → actions; and it gives `kubectl diff`, server-side apply,
and every controller a uniform shape.

### Informer: reflector → DeltaFIFO → local store + handlers
(`staging/src/k8s.io/client-go/tools/cache/`)

A `SharedIndexInformer` (`shared_informer.go:419`) runs a `Reflector`
(`reflector.go:106`) doing `ListAndWatch` (470): one initial LIST, then
a WATCH stream; changes land in a `DeltaFIFO` (`delta_fifo.go:108`,
`Pop:562`) which drains into a local cache and fires event handlers.
Why: controllers read from the **local cache**, never hammering the
API server; *shared* means N controllers per process reuse one
connection and one cache. This structure is the difference between a
control plane that scales and one that DDoSes its own database.

### Rate-limited workqueue
(`staging/src/k8s.io/client-go/util/workqueue/rate_limiting_queue.go`)

Handlers never act; they enqueue keys. The queue
(`TypedRateLimitingInterface:30`, `AddRateLimited:34`) requeues failed
reconciles with exponential backoff. Why: failure is routine (node
down, API conflict); a queue with per-item rate limits turns "retry
forever, gently" into infrastructure rather than policy.

### etcd-backed store + watch cache
(`staging/src/k8s.io/apiserver/pkg/storage/`)

`etcd3/store.go` is the only writer (`Create:301`, `Get:252`,
`Watch:1161`); a `Cacher` (`cacher/cacher.go:264`) fronts it with an
in-memory versioned buffer (`watch_cache.go:83`) serving watches
without loading etcd. Why: one serialized store (etcd, Raft) gives
resourceVersions and optimistic concurrency (`resourceVersion`
compare-and-swap) for every object type — transactions without a
transaction service.

### Leader-epoch-free ownership: labels + ownerReferences

Controllers find their objects by *label selectors*, claim them by
*ownerReferences*, and release orphans via GC. Why: grouping by query,
not by pointer, is what lets CRDs and third-party controllers compose
with built-ins without coordination.

## 3. Concurrency and failure model

- **Everything is eventually consistent, by design**: events can be
  missed, dropped, duplicated, reordered — controllers tolerate it
  because reconcile is idempotent and level-triggered (compare current
  state vs spec, act on the difference). The resync period re-Lists as
  a safety net; expectations (`controller_utils.go`) avoid
  create-storms.
- **Work distribution**: one API server (horizontally replicated,
  consistent through etcd), N schedulers (leader-elected), many
  controllers (leader-elected per manager), a kubelet per node. Each
  kubelet is a self-contained control loop over its node's pods
  (`syncLoop:2684`, `syncLoopIteration:2759`) fed by the PLEG
  (pod lifecycle event generator) — container runtime events become
  pod status updates through the same watch machinery.
- **Failure of any component is safe**: a dead controller = drift
  unconverged until restart; a dead kubelet = node marked NotReady by
  the node controller, pods rescheduled. There is no component whose
  crash corrupts state — etcd's Raft is the only consistency-critical
  code.
- **Overload is absorbed by the queue**: backpressure at the workqueue
  and API priority/fairness classes; watches fall back to re-List on
  resourceVersion too old.

## 4. API and extension design

- **The API is the product**: versioned groups (`apps/v1`, `batch/v1`…),
  generated clients, protobuf on the wire, and machine-readable OpenAPI
  schemas. `kubectl` is a generic client — it special-cases almost
  nothing.
- **Server-side apply / field manager**
  (`staging/src/k8s.io/apiserver/pkg/endpoints/handlers/fieldmanager/`)
  tracks *which actor owns which fields*, so multiple controllers (and
  humans) can write one object without clobbering each other — merge
  semantics as API infrastructure.
- **CRDs** (`staging/src/k8s.io/apiextensions-apiserver/`,
  `CustomResourceDefinitionSpec` at `v1/types.go:41`) turn the API
  server into a platform: third parties register new resource types
  that get storage, watch, RBAC, and tooling for free. The scheduler
  is equally pluggable (`pkg/scheduler/framework/` — filter/score
  plugin phases).
- Honest wart: the object model's generality has costs —
  `resourceVersion` semantics, finalizers, and informer caches are the
  three places every seasoned k8s developer has been burned; and the
  API server/etcd remains a throughput ceiling the ecosystem works
  around (operators sharding by namespace, etc.).

## 5. The defining trade-offs

### Trade-off 1: level-triggered reconcile over edge-triggered actions
- **Tension:** react to changes fast without missing any.
- **Choice:** controllers don't react to events; they compare spec vs
  observed state and converge. Events are just a *hint* to look.
- **Evidence:** `syncReplicaSet` (`pkg/controller/replicaset/replica_set.go:756`)
  re-reads the world each run; `manageReplicas` (653) computes pod
  diffs; resync periods re-enqueue everything; the workqueue's
  `AddRateLimited` handles failure retry.
- **Given up:** minimal-work reactions (every reconcile does full
  reads), constant background churn, latency floors set by polling
  cadence in the worst case.
- **Verdict:** in a distributed system, events *will* be missed; a
  system that converges from any state survives what an
  event-dispatch system cannot. This is the single most stealable idea
  in Kubernetes.

### Trade-off 2: declarative spec/status + watch over imperative RPCs
- **Tension:** operators (humans and robots) need to express intent and
  observe results over flaky networks and long timescales.
- **Choice:** everything is a declarative object; observation is a
  consistent watch stream from one store.
- **Evidence:** `PodSpec:4461`/`PodStatus:5694` split;
  `etcd3/store.go` serializes writes behind `resourceVersion`
  (`Create:301`, `Watch:1161`); the `Cacher` (`cacher.go:264`) makes
  watch cheap; field manager resolves concurrent writers.
- **Given up:** immediacy (no synchronous "do it now" semantics),
  familiar request/response programming model, and a large cognitive
  surface (resourceVersion, finalizers, ownership).
- **Verdict:** right when the "client" is a long-lived automation that
  must survive disconnects and partial failures — i.e., exactly the
  datacenter case. Imperative wins for one-shot tools.

### Trade-off 3: one API gateway + one store over per-service backends
- **Tension:** composability and uniform tooling vs component autonomy.
- **Choice:** all state flows through kube-apiserver into etcd; every
  subsystem (scheduler, kubelet, controllers, CRDs) is a client of the
  same API.
- **Evidence:** controllers and kubelet both consume informers;
  CRD types get storage/watch/RBAC via apiextensions for free;
  `kubectl describe` works on unknown future types.
- **Given up:** the apiserver/etcd pair is a scalability choke point;
  subsystems can't optimize their own storage; startup ordering and
  versioning become everyone's problem.
- **Verdict:** the uniformity is why an ecosystem of thousands of
  operators interoperates at all — the biggest "API as architecture"
  win in modern infrastructure, paid for in throughput ceilings the
  community manages rather than removes.

## 6. Reading path

1. `staging/src/k8s.io/api/core/v1/types.go` — skim `Pod` (5899),
   `PodSpec` (4461), `PodStatus` (5694): internalize the
   spec/status/metadata shape; it repeats for every kind.
2. `staging/src/k8s.io/apiserver/pkg/storage/etcd3/store.go` — `Get`
   (252), `Create` (301), `Watch` (1161): the bottom of the stack —
   one store, versioned keys, watch as etcd prefix watch.
3. `staging/src/k8s.io/apiserver/pkg/storage/cacher/cacher.go:264` +
   `watch_cache.go:83` — how watches are served from memory; note
   resourceVersion bookkeeping.
4. `staging/src/k8s.io/client-go/tools/cache/reflector.go:106` —
   `ListAndWatch` (470) and `list` (674): reconnection and relist
   logic, the robustness that makes client caches trustworthy.
5. `staging/src/k8s.io/client-go/tools/cache/delta_fifo.go:108` + `Pop`
   (562) — the de-dup/delta machinery feeding handlers in order.
6. `staging/src/k8s.io/client-go/util/workqueue/rate_limiting_queue.go`
   (30/144) — keys, dedup, exponential backoff; the controller's
   tempo.
7. `pkg/controller/replicaset/replica_set.go` — the canonical loop:
   handler wiring (273), `syncReplicaSet` (756), `manageReplicas`
   (653): watch how *every* reconcile re-derives the world, and how
   expectations prevent create storms.
8. `pkg/scheduler/schedule_one.go:85` — one pod's scheduling pass:
   filter → score plugins (`pkg/scheduler/framework/plugins/`), then a
   binding write through the API.
9. `pkg/kubelet/kubelet.go:syncLoop` (2684) and `syncLoopIteration`
   (2759) + `pkg/kubelet/pod_workers.go:UpdatePod` (761) — the node
   agent as another reconciler; PLEG turns runtime events into syncs.
10. `staging/src/k8s.io/apiserver/pkg/endpoints/handlers/fieldmanager/`
    — server-side apply: field ownership as merge conflict resolution.
11. `staging/src/k8s.io/apiextensions-apiserver/pkg/apis/apiextensions/v1/types.go:41`
    — CRD spec: a resource type defined as data; then write a
    50-line controller with controller-runtime to feel the pattern
    from the outside.

You have now traced "scale to 5" from API write through etcd, watch,
informer, workqueue, reconcile, scheduling, and kubelet — the entire
control loop of the datacenter operating system.

## 7. What to steal

- **Level-triggered reconciliation**: compare desired vs observed,
  act on the diff, idempotently, with retries — the pattern that makes
  systems self-healing; applicable from infra daemons to GUIs.
- **Serve reads from local caches built by watch streams**
  (informer): scalable control planes read their database rarely.
- **Spec/status split with optimistic concurrency**: intent and
  observation as separate documents with version-checked writes is a
  complete coordination model.
- **Make the API generic and the extensions typed**: CRDs show that a
  versioned resource API with storage+watch+RBAC is a platform
  substrate, not just an interface.
- **Field ownership for concurrent writers**: when many actors write
  one object, track *who owns which fields* instead of inventing
  ad-hoc locks.

## 8. Difficulty and prerequisites

- Difficulty: **demanding** — the codebase is enormous; the leverage
  is sticking to the spine above (informer → controller → kubelet)
  and refusing to wander.
- Budget: ~8 hours for the reading path; steps 4–7 are the core 3.
- Prerequisites: comfort with REST semantics and watches, basic
  control-loop thinking, Go reading fluency (generics, interfaces,
  goroutines).

## 9. Further reading

- The Kubernetes API conventions:
  `docs/devel/api-conventions.md` in-repo (the spec/status and
  level-trigger philosophy, written down).
- "Kubernetes Components" and "Controller Pattern" in the official
  docs (https://kubernetes.io/docs/concepts/architecture/).
- controller-runtime + kubebuilder (https://book.kubebuilder.io/) —
  the pattern extracted into a framework; read after step 7 to see it
  abstracted.
- "Level Triggering and Reconciliation" — the canonical blog post on
  level vs edge semantics (Brendan Burns / k8s design discussions).
