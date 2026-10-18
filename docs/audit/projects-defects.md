# Projects release-blocker defect register — IIT Dharwad

The Projects module is a release-critical product. This log records defects independently found and patched by breaker lane chat-6. **Source-level tests are authored but not executed here**; fixes must pass CI and PostgreSQL integration and be reviewed by a different lane before any release sign-off.

| Defect | Severity | Evidence / adversarial failure before fix | Fix commit | Regression test | Status |
|---|---|---|---|---|---|
| PROJ-BREAK-export-01 | BLOCKER/security | `src/modules/projects/mentor-board-review-model.ts` `csvSafeCell` only checked initial ASCII whitespace. A formula prefixed with U+FEFF, U+200B or a bidi mark bypassed CSV protection. | `0ccaf9e6` | `PROJ-BREAK-export-01` | FIXED in source; CI pending |
| PROJ-BREAK-export-02 | BLOCKER/security | `src/modules/projects/learner-project-activity-csv-model.ts` repeated the same Unicode-hidden spreadsheet formula bypass. | `a4e921a0` | `PROJ-BREAK-export-02` | FIXED in source; CI pending |
| PROJ-BREAK-resilience-01 | MAJOR/availability | Learner activity CSV called `occurredAt.toISOString()` on unvalidated historical date and threw `RangeError` for invalid rows, aborting the entire download. | `e96e8831` | `PROJ-BREAK-resilience-01` | FIXED in source; CI pending |
| PROJ-BREAK-export-03 | MAJOR/scale | `mentorPendingTaskReviewCsv` wrote arbitrary row counts, had no export cap, and passed invalid `submittedAt` to `Intl.DateTimeFormat.format`. | `0ac5ac31` | `PROJ-BREAK-export-03` | FIXED in source; CI pending |
| PROJ-BREAK-export-04 | MAJOR/scale | `mentorCalendarCsv` wrote arbitrary rows and could throw for malformed stored start/end timestamps; truncated count ignored extra supplied rows. | `a65dd099` | `PROJ-BREAK-export-04` | FIXED in source; CI pending |
| PROJ-BREAK-grading-01 | BLOCKER/privacy | `getProjectEvaluation` and `listProjectEvaluations` accepted generic Project read access, including learner/observer, while `project_evaluations` has no grade-release flag. Approved delivery is not explicit rubric publication. | `089bc9cd` | `PROJ-BREAK-grading-02` | Conservative deny for learner/observer pending explicit grade-release product decision and CI |
| PROJ-BREAK-state-03 | BLOCKER/integrity | `updateProjectSubmissionDraft`, `submitProjectSubmission` and `reviewProjectSubmission` rejected ARCHIVED but not COMPLETED Project state, unlike `createProjectSubmissionDraft`. A stale tab could mutate a completed project. | `c5f024d3` | `PROJ-BREAK-state-03` | FIXED in source; CI pending |

## Hardening coverage scope and required follow-up

- Chat-6 breaker tests: `tests/unit/PROJ-BREAK-chat6-state-security.test.ts`, `tests/unit/PROJ-BREAK-chat6-export-integrity.test.ts` and subsequent state regression tests. They include negative state-machine cases, tenant/role gate structure checks, stale version/CAS assertions, IST time boundaries, upload stages and file preflight, CSV injection, bounds, grading math, notification audience and restore policy.
- PostgreSQL-backed IDOR, transaction rollback, multi-session races, actual storage generation/signed URL expiry, and full role journeys **cannot be certified** by source tests. Assign the DB tests to chat-17 harness and independent review to chat-14/chat-9/chat-13. Do not interpret this as an all-module release PASS.
- The authoritative full `docs/audit/coverage/projects-ledger.md` is owned by chat-14. Chat-6 supplies a focused supplemental coverage ledger. All 14 brief categories require whole-module coverage; this batch only checks selected functions and routes.
