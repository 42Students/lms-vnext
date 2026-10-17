# Gap closure queue: chat-12

Protocol: `docs/orchestrator/briefs/gap-closure-lane.md` (read it first, every round, including the Throughput section). Branch: `chatgpt/chat-12-b`. 90 gaps on 2 pages. Work page by page in the order below; inside a page go S1, S2, S3, S4. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`. One line per blocker under "Notes" at the bottom, then move on.

## tpo/students (56: FIXED-ON-MAIN 24, OPEN 29, UNCONFIRMED 3)

Audit: `docs/audit/pages/tpo/students.md` (and `students-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-students-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-students-33 | S1 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-06 | S2 | MISSING-ACTION | OPEN |
| TPO-students-07 | S2 | SIDE-EFFECT | OPEN |
| TPO-students-08 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-09 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-10 | S2 | MISSING-ACTION | OPEN |
| TPO-students-11 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-12 | S2 | MISSING-ACTION | OPEN |
| TPO-students-14 | S2 | MISSING-FIELD | OPEN |
| TPO-students-15 | S2 | SIDE-EFFECT | DONE |
| TPO-students-16 | S2 | MISSING-ACTION | DONE |
| TPO-students-17 | S2 | MISSING-ACTION | DONE |
| TPO-students-18 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-19 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-20 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-21 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-22 | S2 | MISSING-FILTER | DONE |
| TPO-students-23 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-26 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-students-28 | S2 | MISSING-COLUMN | DONE |
| TPO-students-29 | S2 | MISSING-FIELD | OPEN |
| TPO-students-30 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-31 | S2 | MISSING-FIELD | OPEN |
| TPO-students-32 | S2 | STATE | DONE |
| TPO-students-34 | S2 | SIDE-EFFECT | OPEN |
| TPO-students-35 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-36 | S2 | MISSING-EXPORT | DONE |
| TPO-students-54 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-13 | S3 | MISSING-ACTION | DONE |
| TPO-students-24 | S3 | MISSING-FILTER | DONE |
| TPO-students-25 | S3 | MISSING-FILTER | DONE |
| TPO-students-27 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-students-37 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-38 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-39 | S3 | MISSING-ACTION | DONE |
| TPO-students-40 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-41 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-students-42 | S3 | MISSING-TAB | FIXED-ON-MAIN |
| TPO-students-43 | S3 | MISSING-TAB | DONE |
| TPO-students-44 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-45 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-46 | S3 | COPY | DONE |
| TPO-students-47 | S3 | COPY | DONE |
| TPO-students-49 | S3 | PERMISSION | UNCONFIRMED |
| TPO-students-50 | S3 | STATE | NOT-A-GAP |
| TPO-students-51 | S3 | RESPONSIVE | DONE |
| TPO-students-52 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-R02 | S3 | STATE | FIXED-ON-MAIN |
| TPO-students-R03 | S3 | STATE | DONE |
| TPO-students-R04 | S3 | STATE | DONE |
| TPO-students-R05 | S3 | COPY | DONE |
| TPO-students-R06 | S3 | COPY | DONE |
| TPO-students-R07 | S3 | STATE | DONE |
| TPO-students-R08 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-students-48 | S4 | STATE | DONE |
| TPO-students-53 | S4 | MISSING-FIELD | DONE |

## tpo/requests-verification (34: OPEN 15, FIXED-ON-MAIN 18, UNCONFIRMED 1)

Audit: `docs/audit/pages/tpo/requests-verification.md` (and `requests-verification-review.md` if present; any ID: `grep -rn "<ID>" docs/audit/`). Verification file to write: `docs/audit/acceptance/tpo-requests-verification-verification.md`.

| ID | Sev | Type | Status now |
|---|---|---|---|
| TPO-requests-verification-01 | S1 | MISSING-ACTION | OPEN |
| TPO-requests-verification-02 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| TPO-requests-verification-03 | S2 | MISSING-MODAL | FIXED-ON-MAIN |
| TPO-requests-verification-04 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-requests-verification-05 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-requests-verification-07 | S2 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-requests-verification-13 | S2 | MISSING-ACTION | OPEN |
| TPO-requests-verification-22 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-requests-verification-23 | S2 | STATE | DONE |
| TPO-requests-verification-24 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-requests-verification-26 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-requests-verification-36 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-requests-verification-37 | S2 | MISSING-ACTION | OPEN |
| TPO-requests-verification-38 | S2 | SIDE-EFFECT | OPEN |
| TPO-requests-verification-R02 | S2 | MISSING-FIELD | OPEN |
| TPO-requests-verification-06 | S3 | SIDE-EFFECT | OPEN |
| TPO-requests-verification-09 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-requests-verification-10 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-requests-verification-11 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-requests-verification-12 | S3 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-requests-verification-14 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-requests-verification-15 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-requests-verification-17 | S3 | COPY | DONE |
| TPO-requests-verification-25 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-requests-verification-27 | S3 | COPY | DONE |
| TPO-requests-verification-28 | S3 | COPY | DONE |
| TPO-requests-verification-29 | S3 | MISSING-FIELD | DONE |
| TPO-requests-verification-30 | S3 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-requests-verification-32 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-requests-verification-R01 | S3 | SIDE-EFFECT | DONE |
| TPO-requests-verification-R03 | S3 | SIDE-EFFECT | OPEN |
| TPO-requests-verification-16 | S4 | PERFORMANCE | DONE |
| TPO-requests-verification-18 | S4 | STATE | OPEN |
| TPO-requests-verification-21 | S4 | PERMISSION | OPEN |

## Notes (blockers, one line each)

- TPO-requests-verification-01: registered migration 0134 has duplicate IF NOT EXISTS definitions for the general request tables; the first effective CHECK omits OFFER_ACCEPTANCE_DISPUTE, and target_key is varchar(150); a separately registered follow-up migration is required to align the sixth learner request kind, do not edit 0134.

- TPO-students-06/07 OPEN: timed/date/N-drive debarment is wired, but bulk, student dispute/notification and true drive counting transitions are not closed; database acceptance not run.
- TPO-students-14 OPEN for browser/database acceptance of reasoned INCLUDE, cross-page 200-row selection and preflight; TPO-students-15 DONE source-authored with existing 48-hour opt-out, transactional learner notice and scoped TPO summary bell.
- TPO-requests-verification-01/37/38 OPEN: missing learner request kinds and recruiter REQUEST transitions require staged schema/service changes, not an external blocker.

- TPO-requests-verification-01 OPEN: expand Drizzle schema and stage proposed SQL under docs/proposed-migrations for the five missing learner kinds, then add transactional effects and tests; see docs/orchestrator/proposals/chat-12-requests-schema.md. Not a valid external-dependency BLOCKED.
- TPO-requests-verification-37 OPEN: implement persisted recruiter REQUEST workflow and trusted-company auto-approval, not merely a draft-state label. Not externally blocked.
- TPO-requests-verification-38 OPEN: drive-request bells, counts, and recruiter decision email follow the persisted approval lifecycle; no notification for ordinary drafts.
- TPO-requests-verification-05 OPEN: new-request TPO notifications exist, but 24-hour undecided-withdrawal escalation still requires the scheduled-job integration.
- TPO-students-33 OPEN: CSV preview/commit works, but legacy XLSX support and the full academic import aliases still need closing.
- GR-30/GR-31 partial: shared `apiFetch` and `useGuardedAction` are now adopted in chat-12 Students and Requests/Verification mutation controls; other mutating flows still require the guard.


- TPO-students-10 remains OPEN (partial): real 0134 course Assign prep picker, due date, duplicate skip and learner notice now exist, but the legacy optional due-date behavior is not supported by the NOT NULL schema. The due date entered as IST is now converted without browser timezone drift.
- TPO-students-12 OPEN for live verification of implemented scoped INCLUDE/EXCLUDE/CLEAR, reason, audit and CAS undo; never clear a different staff member's later override.
- TPO-students-34 OPEN for PostgreSQL verification of implemented import-time application rechecks, review flags and scoped student/TPO notifications.
- TPO-students-49 OPEN: do not widen roster/export authorization without proving College Admin, SA and placement-team faculty role parity.

## Needs shell (chat-9 only)

- TPO-requests-verification-06, -21: chat-9 owns Requests sidebar pending-count badge and conditional Verification sidebar visibility; consult queue/access flags, never leak a denied preview.




## Round 7–11 handoff (chat-12)

- Main was fast-forwarded into `chatgpt/chat-12-b` before edits (base `14b9175c69f75ef28e9c509f6b118a592c26dbb2`). No edits were sent to main.
- Reconciled the chat-12 failures in `docs/orchestrator/unit-failures-r1.md` with the current guarded-action and `apiFetch` implementations. Added regression coverage for CSV conflict recovery, after-college 409s, safe verification failures, responsive column reset and readable empty states. **Tests authored, not run; orchestrator must execute and report failures.**
- Inspected and authored named checks for **39 originally OPEN and 2 UNCONFIRMED queue IDs** across Students and Requests/Verification; see the two `docs/audit/acceptance/*-verification.md` files. **Most of these IDs are partial, not DONE**, and queue statuses intentionally remain OPEN pending complete parity and acceptance.
- Implemented the Students URL guard for previously rejected stage, debarment, profile and academic filters; distinct Show all/Reset columns; clipboard error announcement; timed debarment range bound; modal confirmation for company shares.
- Implemented guarded ten-at-a-time same-kind learner-request decisions with per-row results; changed nullable approval notes to valid strings; corrected Requests header copy and hardened recruiter REQUEST decision UI with friendly errors and duplicate-submission guard.
- TPO-requests-verification-01 remains OPEN: drafted **proposal-only** `docs/proposed-migrations/chat-12-learner-request-kinds.sql`. It must not run until scope-safe readers, Zod discriminated payloads, per-kind transactional effects, and approved migration are delivered.
- TPO-requests-verification-13 remains OPEN in part: per-row decisions exist, but full proof-aware skips, audit per bulk run and legacy whole-view limits are not closed.
- TPO-requests-verification-37/38/R03 remain OPEN in part: persisted REQUEST, TPO bell, recruiter scope and review UI exist, but trusted auto-approval with pending-account exception, reviewed before/after diffs and recruiter decision email still need implementation.
- TPO-students-06/07/10/12/14/16/17/34/36/R03 remain OPEN in part: timed/bulk debar/notifications, course prep assignment, drive overrides, cross-page selection, academic side effects, Excel export and unified grid selection need full workflows.
- TPO-requests-verification-06/21 need shell work by chat-9 only: Requests sidebar badge and permission-aware Verification row.

## Round 12–17 checkpoint (chat-12)

- Started with an exact fast-forward from latest main and repaired three CI-reported chat-12 tests: `TPO-students-20`, `GR-90`, `TPO-requests-verification-25`.
- Verified and marked 9 fully source-supported gap rows DONE (runtime suite pending); all still-incomplete 35 OPEN rows retain named remaining work in the acceptance files, rather than being reported as closed.
- Added resume/coding-profile filters, shared page selection, scoped Debar/Lift learner notifications, in-app confirmation for bulk outcome Save/Undo, legacy Students header and empty-filter recovery.
- `TPO-students-10/12/34/36`, `TPO-requests-verification-01/37/38/R02` are substantial service/migration workflows and remain OPEN. Do not describe schema proposals or source tests as completed effects.
- Shell-only `TPO-requests-verification-06/21` still belongs to chat-9. Unit tests were authored but not run.

- TPO-students-R03 DONE (authored, runtime pending): table/mobile grid row checkboxes now use the shared selection context with bulk actions, Add to Drive and notes. TPO-students-17 still OPEN for cross-page Shift/selection behavior.

- Round 19–20: TPO-students-48/51/R04 DONE (code authored, acceptance pending); filtered and selected counts now live, phone cards show essential facts/details disclosure and two-column journey, Program/Class selector duplication removed. Tests authored, not run.

- Round-21: `TPO-requests-verification-29` DONE (source-authored; runtime acceptance pending): private reviewer detail now limits to latest 50 audit events with education and masked proof, student roll and named reviewer context. Tests authored, not run.

## Round 22–28 checkpoint (chat-12)

- Fast-forwarded `main` at `95c54aa5bf140670ac27b34c64e2320feb05bfd1` before modifications; only pushed to chatgpt/chat-12-b.
- Prior refreshed CI chat-12 failure fixes remain on main; no new chat-12 entries appeared in `unit-failures-r1.md`.
- Six OPEN gaps now DONE on source evidence: TPO-students-25, TPO-students-28, TPO-students-39, TPO-students-43, TPO-requests-verification-23, TPO-requests-verification-16. New ID tests authored but not executed.
- TPO-students-06/07 still OPEN: bulk timed Debar/Lift and learner notifications exist, but learner dispute and drive-count transition integration do not.
- TPO-students-10/12/14/17/34/36 and TPO-requests-verification-01/13/37/38/R02 still require full persisted workflows and real database acceptance; do not report them completed.

- Round 30–32: `TPO-students-22` DONE after adding independent skill-name filter, retaining name/count filters and safe server-only matching in scoped export and journey links. `TPO-students-50` NOT-A-GAP: active application already implies registration with no explicit registration row; exact rule verified by test.
- `TPO-requests-verification-R02` remains OPEN: last-resubmission audit snapshot diff + recruiter contact/access card implemented, agency status and deadline comparison not yet proven.

## Round 34–42 checkpoint (chat-12)

- Merged origin/main first by fast-forward. Source-backed DONE: TPO-students-13, TPO-students-16, TPO-students-17, TPO-students-24, TPO-students-36, TPO-requests-verification-28. Tests are authored but not executed.
- Extended masked academic/profile and per-learner readiness details; -29/-31 remain OPEN until official PG/proof/assessment parity.
- Existing first-publication `countPublishedDriveDebarments` already advances N-drive bans transactionally (`src/modules/placements/tpo-drive-publish-effects.ts`) but -06/-07 remain OPEN for the learner dispute path.
- The signed XLSX route is read-only, TPO-scoped, protects chosen row membership and limits 5,000 rows; package dependencies unchanged.
- All shell-only rows remain with chat-9; do not claim these gaps DONE from this lane.

- Round 43: TPO-requests-verification-01 remains OPEN (partial): TPO panel now shows kind-specific submitted details and safe proof links with missing-proof warning; three kinds still prohibit approve until real transactional effects are implemented. Tests authored, not run.

- Round 44 (source-only): TPO-students-47 DONE for current exact header/search, filtered empty state, counts and recoverable route error (browser stale-success fallback still requires acceptance); TPO-requests-verification-13 OPEN (partial): failed-row copying now formula-safe; bulk-run audit and proof-aware skips remain. `tests/unit/chat12-requests-bulk-copy-failed.test.ts` named `TPO-requests-verification-13` (authored, unrun). Round 44 reconciled existing selection tests to filtered cross-page behavior.

- Round 45: TPO-students-12 OPEN (partial) now supports a bounded page-scoped Show/Hide/Clear action backed by tenant-checked PUT/DELETE with named tests; exact optimistic undo and audit still require work.

- Round 46: TPO-students-34 OPEN (runtime acceptance): implemented transactionally scoped academic-import application recheck and NOW_INELIGIBLE notifications; real-Postgres before/after, concurrency and notifications tests must still execute.

- Round 47: TPO-students-12 now has expected override CAS undo of last successful bulk action and audit on SET/CLEAR in the shared service; remain OPEN pending live DB concurrency proof and true legacy visibility semantics.

- Round 48: TPO-students-14 OPEN (partial): explicit ineligible Add to Drive with audited reason and scoped transactional eligibility override; hard guards cannot be bypassed, application conflict rolls back override. Existing staff-origin 48-hour learner opt-out path is reused; live verification remains.

- Round 49: TPO-requests-verification-01 OPEN (partial): effective 0134 target-key varchar(150) bounds enforced at both learner entry and Zod boundary, while sixth OFFER_ACCEPTANCE_DISPUTE remains unsupported by the active first CHECK; additive correction proposed, not registered.

- Round 50: TPO-students-15 DONE (source-authored, runtime pending): transactional learner notices, existing 48-hour staff-add opt-out and a new batch-level summary audit/bell to the scoped TPO team. No summary emitted for zero new applications; tests unrun.

- Round 51: TPO-students-14 OPEN pending runtime acceptance: 200 cross-page selected authorized learners, server already-applied count before confirm and drive search are implemented; no mutation on preview. Named tests authored, unrun.

- Round 52: TPO-requests-verification-01 0134 conflict decision: first effective strict tables remain canonical; sixth learner kind requires proposed-only new CHECK; runtime pg_catalog guard avoids DB 500 until registered. No numbered migrations edited.
