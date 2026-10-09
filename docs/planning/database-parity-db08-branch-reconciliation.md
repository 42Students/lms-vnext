# DB08 branch-to-main reconciliation — 2026-10-10

**Active development target: `main`**. Workstream being reconciled: `db08-placement-policy-outcomes-2026` / draft PR #9. The active DB08 implementation was separately authored on `db08-placement-parity-2026` and partially integrated to `main` through PR #14. No further commits should be made to the old DB08 placement-policy-outcomes branch.

## Why the old DB08 PR cannot be merged wholesale

The old branch is based on `db-parity-2026@c489b2569dd2d2742da2ee17ed313a26853dc4da`; as of this reconciliation it is 122 commits ahead and 11 behind `main` (history divergence includes unrelated DB03/DB04/central tracker work). Its DRIZZLE declarations and service contracts were written before an independent DB08 implementation was added to main.

**Merging all files would create duplicate/conflicting feature models, not converge the architecture**:

| Legacy concept | Keep canonical current `main` implementation | Superseded alternate in old PR #9 |
| --- | --- | --- |
| Placement batch | `placement_batch_lifecycles` in `src/db/schema/placement-batches.ts` | `placement_batches` in `src/db/schema/placement-db08-lifecycle.ts` |
| Registration | `placement_batch_registrations` plus events, keyed by learner+cohort in `placement-registration.ts` | `placement_registrations` keyed by learner+season |
| Eligibility change history | `placement_eligibility_events` from `placement-batches.ts` | A *second* `placement_eligibility_events` definition in `placement-eligibility-actions.ts`, incompatible columns |
| Debarment | `placement_debarments`, `placement_debarment_drive_events`, `placement_debarment_history` | Duplicate same-named tables with different columns and no history table |
| Outside offer | `placement_external_offers` with submitted/verified/rejected/revoked state in `placement-external.ts` | `placement_external_outcomes` directly inserted as verified |
| Saved jobs | `placement_saved_jobs` in `placement-external.ts` | Duplicate same-named table in `placement-saved-jobs.ts` with different timestamp name |
| Current decisions | Existing `placement_eligibility_decisions` remains authoritative | Old branch adds a `last_action_id` reference to its own incompatible header table |

**Important source fact:** Legacy `V188__placement_batches_and_eligibility.sql` says placement batches replace the placement season for learner participation. Old-branch registration coupled every learner to a vNext `placement_seasons` record; do not merge that model or its APIs into the new batch workflow. The canonical main path can still have unimplemented details; choosing it as integration target does not certify parity.

## Safe integrations directly committed on `main`

1. `src/modules/placements/access-service.ts`: explicit MEMBERSHIP > SECTION > COHORT decision precedence independent of input-chain order, reusing existing decision records.
2. `tests/unit/placement-access.test.ts`: learner/class/batch reversed-order and fallback regression test.
3. `src/modules/placements/saved-job-service.ts`: source-authored (no API route), idempotent learner save/delete/list against existing canonical `placement_saved_jobs`, gated by actual student module eligibility and current published/active learner job feed; no cross-college bookmark leakage.
4. `src/modules/placements/errors.ts`: typed `PLACEMENT_SAVED_JOB_UNAVAILABLE` code.

These are **authored, unverified source changes**, not runtime-tested features. The `placement_saved_jobs` Drizzle schema has not been journaled as a migration and must not be exposed as a route until it is replayed and authorization tests pass.

## What survives from the old branch for targeted future review

- `docs/planning/database-parity-db08-parallel-audit.md` (old branch): adverse contract and test ideas.
- `docs/planning/database-parity-db08-parallel-tracker.json` (old branch): 18 tables/280 legacy source-field candidates; 68 statically `MAPPED`, 14 explicitly `BLOCKED`, 198 `UNMAPPED`, **0 DB_TESTED, 0 WORKFLOW_VERIFIED**. These are *not* canonical main ledger statuses and may be incorrect where the old design assumes a season.
- DB08-A old tests: idempotency keys, stale undo, cross-tenant event/action FKs and actor/time restoration remain useful adversarial test requirements, **not a reason to import its incompatible event header tables**.
- DB08-C branch review: private letter receipt requirements and unified outside/on-campus held CTC evidence; main's status-bearing `placement_external_offers` is more expressive. Retain the private-object authorization and no-fake-job constraints.
- Date-based/drive-count debarment and notification/write-path concurrency tests from old branch can be translated to canonical main's debarment service, not copy-pasted with obsolete imports.

## Unfinished blockers on main (do not claim merged DB08 is fully complete)

- Main's new DB08 schema files are not yet in the active Drizzle numbered migration/journal; update and replay from fresh base after DB03/DB04 coordination, with tenant-safe raw SQL checks.
- Published API routes, learner/TPO UI consumption, module+participation gate across every relevant endpoint and external-offer private evidence review have not been end-to-end certified.
- Main's canonical field ledger has 18/280 source census, **0 verified fields**; the old ledger's 68 static suggestions must be reconciled one by one against main types and latest legacy source.
- Ensure append-only decision/undo events and registration consent audit under concurrent actions; preserve reason/name actor provenance and no silent overwritten history.
- Reconcile per-company placement cascade/held salary rules, interview-specific rescheduling, job/offer breakup and save/unsave UI.
- GitHub Actions currently reports failures on multiple branches with missing job steps/logs; this is not passing CI. Separate lint/typecheck/build/unit/Postgres integration evidence is still required.

## Operating rule from now on

Use **`main`** as requested. Fetch main's newest HEAD before every commit. Do not overwrite other DB08/DB03/DB04/DB09/DB10 agents' work, do not force-push, and use only canonical `main` schema/service names. Old draft PR #9 is **superseded rather than merged** to avoid dangerous duplicate table declarations. Close it explicitly as superseded so no later agent merges it by mistake. Complete field-level and runtime gates on main before considering DB08 parity done.
