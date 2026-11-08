# UX-G041 — College project templates and workspace journey

**State:** DOING, *not yet DONE*; owner `chat-ux-g041-workspace-20261108`.

## Verified source changes, awaiting executed acceptance
- Legacy `/college/projects/workspaces/new?templateId=...` retains a bounded
  template ID when redirecting to the canonical college team creator, without
  forwarding unrelated query or unsafe return parameters.
- Canonical create route preselects only templates returned by
  `listAssignedProjectTemplates(context,collegeId)`. Switching among the
  single/team/cohort modes retains that authorized template ID.
- Legacy workspace-directory bookmarks now preserve current PLANNED, ACTIVE,
  IN_PROGRESS, READY, BLOCKED, COMPLETED, ARCHIVED statuses, valid pagination
  and card/table view. Invalid legacy filters are dropped.
- Creator error state has retry and a back-to-workspaces exit.

## Evidence and test plan
- Local isolated TypeScript compilation succeeded for the two newly introduced
  pure redirect helpers. Their locally checked Git blob hashes match main:
  `6809b62e381ee9751fffa8b980dfc8693558bcf7` and
  `07517b12ec7549249516bcbd1f8fbb2d22e0363b`.
  Thirteen independent positive/negative cases passed in Node 22.16.
  **This is helper-only verification, not a Vitest or browser pass.**
- `tests/unit/ux-g041-college-class-workspace-handoff.test.ts`
- `tests/e2e/ux-g041-college-workspace-handoff.spec.ts` (8 desktop/mobile
  scenarios including seeded college selection, bad-template negative cases,
  learner denial and saved workspace filters)
- `.github/workflows/ux-g041-college-workspace-acceptance.yml`
- CI run (not yet verified):
  https://github.com/42Students/lms-vnext/actions/runs/42493122016

**Do not mark DONE** until the exact-SHA CI run passes, desktop/mobile
screenshots are checked, all 15 registered route-state files plus
`/college/projects/workspaces/deleted` are reviewed and verified, and
regression/security notes are recorded in `docs/tracker.json#uxReview`.
The handoff browser suite alone is not a full-group acceptance.
No authentication, tenant-scope or mutation authorization was relaxed.
