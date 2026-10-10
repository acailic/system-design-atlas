# Contributing to System Design Atlas

Good contributions are welcome. This is a curated curriculum — entries earn
their place by teaching, not by being famous.

## What makes a good entry

An entry must have all four:

1. **A real reading path** — named files in reading order, not "explore
   the repo." Verify paths against a current clone before submitting.
2. **A concrete exercise** — something a learner can actually do in an
   afternoon that proves comprehension.
3. **At least one companion resource** — book chapter, paper, or official
   internals doc.
4. **A "why it teaches system design" claim** that names the transferable
   concepts, not just the project's virtues.

## Rules

- **Verify against upstream.** File paths, line counts (ballpark is fine),
  and companion links must be accurate at time of submission. Note the
  approximate date or commit you verified against.
- **No paywalled or abandoned projects.** Public source, active maintenance.
- **Respect difficulty ceilings.** Only giant repos rated ★★★★★; even
  then the entry must describe seams/docs, not demand a full read.
- **Neutral voice.** Opinions about design trade-offs, not endorsements
  for adoption decisions.
- **Markdown lints clean.** Wrap tables and links consistently.

## Suggested additions (open)

- Networking: WireGuard implementation, QUIC libraries (quiche/quinn).
- Storage: ScyllaDB/Cassandra, ClickHouse (specific subsystem entry points).
- Distributed: Tempo? (probably skip — prefer classic systems over new tools).
- Editors: helix.

## Format

Follow the template in any `atlas/*.md` file:

```markdown
### Name (language, ~Nk lines) — difficulty ★N

<link> · <concept keywords>

**Why it's here.** <transferable lessons>

**Reading path.**
1. `path/to/file.c` — <what it shows>

**Exercise.** <doable task>

**Companions.** <books/papers/docs>
```

## Licensing

By contributing you agree to license your contribution under the repo MIT
license.
