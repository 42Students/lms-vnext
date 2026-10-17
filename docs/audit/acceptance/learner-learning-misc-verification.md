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
