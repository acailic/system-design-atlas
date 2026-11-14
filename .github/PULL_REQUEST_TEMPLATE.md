<!-- PR title convention: `deep-dive: <id>`, `catalog: add <id>`, or a conventional-commit prefix (fix:, docs:, site:). -->

## What this changes

<!-- One or two sentences. -->

## Checklist

<!-- Delete the section that doesn't apply. Full quality bar: CONTRIBUTING.md -->

**New or updated deep-dive**

- [ ] Commit pinned (full SHA + date) and every `file:function` landmark exists at it
- [ ] Reading path is one I walked, and it traces one complete story end to end
- [ ] Trade-offs have code evidence and a "when would this be wrong for you" verdict
- [ ] ELI10 maps onto the real mechanism; walkthrough steps use the `**Step N — Title.**` shape
- [ ] Snippets within the [LICENSES.md](../LICENSES.md) policy; no vendored upstream code
- [ ] `catalog.yaml` status, README deep-dive table, and PATTERNS.md "Seen in" lists updated

**Catalog entry**

- [ ] Scored against [contributing/CURATION.md](../contributing/CURATION.md); domain balance checked
- [ ] `why:` names the design lesson (and ties popularity to it for heavyweight tools)

**Always**

- [ ] `npm run build` run and regenerated `docs/` committed
- [ ] `npm test` passes
