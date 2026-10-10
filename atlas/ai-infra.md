# AI inference infrastructure

The newest systems domain, moving fastest: LLM inference servers and
runtimes. Here systems thinking lands directly on 2024–2026 design — KV
caches, continuous batching, quantization — small enough codebases to read
whole, with a real performance wall motivating every choice.

---

### vLLM (Python/C++, ~150k lines) — difficulty ★★★

<https://github.com/vllm-project/vllm> · ~36k★ · keywords: KV cache, continuous batching, PagedAttention, speculative decoding

**Why it's here.** The reference LLM serving engine. Its core design — KV
cache pages managed like OS pages, and *continuous batching* — turned LLM
serving into a systems problem. Reading vLLM is like reading a modern mini-OS whose "processes" are requests.

**Reading path.**
1. The [PagedAttention paper](https://arxiv.org/abs/2309.06180).
2. `vllm/engine/scheduler.py` — the batching loop.
3. `vllm/core/scheduler.py` + block management — KV-cache pages, preemption, swapping.
4. Sampling and prefix caching (`prefix_caching.py`).

**Exercise.** Run vLLM with `--enable-prefix-caching`; re-send a shared
prefix and explain from the scheduler logs what got reused.

---

### llama.cpp (C/C++, ~250k lines) — difficulty ★★★

<https://github.com/ggml-org/llama.cpp> · ~80k★ · keywords: GGUF, quantization, ggml tensor lib, zero-dependency inference

**Why it's here.** One C++ file at heart — inference with no Python, no CUDA required. The `ggml` tensor library underneath and its quantized matrix kernels (Q4/Q5/Q8) teach performance engineering and portability (it runs on a phone). Design philosophy: dependencies zero, clarity first.

**Reading path.** Read `ggml.c`/`ggml-* kernels for quantized matmul; then `llama.cpp` main loop and sampling; then the `server` example.

**Exercise.** Profile prompt-processing vs token-generation; explain from the kernels why one is compute-bound and the other memory-bandwidth-bound.

---

### Ollama (Go, ~150k lines) — difficulty ★★

<https://github.com/ollama/ollama> · ~110k★ · keywords: model runner, REST server, blob store, runners

**Why it's here.** The friendliest production surface over llama.cpp-style
runners: a Go server managing model blobs, layer caching, and runner
processes. A good architectural read for "wrapping a complex library into a product."

**Exercise.** Trace a `POST /api/generate` from server to runner process and back; sketch the concurrency and streaming model.
