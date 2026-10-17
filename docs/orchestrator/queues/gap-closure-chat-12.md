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
| TPO-students-15 | S2 | SIDE-EFFECT | UNCONFIRMED |
| TPO-students-16 | S2 | MISSING-ACTION | OPEN |
| TPO-students-17 | S2 | MISSING-ACTION | OPEN |
| TPO-students-18 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-19 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-20 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-21 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-22 | S2 | MISSING-FILTER | OPEN |
| TPO-students-23 | S2 | MISSING-FILTER | FIXED-ON-MAIN |
| TPO-students-26 | S2 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-students-28 | S2 | MISSING-COLUMN | OPEN |
| TPO-students-29 | S2 | MISSING-FIELD | OPEN |
| TPO-students-30 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-31 | S2 | MISSING-FIELD | OPEN |
| TPO-students-32 | S2 | STATE | DONE |
| TPO-students-34 | S2 | SIDE-EFFECT | OPEN |
| TPO-students-35 | S2 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-36 | S2 | MISSING-EXPORT | OPEN |
| TPO-students-54 | S2 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-13 | S3 | MISSING-ACTION | OPEN |
| TPO-students-24 | S3 | MISSING-FILTER | OPEN |
| TPO-students-25 | S3 | MISSING-FILTER | OPEN |
| TPO-students-27 | S3 | MISSING-COLUMN | FIXED-ON-MAIN |
| TPO-students-37 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-38 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-39 | S3 | MISSING-ACTION | OPEN |
| TPO-students-40 | S3 | MISSING-ACTION | FIXED-ON-MAIN |
| TPO-students-41 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-students-42 | S3 | MISSING-TAB | FIXED-ON-MAIN |
| TPO-students-43 | S3 | MISSING-TAB | OPEN |
| TPO-students-44 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-45 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-46 | S3 | COPY | DONE |
| TPO-students-47 | S3 | COPY | OPEN |
| TPO-students-49 | S3 | PERMISSION | UNCONFIRMED |
| TPO-students-50 | S3 | STATE | UNCONFIRMED |
| TPO-students-51 | S3 | RESPONSIVE | OPEN |
| TPO-students-52 | S3 | MISSING-FIELD | FIXED-ON-MAIN |
| TPO-students-R02 | S3 | STATE | FIXED-ON-MAIN |
| TPO-students-R03 | S3 | STATE | DONE |
| TPO-students-R04 | S3 | STATE | OPEN |
| TPO-students-R05 | S3 | COPY | DONE |
| TPO-students-R06 | S3 | COPY | DONE |
| TPO-students-R07 | S3 | STATE | DONE |
| TPO-students-R08 | S3 | A11Y | FIXED-ON-MAIN |
| TPO-students-48 | S4 | STATE | OPEN |
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
| TPO-requests-verification-23 | S2 | STATE | OPEN |
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
| TPO-requests-verification-28 | S3 | COPY | OPEN |
| TPO-requests-verification-29 | S3 | MISSING-FIELD | UNCONFIRMED |
| TPO-requests-verification-30 | S3 | SIDE-EFFECT | FIXED-ON-MAIN |
| TPO-requests-verification-32 | S3 | MISSING-EXPORT | FIXED-ON-MAIN |
| TPO-requests-verification-R01 | S3 | SIDE-EFFECT | DONE |
| TPO-requests-verification-R03 | S3 | SIDE-EFFECT | OPEN |
| TPO-requests-verification-16 | S4 | PERFORMANCE | OPEN |
| TPO-requests-verification-18 | S4 | STATE | OPEN |
| TPO-requests-verification-21 | S4 | PERMISSION | OPEN |

## Notes (blockers, one line each)

- TPO-students-06/07 OPEN: timed/date/N-drive debarment is wired, but bulk, student dispute/notification and true drive counting transitions are not closed; database acceptance not run.
- TPO-students-14/15 OPEN: dialog and transactional learner notification are wired; inclusion override and 48-hour opt-out, summary bell and whole-view selections still remain.
- TPO-requests-verification-01/37/38 OPEN: missing learner request kinds and recruiter REQUEST transitions require staged schema/service changes, not an external blocker.

- TPO-requests-verification-01 OPEN: expand Drizzle schema and stage proposed SQL under docs/proposed-migrations for the five missing learner kinds, then add transactional effects and tests; see docs/orchestrator/proposals/chat-12-requests-schema.md. Not a valid external-dependency BLOCKED.
- TPO-requests-verification-37 OPEN: implement persisted recruiter REQUEST workflow and trusted-company auto-approval, not merely a draft-state label. Not externally blocked.
- TPO-requests-verification-38 OPEN: drive-request bells, counts, and recruiter decision email follow the persisted approval lifecycle; no notification for ordinary drafts.
- TPO-requests-verification-05 OPEN: new-request TPO notifications exist, but 24-hour undecided-withdrawal escalation still requires the scheduled-job integration.
- TPO-students-33 OPEN: CSV preview/commit works, but legacy XLSX support and the full academic import aliases still need closing.
- GR-30/GR-31 partial: shared `apiFetch` and `useGuardedAction` are now adopted in chat-12 Students and Requests/Verification mutation controls; other mutating flows still require the guard.


- TPO-students-10 OPEN: course Assign prep (course picker, due date, skip duplicate, learner notification) is still missing.
- TPO-students-12 OPEN: scoped drive INCLUDE/EXCLUDE visibility overrides, reason and undo are still missing.
- TPO-students-34 OPEN: academic import updates need application re-evaluation, learner notice and placement-team bell.
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
