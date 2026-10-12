# RETIRED: Historical six-chat operating system

**Retired by explicit user decision on 2026-10-12. DO NOT USE FOR NEW WORK.**

The former Chat 1–6 claim/assignment/checkpoint system is no longer operative. There is **one** authoritative task tracker: [docs/tracker.json](../tracker.json), with one status per task: `done:true` (DONE) or `done:false` (NOT DONE).

- Do not use worker numbers, issue #21–#26 journals, lane files, old work-queue.json, old phase-state.json, or per-chat status histories to assign work or calculate current progress.
- Use `AGENTS.md` and [the current Project instructions](chatgpt-project-instructions.md).
- Validate `docs/tracker.json` with `node scripts/tracker.mjs --check`; use `node scripts/tracker.mjs` for counts.
- Continue directly on fresh `main`, checking blob SHAs and serializing shared migration and CI edits to prevent conflicts.
- Never change NOT DONE to DONE based on drafted code or unexecuted tests. Real domain/PostgreSQL/provider acceptance remains required, and DATABASE precedes API/UI/RELEASE.

For historical reasoning, recover the pre-retirement version from Git history. **This path exists only as an explanatory redirect**, not an active policy or secondary tracker.
