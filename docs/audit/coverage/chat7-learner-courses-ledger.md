# Chat-7 courses / learner behaviour ledger — active coverage slice

Scope: `src/modules/courses/learner-*` pure guards plus quiz/assignment client safety. Master requirement is **every exported function and API handler**, including PostgreSQL integration coverage. This is a **partial ledger**, not a claim of full completion for the 336 files under `src/modules/courses/`.

Test A: `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` (14 behavioural cases, all deterministic 2099 timestamps).
Test B: `tests/unit/GR-chat7-quiz-friendly-errors.test.ts` (2 user-visible safe-failure regressions).
Additional UI: `tests/unit/UX-courses-learner-quiz-table-01.test.ts`, `UX-courses-faculty-roster-attendance-tables-01.test.ts`, `UX-learn-attendance-month-01.test.ts`.

| Exported service/model function (file under `src/modules/courses/`) | Behavioural test | Cases asserted |
|---|---|---|
| `learnerQuizSubmitDeadlineOpen` — learner-quiz-submit-deadline-model.ts | Test A `UX-quiz-deadline-01` | Before/equal/after deadline, no due, invalid time |
| `learnerQuizDraftCanPersist` — learner-quiz-autosave-scope-model.ts | Test A `UX-quiz-scope-02` | Active matching quiz; stale route, no quiz, loading, review, empty key |
| `learnerQuizRouteScopeCurrent` — learner-quiz-route-scope-model.ts | Test A `UX-quiz-scope-02` | Same, different or unloaded scope |
| `canReviewLearnerQuizCorrectAnswers` — learner-quiz-correctness-visibility-model.ts | Test A `UX-quiz-permission-03` | Four published/attempt-visibility combinations |
| `learnerDiscussionMayPost` — learner-discussion-submit-guard-model.ts | Test A `UX-discussion-post-04` | Authorized content, empty input, forbidden role, double submit |
| `createSubmissionFlightGuard` — learner-submission-flight-model.ts | Test A `UX-learner-submit-flight-05` | First submit, overlapping submit, unlock after completion |
| `learnerCourseTabPath` — learner-course-tab-route-model.ts | Test A `UX-course-tab-route-06` | Known route, empty/invalid/deep descendant |
| `learnerQuizRequestCurrent` — learner-quiz-request-race-model.ts | Test A `UX-quiz-request-race-07` | Missing/valid/aborted signal |
| `learnerQuizRefreshFailureMessage` — learner-quiz-refresh-failure-model.ts | Test A `GR-quiz-read-01`; Test B | Safe refresh failure, successful POST followed by failed GET |
| `learnerAssignmentFinalConfirmation` — learner-assignment-confirmation-model.ts | Test A `UX-assignment-final-08` | Typed/link irreversible confirmation |
| `parseLearnerQuizDraft` — learner-quiz-draft.ts | Test A `UX-quiz-draft-09` | Browser corruption, de-duplication, valid/invalid step, wrong types |
| `normalizeLearnerQuizDraftForQuestions` — learner-quiz-draft-scope-model.ts | Test A `UX-quiz-draft-scope-10` | Foreign question/option filtering, single/multiple choices, empty current quiz |
| `requireLearnerQuizResponseId` — learner-quiz-response-id-model.ts | Test A `UX-quiz-response-id-11` | Valid same UUID, cross-quiz payload, invalid/missing ID |
| `learnerAssessmentMatchesState` — learner-assessment-state-filter-model.ts | Test A `UX-assessment-filter-12`, `-13` | Assignments and quizzes: each state, time boundaries, release scope and invalid filter |
| `friendlyApiError` — `src/lib/friendly-error.ts` | Test B `GR-quiz-read-01` | 403 and 500 do not echo untrusted code |

Route handlers and database-backed functions not yet mapped are outstanding. These tests were authored but **not executed**; local checkout/TypeScript/PostgreSQL runner unavailable in this session. Do not interpret source-level tests as runtime or tenancy guarantees.

## Additional direct model matrices (not included in initial 14-row table)

`tests/unit/chat7-learner-course-discussion-coverage.test.ts` adds nine direct discussion and one component contract cases:
- `learnerDiscussionCanPost`: only explicit boolean true authorizes posting.
- `createLearnerDiscussionHistoryFlight`: overlapping pagination blocked, retry unlocked.
- `learnerDiscussionDraftValid` / `LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH`: nonempty trimmed text, exact 3900-character limit.
- `learnerDiscussionRefreshIsCurrent`: latest safe integer only; out-of-order, fractional and zero denied.
- `formatDiscussionReply`: scoped reply marker vs top-level text.
- `learnerDiscussionListResponse`: authorized pins and paging forwarded; extra internal fields dropped.
- `learnerDiscussionScopeKey`: valid delivery UUID only.
- `learnerDiscussionTimeLabel` / `learnerDiscussionRelativeTimeLabel`: invalid timestamps, IST and minute/hour/day boundaries.
- `src/components/courses/learner-course-discussion.tsx`: reader uses actual draft, permission and anti-race guards.

`tests/unit/chat7-learner-course-list-model-coverage.test.ts` adds fourteen deterministic learner course listing/discovery cases:
- `learnerCourseHasActiveFilters`: search, type, progress, term, continue, sort.
- `learnerCourseMatchesSearch`: course/instructor/semester metadata, invalid query normalization.
- `learnerCourseCardNextLabel`: read-only, unpublished, overdue, quiz, assignment, content and completed.
- `learnerCourseCardProgress`: no denominator, NaN, nonfinite, lower/upper clamp.
- `learnerCourseHasContinueAction`: active published path with real action.
- `learnerCourseFilteredEmptyTitle`: all filter-based empty recovery copies.
- `learnerCourseMatchesProgress`: tracked counts across all result states.
- `sortLearnerCourseCards`: regular-before-elective, name, progress, due, recent and invalid mode.
- `learnerCourseMatchesTermState`: server authoritative readOnly rather than browser date.
- `resolveLearnerCourseTypeFilter`: reset vanished elective/core options.
- `learnerCourseTabPersistentQuery`: omit route-only filters; cap value and key count.
- `learnerCourseCreditSummary`: ignore negative, missing and nonfinite credits.
- `resolveLearnerCoursePeriod`: prefer only authorized available semester.
- `learnerCourseImageResetKey`: delivery/image scoped reset, no previous course state.

The combined direct model pass now exercises **37 exported learner-model functions** across quizzes, assignments, discussions and course listing. The inventories at `docs/audit/coverage/chat7-learner-course-file-inventory.md` still show 128 learner-prefixed files and 79 API routes. Other exports and integration paths remain **not verified**.

## Certificate feature inventory

A recursive repository path search for `certificat` returned only two faculty profile certification *test* files and **no `src/modules/courses/` certificate source or dedicated course certificate route**. This is an implementation/ownership gap, not evidence the feature exists or is tested; clarify parity requirements before authoring artificial passing certificate tests.
