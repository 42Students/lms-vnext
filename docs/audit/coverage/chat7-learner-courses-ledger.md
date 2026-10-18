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
