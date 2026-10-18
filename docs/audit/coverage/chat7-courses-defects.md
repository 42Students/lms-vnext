# Chat-7 courses and learner hardening defects

As-of 2026-10-18. These are **source-reviewed defects and authored regression tests**, not verified green CI or real-PostgreSQL/browser acceptance. Branch: `chatgpt/chat-7-b`. Scope: learner Courses, quizzes, assignments, discussions, and Super Admin course content pages.

| Defect | Severity / impact | Fix commit and source evidence | Regression |
|---|---|---|---|
| COURSES-WEAK-DELIVERY-ROSTER-01 | S2 test false failure: matcher rejected a valid comma after `scope.academicPeriodId` despite exact SQL equality | `68d9e140`; assertion tolerates optional trailing comma while preserving the scope guard | `tests/unit/chat7-course-delivery-roster-weak.test.ts` |
| LEARNER-courses-roster-01 | S1 potential audience mismatch: learner course list lacked full offering/Section/cohort/period ancestry checks | `dd60d810`; `src/modules/courses/learner-course-service.ts` binds offering cohort and period | `tests/unit/chat7-learner-course-delivery-security.test.ts` |
| LEARNER-COURSE-ACCESS-01 | S1 potential stale role/tenant read: delivery authorization trusted a signed-in learner context without re-reading active membership role and user status | `e7f41252`; `src/modules/courses/learning-access.ts` | `tests/unit/chat7-learner-live-access-behaviour.test.ts` |
| LEARNER-COURSE-INSTRUCTORS-01 | S2 revoked faculty role could remain on a learner-facing roster | `7ca3f6e2`; persisted FACULTY role and active staff status required | `tests/unit/chat7-learner-course-delivery-security.test.ts` |
| LEARNER-COURSE-NOTICES-01 | S2 old/withdrawn Section could still appear eligible to read class notices; malformed ID could reach UUID SQL | `02f7890f`, `dde13c7d`; active Section/cohort/period plus live learner, UUID validation | `tests/unit/chat7-learner-announcements-scope.test.ts` |
| LEARNER-DISCUSSIONS-RACE-01 | S1 potential write-after-revocation during course discussion post/delete | `2ac6a6d8`; transaction-scoped persisted role, account and college lock | `tests/unit/chat7-learner-discussion-revocation-races.test.ts` |
| LEARNER-QUIZ-DRAFT-01 | S2 untrusted restored drafts accepted prototype-sensitive keys and unchecked oversized input | `117c64c2`, `f02dae5e`; bounded storage and own-property answer lookup | `tests/unit/chat7-quiz-draft-embargo-security.test.ts` |
| LEARNER-QUIZ-KEY-01 | S1 possible authored answer disclosure if shuffle input includes `correct` or other runtime properties | `6f1c0f4f`; allowlist-only learner question/option projection | `tests/unit/chat7-learner-quiz-answer-key-leak.test.ts` |
| LEARNER-LIVE-LINK-01 | S2 legacy unsafe external meeting URL could leave learner service unsanitized | `1399ddb7`; safe URL read boundary | `tests/unit/chat7-learner-media-notice-boundary.test.ts` |
| LEARNER-CARDS-CONCURRENCY-01 | S2 NaN concurrency silently hid all valid learner course cards | `c4983827`; finite bounded worker pool | `tests/unit/chat7-learner-course-card-concurrency.test.ts` |
| LEARNER-ASSESSMENTS-CLASS-01 | S2 archived/mismatched Section counted as a present current class | `205a1cbc`; active Section matching cohort and period | `tests/unit/chat7-learner-assessment-class-state.test.ts` |
| SA-academics-people-62 | S2 Super Admin content wrongly labelled visible even when Course or parent learning path was unpublished | `2b476170`, `a0bdb93b`, `0c1862c7`; full ancestor status carried into badge | `tests/unit/chat7-superadmin-effective-content-visibility.test.ts` |
| SA-academics-people-67 | S2 per-learner progress could include wrong Section eligibility/denominator and falsely mark exactly 500 rows truncated | `3f10be09`, `0f54c13a`; eligible-delivery numerator and denominator, 501 sentinel | `tests/unit/chat7-superadmin-progress-roster-security.test.ts` |

## Not closed

- `SA-academics-people-50`: new course metadata implemented, binary image/replace/delete requires provisioned private scanned storage.
- `SA-academics-people-53`: selected-course content visibility works, but native persisted whole-course student-visibility state and future-content inheritance need parity verification.
- `SA-academics-people-60`: external URL video ingestion needs SSRF-safe private download and scanner; do not pretend an HTTPS link is a completed import.
- `SA-academics-people-64/65`: direct builder, submissions, grading and result-release actions exist; full legacy modal/destructive/bulk lifecycle remains under review.
- `COURSES-WEAK-DELIVERY-ROSTER-01`: new regression logic is written but the orchestrator's published failure file predates its rerun.
- PostgreSQL concurrency, uploaded-file/scanner setup, live browser focus/mobile walkthroughs and the remaining course/exported-function coverage are not claimed complete.
