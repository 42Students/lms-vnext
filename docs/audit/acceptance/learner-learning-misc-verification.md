# Learner Learning Misc — verification evidence

Audit: `docs/audit/pages/learner/learning-misc.md`. Protocol: `docs/orchestrator/briefs/gap-closure-lane.md`.

**Tests written but not run.** Source paths checked against current branch. Each row names an executable unit/source-contract assertion; the orchestrator will run it after merging.

| ID | Status | Implementation and test evidence |
| --- | --- | --- |
| LEARNER-learning-misc-10 | DONE | assignment failure alert/retry; `tests/unit/learner-learning-misc-gap-closure.test.ts` — named `LEARNER-learning-misc-10` test |
| LEARNER-learning-misc-14 | DONE | assignments error Retry, failure-is-not-empty; `tests/unit/learner-learning-misc-gap-closure.test.ts` — named `LEARNER-learning-misc-14` test |
| LEARNER-learning-misc-17 | DONE | quiz action labels; `tests/unit/learner-learning-misc-gap-closure.test.ts` — named `LEARNER-learning-misc-17` test |
| LEARNER-learning-misc-18 | DONE | quiz empty subtitle; `tests/unit/learner-learning-misc-gap-closure.test.ts` — named `LEARNER-learning-misc-18` test |
| LEARNER-learning-misc-20 | DONE | attempt cancellation prompt; `tests/unit/learner-learning-misc-gap-closure.test.ts` — named `LEARNER-learning-misc-20` test |
| LEARNER-learning-misc-21 | DONE | quiz success and result-release copy; `tests/unit/learner-learning-misc-gap-closure.test.ts` — named `LEARNER-learning-misc-21` test |
| LEARNER-learning-misc-30 | DONE | hour grid and all-day gutter; `tests/unit/learner-learning-misc-gap-closure.test.ts` — named `LEARNER-learning-misc-30` test |
| LEARNER-learning-misc-31 | DONE | per-course colour and tooltip; `tests/unit/learner-learning-misc-gap-closure.test.ts` — named `LEARNER-learning-misc-31` test |
| LEARNER-learning-misc-36 | DONE | attendance table columns; `tests/unit/learner-learning-misc-gap-closure.test.ts` — named `LEARNER-learning-misc-36` test |
| LEARNER-learning-misc-37 | DONE | Total/Present/Absent history; `tests/unit/learner-learning-misc-gap-closure.test.ts` — named `LEARNER-learning-misc-37` test |
| LEARNER-learning-misc-39 | DONE | calendar without extra legacy subtitle; `tests/unit/learner-learning-misc-gap-closure.test.ts` — named `LEARNER-learning-misc-39` test |

## Source present but not fully accepted

Each of these gaps also has an ID-named test in `tests/unit/learner-learning-misc-gap-closure.test.ts` demonstrating its implemented part, but the full audit requirement remains open:

- `LEARNER-learning-misc-03` — method picker and client gating are present; full faculty policy enforcement needs integration acceptance.
- `LEARNER-learning-misc-09` — browser unload warns; inline drawer discard/cancel semantics still need verified parity.
- `LEARNER-learning-misc-32` — Today/Next metrics and tooltips exist; full legacy header/popover behaviour remains to check.
- `LEARNER-learning-misc-33` — load-error Retry exists; additional schedule stale-data states remain.
- `LEARNER-learning-misc-35` — mobile agenda exists; forcing Month view and mini-calendar is incomplete.
- `LEARNER-learning-misc-38` — course-selection and error copy partly match; legacy month-empty copy still differs.
- `LEARNER-learning-misc-40` — course name-only labels now render; cross-navigation remembered selection remains open.

## Other unfinished work

`LEARNER-learning-misc-01` private object upload depends on real bucket/scanner; `-02`, `-04`, `-07`, `-11`, `-12`, `-13`, `-15`, `-16`, `-19`, `-22`, `-24`, `-25`, `-27`, `-28`, `-29`, `-34` need remaining feature/domain parity. Earlier claims for `-41` and smaller copy/response cases require independent acceptance; this document never treats missing data as success.

| LEARNER-learning-misc-13 | DONE (authored; not run) | `tests/unit/chat15-assessment-legacy-copy.test.ts` case `LEARNER-learning-misc-13`, assignment Due/Created legacy labels. |
| LEARNER-learning-misc-29 | DONE (authored; not run) | `tests/unit/chat15-assessment-legacy-copy.test.ts` case `LEARNER-learning-misc-29`, quiz pills and submitted list. |

| LEARNER-learning-misc-24 | DONE (authored, not executed) | `tests/unit/chat15-missed-quiz-release.test.ts` case `LEARNER-learning-misc-24`; quiz service/interactions and read-only review. |
| LEARNER-learning-misc-27 | DONE (authored, not executed) | `tests/unit/chat15-missed-quiz-release.test.ts` case `LEARNER-learning-misc-27`; quiz service/interactions and read-only review. |
| LEARNER-learning-misc-28 | DONE (authored, not executed) | `tests/unit/chat15-missed-quiz-release.test.ts` case `LEARNER-learning-misc-28`; quiz service/interactions and read-only review. |

| LEARNER-learning-misc-16 | DONE (source authored; test unexecuted) | `tests/unit/chat15-quiz-table-legacy.test.ts`, seven legacy table columns, safe released/not-released grade and mobile cards. |

| LEARNER-learning-misc-19 | DONE (source authored, test unexecuted) | `tests/unit/chat15-class-scope-quiz-empty.test.ts` + authoritative section membership test in learner-assessment-service, legacy no-class/failed-class states with retry. |

| LEARNER-learning-misc-34 | PARTIAL | `tests/unit/chat15-calendar-window-bounds.test.ts` and SQL overlap bounded class schedule; attendance range work outstanding. |

## Chat-15 additional bounded attendance retrieval

| ID | Status | Evidence |
|---|---|---|
| LEARNER-learning-misc-34 | DONE (calendar queries; runtime unverified) | `src/modules/academics/learner-schedule-service.ts` and `src/modules/attendance/learner-service.ts` use selected IST date windows rather than a full-history read on the calendar surfaces. `tests/unit/chat15-calendar-window-bounds.test.ts` cases `LEARNER-learning-misc-34 bounds academic schedule` and `LEARNER-learning-misc-34 bounds attendance reads`. The general attendance summary intentionally retains all enrolled deliveries and history; do not claim a bounded `/learn/attendance` summary. |
| LEARNER-learning-misc-01 | BLOCKED | Actual private object-storage bucket/malware-scanner integration is required for secure upload end-to-end. No fabricated upload success. |

| LEARNER-learning-misc-04 | DONE (source, not executed) | `src/modules/courses/assignment-submission-file-service.ts` accepts at least one validated written, HTTPS link or ready file part, checks method permissions and writes parts atomically. `src/modules/courses/assignment-method-policy.ts` no longer requires a fake file for legal mixed text/link entries. `src/components/courses/assignment-file-submission-control.tsx` exposes final confirmation even without uploaded files and passes mixed parts to one authorized POST. `tests/unit/chat15-multipart-no-file.test.ts` has two `LEARNER-learning-misc-04` cases. Requires registered 0111 migration, typecheck, Vitest and disposable database acceptance. |

| LEARNER-learning-misc-11 | PARTIAL (source, unexecuted) | `src/components/courses/learner-rich-response-editor.tsx` allows bold, italic and lists, and `learner-formatted-response.tsx` renders safe React nodes without interpreting learner HTML. This is safer formatting, not yet rich-HTML authoring parity. `tests/unit/chat15-learner-rich-response.test.ts` named test. |
| LEARNER-learning-misc-34 | SOURCE-DONE (unverified) | `src/app/(authenticated)/learn/attendance/page.tsx` now reads the selected validated IST month, constraining the SQL fetch through `getLearnerAttendanceWorkspace({window:learnerAttendanceMonthWindow(selected)})`. Attendance calendar already has the same scope, and academic schedule uses a bounded window. `tests/unit/chat15-calendar-window-bounds.test.ts` names ID and checks all three paths. |
| LEARNER-learning-misc-07 | OPEN (needs storage owner) | Legacy code/notebook/archive types are rejected by `src/modules/storage/file-policy.ts`, which belongs to the storage subsystem and is excluded from this lane by `gap-closure-lane.md`. Course-only upload validation cannot bypass signed storage grants safely. |
| LEARNER-learning-misc-12 | BLOCKED by provider configuration | Google Drive file picker/import requires provider OAuth configuration and a scoped import flow with scanning. An arbitrary Drive link is not equivalent to an imported verified private file; no fake completion. |

## chat-15 UNCONFIRMED decisions (2026-10-18)

| ID | Disposition | Evidence / rationale |
|---|---|---|
| LEARNER-learning-misc-25 | NOT-A-GAP for arbitrary legacy HTML and unsupported short-answer grading | vNext's authored schema supports validated single/multiple-choice answers, and learner prompts are rendered as escaped text. Rendering untrusted HTML or guessing short-answer grading would be less safe; richer authored questions require separate vetted schema, sanitizer and grading design. `quiz-validation.ts`, `learner-quiz-attempt.tsx`; `tests/unit/chat15-unconfirmed-decisions.test.ts` test `LEARNER-learning-misc-25 does not execute arbitrary learner-visible question HTML`. |
| LEARNER-learning-misc-41 | NOT-A-GAP (canonical route policy) | No legacy slug migration is planned for vNext. New calendar and attendance links use authorized delivery IDs, and the course route checks delivery membership before rendering. Do not translate arbitrary slug strings to another student's course. `learner-class-schedule.tsx`, `[deliveryId]/[...courseTab]/page.tsx`; `tests/unit/chat15-unconfirmed-decisions.test.ts` test `LEARNER-learning-misc-41 keeps authorized delivery IDs as canonical learner course links`. |

## Chat-3 round 13 — submission/quiz dispositions (source, tests unrun)

| ID | Status | Decision and named regression |
| --- | --- | --- |
| LEARNER-learning-misc-03 | DONE (source) | Faculty allowed-submission methods are fetched, rendered and enforced at the learner form and authorized server boundary, instead of permitting every TEXT/LINK/FILE for all assignments. `tests/unit/learner-learning-misc-gap-closure.test.ts` case LEARNER-learning-misc-03; server `assignment-method-policy.ts`. |
| LEARNER-learning-misc-04 | DONE (source) | Faculty-allowed multipart TEXT/LINK/FILE pieces use one submission, with a no-file text/link case supported without forged upload receipts. `tests/unit/chat15-multipart-no-file.test.ts` named LEARNER-learning-misc-04; production bucket safety remains a separate storage dependency. |
| LEARNER-learning-misc-22 | NOT-A-GAP | Preserve explicit unanswered confirmation and zero credit, plus jump-to-unanswered, rather than legacy's contradictory "can submit" UI + server rejection. `tests/unit/learner-learning-misc-gap-closure.test.ts` case LEARNER-learning-misc-22. |

## Chat-3 round 13 — inherited learner decisions independently reconciled

| ID | Status | Evidence / delegated safer decision |
| --- | --- | --- |
| LEARNER-learning-misc-25 | NOT-A-GAP | Do not render arbitrary rich HTML in quiz prompts or fabricate short-answer grading when the authored schema only validates choice questions. `tests/unit/chat15-unconfirmed-decisions.test.ts` has ID-named test; acceptance decision by chat-15 retained. |
| LEARNER-learning-misc-34 | DONE (source) | `src/app/(authenticated)/learn/attendance/page.tsx` bounds the query by a validated IST month; calendar and schedule use bounded windows, avoiding whole-history reads. `tests/unit/chat15-calendar-window-bounds.test.ts` named test. |
| LEARNER-learning-misc-41 | NOT-A-GAP | Preserve authorized delivery-ID URLs, not legacy arbitrary slug redirects that might resolve to someone else's course. `tests/unit/chat15-unconfirmed-decisions.test.ts` ID-named test. |

## Chat-3 round 13 — safe legacy empty and load-error text (still partial)

| ID | Status | Source and test |
| --- | --- | --- |
| LEARNER-learning-misc-33 | OPEN (improved) | Unassigned class matches exact legacy message, week-empty now says "No scheduled classes this week.", route-level failure says "Unable to load class schedule. Please try again." and offers retry. Distinct partial data-source failures remain unmodeled; `tests/unit/learner-learning-misc-gap-closure.test.ts` ID-named additional regression. |
| LEARNER-learning-misc-38 | OPEN (improved) | An unselected course, selected course with no sessions in this IST month, and route loading error now have distinct legacy titles/explanations, plus Retry. Source-specific course-list failure and independently retained stale rows require more domain work; new ID-named regression in `tests/unit/learner-learning-misc-gap-closure.test.ts`. |
