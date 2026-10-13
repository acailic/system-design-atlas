# Contributing to the atlas

The atlas grows two ways: **catalog entries** (cheap, curated) and
**deep-dives** (expensive, evidence-based). Both go through a PR. The
quality bars differ; follow the checklist for what you're adding.

## Ground rules

- Markdown-first. The prose under `deep-dives/`, `PATTERNS.md`, and
  `catalog.yaml` is the source of truth; the GitHub Pages site under
  `docs/` is *generated from it* by `site/build.mjs` (run `npm run build`
  and commit the regenerated `docs/` in the same change — `npm run check`
  fails if it is stale).
- Never vendor, mirror, or commit upstream code into this repository.
  Clones live in `clones/` and are gitignored.
- Every factual claim in a deep-dive must be verifiable in a clone of the
  project at the pinned commit. Cite what you opened.
- English content. Upstream spellings (colour/color) follow the project
  being discussed.

## Adding a catalog entry

1. Read [`CURATION.md`](CURATION.md). Score the candidate on the four axes
   (1–5 each) against the inclusion bar defined there — including its
   reference-reading carve-out. Below the bar, it does not belong in the
   catalog — propose it in an issue instead, with what you'd fix.
2. Check domain balance: if the domain already has 3+ representatives, your
   entry must either beat an incumbent (say which, and why) or wait.
3. Append the entry to `catalog.yaml` following the documented schema.
   The `why:` paragraph is the product: one paragraph naming the design
   lesson(s) this codebase teaches unusually well. For heavyweight/popular
   tools, tie the popularity to the specific design decision that made
   them win.
4. Set `status: cataloged`. (Only existing deep-dives say `deep-dived`.)
5. PR title: `catalog: add <id>`.

## Writing a deep-dive

Deep-dives are written *from the code*, not from memory or blog posts
(though blogs help you orient — cite them under "Further reading").

### Setup: shallow clone

```bash
mkdir -p clones
git clone --depth 1 https://github.com/<org>/<repo> clones/<id>
cd clones/<id> && git rev-parse HEAD   # record this SHA in the deep-dive
```

`clones/` is gitignored — never commit upstream code. If you need history
(`git log -S`, blame), deepen selectively: `git fetch --deepen=500`.

### Checklist

1. Copy [`DEEP-DIVE-TEMPLATE.md`](DEEP-DIVE-TEMPLATE.md) to
   `deep-dives/<id>.md` (same `<id>` as the catalog entry).
2. Pin the commit: full SHA + date in the header block.
3. Walk the spine yourself before writing: find the main loop / request
   path / commit path, open every file it passes through. The reading path
   in section 6 must be a path *you walked*, in an order that builds
   understanding.
4. For each of the 2–3 trade-offs, capture `file:function` evidence. If
   you cannot point at where the code pays for the choice, it is not one
   of the defining trade-offs — pick another.
5. Snippets: ≤ 10 lines, few, attributed, upstream license named inline.
   Prefer paraphrase when prose carries the point (see
   [`LICENSES.md`](LICENSES.md)).
6. Write the **Explain like I'm 10** analogy (honest mapping to the real
   mechanism — see the template) and the **Walkthrough** steps
   (`**Step N — Title.**` paragraphs, exactly that shape — the site
   builder turns them into the step-through; anything else stays a plain
   paragraph).
7. Fill difficulty/prerequisites honestly, including an hour budget.
8. Update the catalog entry: `status: deep-dived`.
9. Add the deep-dive to the coverage list in `README.md`.
10. Cross-link `PATTERNS.md`: if the deep-dive instantiates (or adds) a
    recurring pattern, add/extend its "Seen in" pointer list.
11. Rebuild the site: `npm ci && npm run build`, commit the regenerated
    `docs/`.
12. PR title: `deep-dive: <id>`.

### Quality bar (reviewers check this)

- [ ] Every landmark citation (`file:function`) exists at the pinned
      commit — reviewers spot-check with their own shallow clone.
- [ ] The reading path is ordered to build understanding and ends having
      traced one complete story end-to-end.
- [ ] Trade-offs have evidence and a "when would this be wrong for you"
      verdict.
- [ ] "What to steal" is transferable, not a summary of features.
- [ ] The ELI10 analogy maps onto the real mechanism; the walkthrough
      steps walk the same spine as the reading path.
- [ ] Mermaid diagrams render (check on GitHub) and cite only facts the
      prose also cites.
- [ ] Snippets within policy; no vendored upstream files.
- [ ] Catalog entry and README updated.
- [ ] `npm run check` and `npm test` pass (docs/ regenerated and committed).

## Re-reviewing entries

Codebases drift. When a deep-dive is more than ~2 years old or the
upstream had an architecture change (e.g. Redis multiplexed I/O threads),
re-verify landmarks against a fresh clone, update the pinned commit, and
note the re-verification date in the header. Old insights stay; broken
pointers get fixed.
