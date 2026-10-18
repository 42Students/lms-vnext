# Chat-7 learner courses module and route file inventory

Source: full recursive Git tree on `chatgpt/chat-7-b` (2026-10-18). This is a **file inventory**, not a per-export function manifest or proof of test coverage. File-level audit must enumerate every exported symbol and each HTTP verb and verify both unit and auth/tenant integration tests. A file marked not verified here may have earlier tests; it has not been rechecked.

Counts: 128 learner-prefixed course modules, 79 courses API routes; 14 named learner models directly tested in the accompanying chat-7 guard suite. Remaining in this inventory: 114 learner model files not yet verified plus all 79 API route files for integration assertions.

## Learner-prefixed course model files

| File | Current chat-7 evidence |
|---|---|
| `src/modules/courses/learner-access-guard.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-action-counts-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-active-course-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-clock-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-course-counts-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-course-query-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-course-scope-count-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-date-label-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-drawer-scope-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-empty-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-filters-active-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-flat-query.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-page-summary-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-quick-counts-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-scope-attention-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-search-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-service.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-sort-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assessment-state-filter-model.ts` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` |
| `src/modules/courses/learner-assessment-submitted-link-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assignment-confirmation-model.ts` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` |
| `src/modules/courses/learner-assignment-detail-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assignment-display.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assignment-due-notice-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assignment-file-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assignment-file-selection-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assignment-grade-label-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assignment-link-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assignment-materials-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assignment-materials-service.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assignment-methods-service.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assignment-mobile-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-assignment-notification-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-about-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-active-filters-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-announcements-service.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-card-date-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-card-due-label-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-card-media-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-card-next-label-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-card-progress-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-card-search-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-continue-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-copy-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-credit-summary-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-current-period-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-date-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-drilldown-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-drilldown-service.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-file-reference-service.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-filtered-empty-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-home-action-label-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-home-completion-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-image-reset-key-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-instructor-labels-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-list-concurrency-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-next-action-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-overdue-link-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-overview-mobile-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-overview-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-path-preview-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-preferred-period-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-progress-filter-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-result-summary-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-semester-filter-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-service.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-setup-copy.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-setup-service.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-sort-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-tab-context-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-tab-route-model.ts` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` |
| `src/modules/courses/learner-course-term-state-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-type-availability-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-course-upcoming-quiz-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-discussion-capability-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-discussion-history-flight-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-discussion-message-limit-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-discussion-refresh-order-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-discussion-reply-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-discussion-response-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-discussion-scope-key-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-discussion-submit-guard-model.ts` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` |
| `src/modules/courses/learner-discussion-time-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-external-content-link-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-file-action-cancel-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-latest-quiz-attempt-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-live-link-availability-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-manual-completion-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-offering-delivery-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-overview-priority.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-playback-settings.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-program-semester-options-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-progress-availability.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-quiz-answer-edit-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-quiz-answer-progress-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-quiz-autosave-scope-model.ts` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` |
| `src/modules/courses/learner-quiz-clock-interval-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-quiz-correctness-visibility-model.ts` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` |
| `src/modules/courses/learner-quiz-deadline-display-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-quiz-deadline-warning-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-quiz-draft-scope-model.ts` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` |
| `src/modules/courses/learner-quiz-draft.ts` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` |
| `src/modules/courses/learner-quiz-empty-question-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-quiz-history-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-quiz-mobile-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-quiz-question-nav-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-quiz-refresh-failure-model.ts` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` |
| `src/modules/courses/learner-quiz-request-race-model.ts` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` |
| `src/modules/courses/learner-quiz-response-id-model.ts` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` |
| `src/modules/courses/learner-quiz-return-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-quiz-review-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-quiz-review-question-availability-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-quiz-route-scope-model.ts` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` |
| `src/modules/courses/learner-quiz-shuffle-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-quiz-submission-receipt-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-quiz-submit-deadline-model.ts` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` |
| `src/modules/courses/learner-recent-course-activity-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-roadmap-dialog-key-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-roadmap-empty-state-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-roadmap-filter-recovery-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-roadmap-focus-filter-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-roadmap-headline-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-roadmap-item-focus-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-roadmap-mobile-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-roadmap-progress-availability-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-storage-ui-model.ts` | Not yet verified by chat-7 |
| `src/modules/courses/learner-submission-flight-model.ts` | `tests/unit/chat7-learner-quiz-discussion-guard-coverage.test.ts` |
| `src/modules/courses/learner-video-grant-model.ts` | Not yet verified by chat-7 |

## Courses API route files (handlers requiring explicit audit)

| File | Status |
|---|---|
| `src/app/api/courses/[courseId]/display/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/[courseId]/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignment-submission-files/[fileId]/download-grant/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignment-submissions/[submissionId]/file/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignment-submissions/[submissionId]/files/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignment-submissions/[submissionId]/grade/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignment-submissions/[submissionId]/links/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignment-submissions/[submissionId]/publish/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignment-submissions/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignments/[assignmentId]/methods/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignments/[assignmentId]/my-submission/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignments/[assignmentId]/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignments/[assignmentId]/submission-files/[fileId]/complete/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignments/[assignmentId]/submission-files/[fileId]/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignments/[assignmentId]/submission-files/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignments/[assignmentId]/submit-files/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignments/[assignmentId]/submit/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignments/[assignmentId]/transition/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/assignments/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/college-content-visibility/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/college-lesson-visibility/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/college/assignments/[deliveryId]/submissions/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/college/learner-progress/export/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/deliveries/[deliveryId]/assignments/[assignmentId]/materials/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/deliveries/[deliveryId]/discussions/[messageId]/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/deliveries/[deliveryId]/discussions/faculty-reply/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/deliveries/[deliveryId]/discussions/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/deliveries/[deliveryId]/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/deliveries/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/faculty/assignments/[deliveryId]/command/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/faculty/assignments/[deliveryId]/methods/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/faculty/assignments/[deliveryId]/submissions/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/faculty/attendance/[deliveryId]/schedule/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/faculty/gradebook/[deliveryId]/csv/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/faculty/live-classes/[deliveryId]/command/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/faculty/quizzes/[deliveryId]/command/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/faculty/reports/[kind]/[assessmentId]/csv/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/faculty/reports/quiz/[quizId]/question-csv/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/faculty/response-followups/csv/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/faculty/results/csv/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/learner/due-notices/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/learner/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/learner/workspace/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/learning-paths/[learningPathId]/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/learning-paths/[learningPathId]/transition/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/learning-paths/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/lesson-contents/[contentId]/materials/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/lesson-contents/[contentId]/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/lesson-contents/[contentId]/transition/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/lesson-contents/order/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/lesson-contents/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/lessons/[lessonId]/learner-videos/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/lessons/[lessonId]/restore/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/lessons/[lessonId]/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/lessons/[lessonId]/videos/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/lessons/reorder-all/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/lessons/reorder/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/lessons/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/offerings/[offeringId]/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/offerings/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/progress/[contentId]/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/quiz-attempts/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/quizzes/[quizId]/faculty-results/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/quizzes/[quizId]/my-attempts/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/quizzes/[quizId]/results/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/quizzes/[quizId]/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/quizzes/[quizId]/submit/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/quizzes/[quizId]/transition/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/quizzes/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/teaching-assignments/[assignmentId]/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/teaching-assignments/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/videos/[videoId]/complete/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/videos/[videoId]/playback-grant/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/videos/[videoId]/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/videos/[videoId]/thumbnail/complete/route.ts` | HTTP handler verification still required |
| `src/app/api/courses/videos/[videoId]/thumbnail/route.ts` | HTTP handler verification still required |

## Acceptance still pending
- Extract each named export and its public behaviour from the above sources; mark each test by the exact exported function.
- Test allowed and forbidden tenancy, missing session/college context, bad inputs, server errors, concurrency and idempotency for each HTTP verb handler.
- Run TypeScript, unit suite, integration and mobile browser flows. No runner is available in this connector-only environment, so no pass claim is made.

## Follow-up verified-by-source subset, 2026-10-18

The initial "not yet verified" table above is a baseline inventory rather than a live test-run tracker. The following files gained new **authored** behavior coverage, but no cloud CI or live PostgreSQL pass was performed:

| File | Behavioral source/test evidence |
|---|---|
| `learner-course-file-reference-service.ts` | `chat7-learner-course-file-embargo.test.ts`: active learner/delivery access, published ancestry, scheduled-media embargo via DB clock |
| `learner-quiz-review-model.ts` | `chat7-learner-quiz-review-inherited-answers.test.ts`: own-only browser answers, removed options, no answer-key disclosure |
| `learner-assignment-materials-service.ts` | `chat7-learner-assignment-materials-service.test.ts`: learner publication and delivery scope before optional table probe, safe links |
| `learner-assignment-materials-model.ts`, `learner-assignment-file-selection-model.ts` | `chat7-learner-course-material-link-safety.test.ts`: strict HTTPS link and early unsupported file guard |
| `learner-course-service.ts`, `learner-quiz-result-release-policy.ts` | `chat7-learner-course-quiz-release-consistency.test.ts`: deadline + closure + author publication all required in workspace projection |
| `learner-quiz-draft.ts`, `learner-quiz-draft-scope-model.ts` | `chat7-quiz-draft-embargo-security.test.ts`: oversize and prototype-poisoned session values rejected, stale options discarded |
| `learner-course-announcements-service.ts` | `chat7-learner-announcements-scope.test.ts`: current persisted learner and matching active Section |
| `learner-course-list-concurrency-model.ts` | `chat7-learner-course-card-concurrency.test.ts`: stable card order, eight-worker cap, nonfinite limits |
| `learner-assessment-flat-query.ts`, `learner-assessment-service.ts` | `chat7-learner-assessment-feed-privacy.test.ts`, `chat7-learner-assessment-class-state.test.ts`: private grade masking, quiz release, authorized class filter |
| `learner-live-link-availability-model.ts`, `learner-video-grant-model.ts` | `chat7-learner-media-notice-boundary.test.ts`: safe meeting URL and renewal timing |

HTTP route audited: `/api/courses/deliveries/[deliveryId]/contents/[contentId]/file` via `chat7-learner-course-file-route-boundaries.test.ts`. Other 78+ course route handlers remain to be individually certified, as do many model exports. Do not interpret this partial update as an exhaustive manifest or passing test run.
