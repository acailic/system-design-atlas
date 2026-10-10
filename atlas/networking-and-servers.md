# Networking, servers, and protocols

How real systems accept millions of connections, multiplex work, terminate
TLS, and speak protocols. These codebases embody the answers to every
"how does a load balancer actually work" question.

---

### nginx (C, ~250k lines) — difficulty ★★★★

<https://github.com/nginx/nginx> · 32k★ (2026-10) · keywords: event-driven, master/worker, phase engine, reverse proxy

**Why it's here.** The canonical event-driven server architecture:
asymmetric multi-process master/workers, non-blocking I/O, and a module
system where every module plugs into one of the HTTP phases.

**Reading path.**
1. `src/core/nginx.c` — `main()`: config parse, `fork()` workers.
2. `src/event/ngx_event.c` + `src/event/modules/ngx_epoll_module.c` — how the reactor loop works.
3. `src/http/ngx_http_request.c` — the HTTP state machine reading/writing non-blocking.
4. `src/http/ngx_http_core_module.c` — the phase engine where every module runs.
5. Pick one simple module (e.g. `ngx_http_gzip_filter_module.c`) — how a filter transforms the chain.

**Exercise.** Rebuild a debug binary with `--with-debug` and watch the
debug log for one proxied request; list, in order, the handler that ran at each phase.

---

### HAProxy (C, ~300k lines) — difficulty ★★★★

<https://github.com/haproxy/haproxy> · 7k★ (2026-10) · keywords: connection scheduling, health checks, SE/Linux-like config

**Why it's here.** The purest "TCP/HTTP multiplexer" codebase — every
concern is connection lifecycle, backend selection, and failover. The
scheduler and task model are exemplary systems code.

**Reading path.** `src/haproxy.c` main loops; `src/task.c` the run queue;
`src/backend.c` balancing algorithms; checkers in `src/check.c`.

**Exercise.** Add a new balancing algorithm "round-robin-2" (skip every
second backend) behind the existing config keyword system.

---

### Envoy (C++, ~1M lines) — difficulty ★★★★★

<https://github.com/envoyproxy/envoy> · 29k★ (2026-10) · keywords: filter chain, xDS, sidecar, hot restart

**Why it's here.** The modern service-mesh data plane. Reading all of it is
unrealistic; reading its *seams* is a masterclass in how a huge system stays
composable: L3/L4 vs L7 filter chains, dynamic config via xDS, and the
extension points that make a mesh sidecar possible.

**Reading path.**
1. [Life of a request](https://raw.githubusercontent.com/envoyproxy/envoy/main/docs/intro/arch_overview/intro/what_is_envoy.rst) — start from the architecture overview.
2. `source/common/network/` — connection, listener, and the filter-manager pattern.
3. Pick one L7 filter (router) — `source/common/router/router.cc`.
4. `source/common/config/` — how xDS subscriptions update the system at runtime.

**Exercise.** Trace a proxy request through the filter chain by enabling
`envoy.access_loggers.stdout` and matching log fields to the code path.

---

### Caddy (Go, ~100k lines) — difficulty ★★★

<https://github.com/caddyserver/caddy> · 78k★ (2026-10) · keywords: plugin architecture, TLS automation, ACME

**Why it's Go-plugin design in production: modules register themselves, a config turns into an app. Also the definitive real-world ACME/TLS-automation story.

**Reading path.** `cmd/caddy` — entry; `modules/caddyhttp/` — the HTTP server as a module tree; `modules/caddytls/` — certificate automation.

**Exercise.** Write a tiny HTTP handler module and register it in the config; observe the module lifecycle from provision to serve.

---

### curl (C, ~180k lines) — difficulty ★★★

<https://github.com/curl/curl> · 43k★ (2026-10) · keywords: protocol state machines, API stability, portability

**Why it's here.** Decades of disciplined API evolution and protocol
implementation on every platform. The multi-protocol state machines
(`lib/http.c`, `lib/vtls/`, `lib/url.c`) are quietly excellent.

**Exercise.** Enable `CURLOPT_VERBOSE` for an HTTPS request and map each
verbose line to the state transition in `lib/http.c`.

---

## Domain exercises

- Write a tiny epoll server that holds 10k idle connections on one thread — then explain why it works.
- Implement HTTP/1.1 keep-alive + chunked encoding from RFC 7230 without looking at reference code; then compare with nginx's parser.

## Companion materials

- *TCP/IP Illustrated Vol. 1* (Stevens) — the foundation the code assumes.
- *The C10K problem* page — why these architectures look like they do.
- Envoy's [blog posts](https://blog.envoyproxy.io/) on why it was built this way.

## Verified paths

Upstream trees checked 2026-10-10 (shallow clones): nginx@2b5c2b6, haproxy@a8639b9, envoy@47da4b2, caddy@d588d5c, curl@098d3a0.
