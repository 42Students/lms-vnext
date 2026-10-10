# W03 — Projects / Mentor closure tracker

**Lane:** W03 / Chat 3 · [issue #23](https://github.com/42Students/lms-vnext/issues/23)  
**Branch:** `main` (all W03 commits go directly to `main`, non-force)  
**Legacy FE oracle:** `42Students/lms2-fe@prod-2026 e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Legacy BE oracle:** `42Students/lms@prod-2026 21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Audit checkpoint:** 2026-10-10. This is **not** a release-ready claim.

## Database-first DB07 source reconciliation

- Legacy source candidate tables: **16**, fields: **358**.
- Fields runtime-semantic-verified: **0**. Approved retirements: **0**. Field-by-field owner ledger: `docs/planning/db07-w03-field-review.json`.
- Four source candidates had no vNext table candidate in the inventory: `project_delivery_event` (15 fields), `project_meeting_history` (15), `project_resource_audit` (15), `project_task_comment` (13). These 58 fields cannot be treated as safely retired.
- `src/db/schema/project-audit-staged.ts` and `docs/planning/sql/db07-w03-unrepresented-project-history-candidate.sql` now stage their domain structures, composite project-parent FKs and immutable audit triggers.
- **BLOCKED:** W01 must review, generate, register and replay any relevant SQL in the common Drizzle journal, reconcile snapshots and run negative cross-project SQL cases. Until then these are **source-only**, not usable tables or working comment/history workflows.
- Source candidate mappings also require legacy producer/consumer and relationship checks, not name-only matches. No legacy data backfill (greenfield).

## Implementation batches on main

| Batch | User-facing or domain job | State and evidence |
| --- | --- | --- |
| W03-M01 | Cross-project Mentor Meetings list | SOURCE_IMPLEMENTED — scoped DB query, REQUESTED/upcoming/past, timezone, URL guard, 20-row preview, loading/retry states |
| W03-M02 | Mentor Notifications attention + personal inbox | SOURCE_IMPLEMENTED_PARTIAL — project review/stalled/requested/soon derived feed, shared inbox reused; announcements and end-to-end delivery remain open |
| W03-M03 | Mentor landing + disabled Projects guards | SOURCE_IMPLEMENTED — `/mentor`, list/detail/calendar disabled states, Notifications reachable |
| W03-M04 | Meeting status CAS safety | SOURCE_IMPLEMENTED — scheduling and cancellation enforce terminal state in UPDATE predicate |
| W03-M05 | Project read/list tenancy + current role checks | SOURCE_IMPLEMENTED — live membership/role/platform checks and active project assignment |
| W03-DB07-A | Four missing audit/history/comment table candidates | DRAFT_ONLY — schema + SQL outside migration journal, no runtime writes |
| W03-DB07-B | 358-field producer/consumer proof | OPEN — 0 runtime verified |
| W03-WORKFLOW | Template → assignment → materialization → group/team → workspace → sprints/tasks → delivery/evaluation/audit | OPEN — source-side existing implementation is not final semantic, concurrency, UI or DB proof |
| W03-UI | Project-specific Learner, Mentor, College Admin, Super Admin page/tab/modal/action/state/permissions | OPEN — detailed page contracts and browser evidence incomplete |
| W03-STORAGE | Private resource attachments/uploads/downloads, retention, signed URL and malware checks | BLOCKED on W01 common storage/IAM; feature-specific access checks W03 |
| W03-E2E | Full project owner→learner→mentor→admin 7-account cross-role regressions | OPEN — no browser test execution |

## Required regression evidence

Authored in this batch:
- `tests/unit/w03-mentor-calendar.test.ts` — overdue meeting requests, active window, order, safe join URLs, derived MISSED.
- `tests/unit/w03-mentor-attention.test.ts` — review/reopen/archived/stale and meeting windows.
- Extended `tests/integration/projects-p7b-meetings.test.ts` — cross-college Mentor Calendar, disabled/suspended roles and post-cancel no-revive behavior.

**Actually executed/passing:** No repository lint, typecheck, Vitest, Postgres integration, Playwright or build evidence collected in this chat. Latest observed main GitHub Actions 'verify' failed in seconds with empty steps and no runner name, so treat CI as INFRA_BLOCKED rather than a proof of passing or failing application tests. Separate source lookups and code inspections do **not** count as executed tests.

## Next unfinished W03 items in priority order

1. Request W01 Drizzle migration review and job for missing DB07 comment/audit tables; implement their transactional producers/consumers only once schema is live or safely isolated.
2. Align Mentor sidebar's Meetings/Notifications links with legacy without W03 editing shared shell (W01 coordination).
3. Establish reliable project activity producer timestamps and personal/broad announcement notifications with W06. Prevent false stalled alerts when child activity does not update project timestamps.
4. Run real project PostgreSQL tests, negative direct SQL project/tenant constraints, typecheck/lint/unit/build, then calendar/notifications desktop+mobile browser flows.
5. Deep re-audit and close Mentor detail tabs, Learner Projects, College Admin Project workspace/admin operations and Super Admin templates/global Project operations against exact fresh oracle SHA; update their detailed checklists only with executed proof.
6. Resolve all 358 DB07 field mappings, approve or reject each disposition with source/consumer evidence and replayed constraints. Only then mark DB07 complete.

**Important:** Existing `docs/parity/mentor.md` has 64 unchecked and 5 checked retired-stub rows as of this checkpoint. None of the newly authored pages is marked deeply CLOSED merely for rendering or for unexecuted test files.
