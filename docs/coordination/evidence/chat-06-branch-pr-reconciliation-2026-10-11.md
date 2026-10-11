# Chat 6 — branch and PR reconciliation (2026-10-11 IST)

**Source of truth:** `42Students/lms-vnext@main`, latest fetched baseline `d860a4e264a4913d476b66ca1004178ded4ff379`. **Owner identity:** Chat 6, issue #26. **Operating contract:** `docs/coordination/six-chat-operating-system.md`; global phase DATABASE, active task DB-008. This is a GitHub merge/source audit, **not** passing test evidence.

## Result

- **Historical W06 shared-ops work:** all **17** W06 PRs merged: #28, #30, #32, #34–#40, #44, #48, #50–#54. Audited the Git trees of all **18** retained `w06-*` branches. **Zero branch file paths missing on main.** Branch vs main blob differences reflect later edits/squash merges, not a reason to replay old branches.
- **Current Chat 6 DB-008 DATABASE work:** all **18** PRs with heads `chat6-db008-*` merged: #59, #63, #67, #69, #70, #72, #74, #75, #78, #81–#83, #86–#88, #91, #92, #94. Scanned the Git trees of all **20** retained `chat6-db008-*` branches; five removed historical paths require reconciliation (below). Recent additional DB008 work was directly committed to main and is tracked in `docs/coordination/lanes/chat-06.json` and issue #26.
- **DB10 predecessor:** old WIP PR #13 was CLOSED unmerged; main integration PR #15 was MERGED. All 15 paths from #13 are among the 16 changed paths in #15 and are present on main. Git trees of `db10-shared-operations-2026` and `db10-main-integration-2026` contain **no missing main paths**.
- **Open repository PRs as observed:** #1 (old general PR), #41/#45 (W01), #84 (DB01). **No open W06 or `chat6-db008-*` PR.** Other worker PRs have deliberately not been merged or modified in this audit.

## Old DB008 branch files not present on main

| Historical path | Evidence and current disposition |
| --- | --- |
| `scripts/sql/db02-academic-parent-enrollment-tenant-guards.draft.sql` | Explicitly removed in commit `84da8973fc03` (`db02: remove consolidated parent enrollment overlay`), following split academic/lifecycle guards. Do **not** revive the consolidated draft; PostgreSQL equivalence remains unverified. |
| `scripts/sql/db02-semester-room-contract-staging.sql` | Explicitly removed in `fbd2e374336c` (`db02: remove superseded semester room staging draft`), current staged DB02 rooms/progression contract is `scripts/sql/db02-academic-progression-and-rooms-staging.sql`. |
| `scripts/sql/db05-course-parent-integrity.draft.sql` | Created in PR #81; deduplicated by PR #82. Current canonical `scripts/sql/db05-course-parent-graph-guard.draft.sql` alongside `db05-course-parent-facets.draft.sql`. Don't introduce a second trigger. |
| `src/db/schema/lesson-content-discussions-staged.ts` | Early unregistered proposal superseded by `src/db/schema/db05-lesson-discussions.staged.ts` and `scripts/sql/db05-lesson-content-discussions.draft.sql`, with broader same-content, historical-field and tenant guards. |
| `tests/db05-lesson-discussions-contract.test.mjs` | References the superseded schema filename and older source review; current `tests/db05-lesson-discussion-inventory-evidence.test.mjs` and `tests/db05-lesson-discussion-college-scope.test.mjs` are the canonical authored tests. |

These five absent files are deliberate supersessions, **not a reason to cherry-pick old branches**. Their newer source is not yet proof of PostgreSQL/behavioral equivalence.

## Preservation and security checks

- The newer `main` outbound queue and envelope add **global email suppression HMAC** and tenant+global opt-out checks absent from old `w06-outbound-contract-20261010` blobs. Retain current main versions. Outbound provider dispatch, callback proof, replay, unsub-before-send races and encryption key management remain open; `DB10_OUTBOUND_READY` is not production authorized.
- Existing W06 shared `notification-service.ts` and `taxonomy.ts` content were compared against their source branch and retained. Staged announcements, 42 Tracker, scheduled leases and outbox migrations remain unregistered/disabled pending W01 migration promotion and real DB proof.
- The old six fixed-domain lanes are **superseded** by the global DATABASE→API→UI→RELEASE operating system. Preserve Chat 6's DB-008 claim and avoid modifying W01's migration journal, shared schema barrel, peer branches or current DB05 canonical SQL companions during this reconciliation.

## Evidence and next action

**Methods:** GitHub REST live branch/PR lists, compare histories, per-branch recursive Git trees, current canonical files, issue #26, `docs/coordination/phase-state.json`, and the Chat 6 checkpoint. No local unpublished working tree or uncommitted changes can be observed through GitHub. Source presence is not a runtime PASS.

**Decision:** No unmerged active Chat 6 changes merit blind merge. Keep the five superseded paths absent and do not overwrite newer security/tenant code. Continue DB008 source reconciliation, run independently executable Node tests, then real disposable PostgreSQL migration replay, tenant/race negatives and W01 integration. Do not inflate formally DB-verified counts. GitHub Actions billing is intentionally not an implementation blocker under the current operating plan.
