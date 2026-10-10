# Containers and orchestration

Containers are just Linux primitives (namespaces, cgroups, overlayfs)
composed by userspace code — small enough to read the whole story, then
scaling up to the largest distributed control loop in the industry.

---

### runc (Go, ~30k lines) — difficulty ★★

<https://github.com/opencontainers/runc> · keywords: namespaces, cgroups, OCI runtime

**Why it's here.** The actual program that "runs a container" on nearly
every Linux host. Reading it permanently demystifies containers.

**Reading path.**
1. `create.go` → `libcontainer/factory.go` → `standard_init_linux.go`:
   namespace setup, rootfs pivot, capabilities.
2. `start.go` → the parent/child handshake over a pipe.
3. `libcontainer/cgroups/` — resource limits.

**Exercise.** Run a container with `--debug` and list, from the logs, the
ordered namespace/cgroup operations; then find each in the code.

---

### containerd (Go, ~250k lines) — difficulty ★★★

<https://github.com/containerd/containerd> · keywords: gRPC services, image distribution, runtime v2 shim

**Why it's here.** The daemon between Docker/K8s and runc. Clean gRPC
service decomposition — metadata store, image pull, snapshotter, task
runtime — a blueprint for designing a long-running platform daemon.

**Reading path.** `cmd/containerd/main.go` → `services/` (each subcommand a gRPC service) → `runtime/v2/` shim protocol.

**Exercise.** Follow `ctr pull` from CLI → `images/service.go` → snapshotter; sketch the service dependency graph.

---

### Kubernetes (Go, ~1M lines) — difficulty ★★★★★

<https://github.com/kubernetes/kubernetes> · the control loop that runs the industry

**Why it's here.** The largest declarative state machine in production:
API server (etcd-backed), controllers reconciling desired vs actual state,
schedulers, kubelet. Reading all of it is unrealistic — instead:
1. [client-go's workqueue informer pattern](https://github.com/kubernetes/client-go) — THE canonical controller architecture.
2. [sample-controller](https://github.com/kubernetes/sample-controller) — a complete loop: watch → queue → reconcile.
3. `staging/src/k8s.io/api` — API machinery: how resources/types/versioning work.
4. [The Kubernetes API conventions](https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md) — the design doc for why.

**Exercise.** Deploy sample-controller; add a status field updated on
reconcile; watch it converge. Then read [Kubernetes The Hard
Way](https://github.com/kelseyhightower/kubernetes-the-hard-way) for the
underlying components.

**Companion.** *Programming Kubernetes* (Strachan) for API machinery patterns.

---

## Domain exercises

- Reproduce a container with no Docker: `unshare` + `chroot` + cgroup v2 `+` hand-run. Write the steps.
- Write a toy controller: watch a CRD-like JSON file, reconcile desired state, log the diff. This is 80% of Kubernetes in miniature.

## Companion materials

- [Julia Evans' zines on containers](https://wizardzines.com/) — friendly intro.
- *Container Security* (Mohclon) for the isolation model.
- [Kubernetes The Hard Way](https://github.com/kelseyhightower/kubernetes-the-hard-way).
