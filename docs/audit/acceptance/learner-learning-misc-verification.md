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
