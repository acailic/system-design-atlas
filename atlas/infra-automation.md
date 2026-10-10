# Infrastructure automation

Declarative infrastructure and agentless automation: how modern systems
express and enforce desired machine state. The design pattern from
Kubernetes reconciliation, applied to networks, VMs, and cloud resources.

---

### Terraform (Go, ~200k lines) — difficulty ★★★

<https://github.com/hashicorp/terraform> · ~45k★ · keywords: resource graph, plan/apply, provider protocol, HCL

**Why it's here.** The flagship of infrastructure-as-code: a state file, a
dependency graph of resources, and a plan/apply split that previews
destructive changes. The provider protocol is a masterclass in plugin design
(over gRPC), with hundreds of independent implementations.

**Reading path.**
1. `internal/backend/` — state storage and locking.
2. `internal/plans/planfile/` — how a plan is serialized and applied later.
3. `internal/plugin/` — provider gRPC protocol (versioned, capability-negotiated).
4. `internal/terraform/node_resource_plan.go` — diff computation.

**Exercise.** `terraform plan` on a two-resource config; rename a resource ID and identify in the output which part came from `plan` vs. `apply` code paths.

---

### Ansible (Python, ~350k lines) — difficulty ★★★

<https://github.com/ansible/ansible> · ~63k★ · keywords: agentless, push model, idempotent modules

**Why it's here.** The push-over-SSH, agentless design — no daemon on
targets, modules ship themselves over the wire. Idempotency is not an
afterthought: each module declares its own check-mode semantics. Contrast
with the pull/polling model of other config systems.

**Reading path.**
1. `lib/ansible/executor/` — task queue over worker processes.
2. `lib/ansible/plugins/action/` — normal vs async module execution.
3. A simple module like `lib/ansible/modules/files/file.py` — the change/ok/failed protocol and `check_mode`.
4. Connection layer `lib/ansible/plugins/connection/ssh.py`.

**Exercise.** Run `ansible-playbook` with `--check --diff` and note how
modules compute the *would-be change* before any change is attempted.

---

### Docker Compose (Python/Go, ~100k lines) — difficulty ★★

<https://github.com/docker/compose> · ~34k★ · keywords: local orchestration, service graphs, hot reload

**Why it's here.** The simplest orchestration system in the atlas — the
lifecycle of services and networks driven by a single YAML file. Shows how
Compose maps a declarative file to the Docker API calls, in a codebase small
enough to read in a week.

**Exercise.** Run `docker compose up` on a two-service config with
`--verbose`; match each lifecycle step to the code that initiated it.

## Verified paths

Upstream trees checked 2026-10-10 (shallow clones): terraform@d8e73fc, ansible@0d66197 (compose not tree-checked).
