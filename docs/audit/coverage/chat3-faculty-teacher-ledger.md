# Chat-3 Faculty/Teacher — verified source coverage ledger (Pass B, first wave)

This is the **tested-function ledger for the focused model suite**, not a claim that every Faculty service or API route is covered. Each row names the exported behavior and its specific test case. The master queue's PostgreSQL-backed test requirement and full service/route ledger cannot be completed through GitHub-only editing; the orchestrator must run tests against its prepared DB. Do not mark the overarching master-queue item DONE from this file alone.

| Module | Exported function or schema | Test file | Case IDs | Behaviours asserted |
|---|---|---|---|---|
| `src/modules/attendance/faculty-marking-window.ts` | `facultyAttendanceMarkingWindow` | `tests/unit/chat3-faculty-attendance-exhaustive-r1.test.ts` | FAC-ATT-01/02 | time boundaries and fail-closed policy |
| `src/modules/attendance/faculty-correction-token-model.ts` | `facultyAttendanceCorrectionTokenMatches` | `tests/unit/chat3-faculty-attendance-exhaustive-r1.test.ts` | FAC-ATT-03 | exact persisted millisecond token and unmarked missing token |
| `src/modules/attendance/faculty-correction-token-model.ts` | `facultyAttendanceNextMarkedAt` | `tests/unit/chat3-faculty-attendance-exhaustive-r1.test.ts` | FAC-ATT-04 | strict monotonic markedAt |
| `src/modules/attendance/faculty-schedule-mutation-model.ts` | `facultyAttendanceScheduleSchema` | `tests/unit/chat3-faculty-attendance-exhaustive-r1.test.ts` | FAC-ATT-05 | confirmed CREATE/RESCHEDULE, shape, UUID and time ordering |
| `src/modules/attendance/faculty-schedule-mutation-model.ts` | `facultyScheduleFieldsChanged` | `tests/unit/chat3-faculty-attendance-exhaustive-r1.test.ts` | FAC-ATT-06 | no-op versus meaningful metadata/instant delta |
| `src/modules/attendance/faculty-schedule-mutation-model.ts` | `facultyScheduleErrorMessage` | `tests/unit/chat3-faculty-attendance-exhaustive-r1.test.ts` | FAC-ATT-07 | whitelisted friendly errors |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyPublishedGradeRows` | `tests/unit/chat3-faculty-gradebook-exhaustive-r1.test.ts` | FAC-GRADE-01 | roster isolation, invalid points, deduplication and unknown status |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyPublishedLearnerBreakdown` | `tests/unit/chat3-faculty-gradebook-exhaustive-r1.test.ts` | FAC-GRADE-02 | single learner breakdown and private evidence |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookViewQuerySchema` | `tests/unit/chat3-faculty-gradebook-exhaustive-r1.test.ts` | FAC-GRADE-03 | search length and page limits |
| `src/modules/courses/faculty-gradebook-model.ts` | `paginateFacultyGradebookRows` | `tests/unit/chat3-faculty-gradebook-exhaustive-r1.test.ts` | FAC-GRADE-03 | natural roll sort, bounded paging and filters |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookViewHref` | `tests/unit/chat3-faculty-gradebook-exhaustive-r1.test.ts` | FAC-GRADE-03 | scope-preserving encoded URL |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookCsv` | `tests/unit/chat3-faculty-gradebook-exhaustive-r1.test.ts` | FAC-GRADE-04 | 500-row cap and formula neutralization |
| `src/modules/courses/faculty-route-access-model.ts` | `canAccessFacultyRoute` | `tests/unit/chat3-faculty-scope-matrix-r1.test.ts` | FAC-SCOPE-01/02 | faculty versus learner/mentor/admin, inactive/other-tenant read denied |
| `src/modules/courses/faculty-assessment-route-boundary.ts` | `parseFacultyAssessmentReportRoute` | `tests/unit/chat3-faculty-scope-matrix-r1.test.ts` | FAC-SCOPE-03 | strict route UUID and search query |
| `src/modules/courses/faculty-assessment-route-boundary.ts` | `facultyAssignmentReportHidden` | `tests/unit/chat3-faculty-scope-matrix-r1.test.ts` | FAC-SCOPE-04 | private 404 on cross-scope assignment |
| `src/modules/courses/faculty-assessment-route-boundary.ts` | `facultyQuizReportHidden` | `tests/unit/chat3-faculty-scope-matrix-r1.test.ts` | FAC-SCOPE-04 | private 404 on cross-scope quiz |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentCommandSchema` | `tests/unit/chat3-faculty-authoring-mutations-r1.test.ts` | FAC-AUTH-01 | confirmed authoring transitions and strict shape |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentEditLockedBySubmissions` | `tests/unit/chat3-faculty-authoring-mutations-r1.test.ts` | FAC-AUTH-02 | only title mutable with submissions |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `assignmentFieldsChanged` | `tests/unit/chat3-faculty-authoring-mutations-r1.test.ts` | FAC-AUTH-03 | no-op detection |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentMethodsChanged` | `tests/unit/chat3-faculty-authoring-mutations-r1.test.ts` | FAC-AUTH-03 | method order canonicalization |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentVersionMatches` | `tests/unit/chat3-faculty-authoring-mutations-r1.test.ts` | FAC-AUTH-03 | optimistic token precision |
| `src/modules/courses/faculty-assignment-grading-policy.ts` | `facultyAssignmentGradingAllowed` | `tests/unit/chat3-faculty-authoring-mutations-r1.test.ts` | FAC-AUTH-04 | grading bound and status |
| `src/modules/courses/faculty-assignment-grading-policy.ts` | `facultyAssignmentGradePublicationAllowed` | `tests/unit/chat3-faculty-authoring-mutations-r1.test.ts` | FAC-AUTH-04 | published & graded only |
| `src/modules/courses/faculty-grade-noop-model.ts` | `facultyGradeHasChanges` | `tests/unit/chat3-faculty-authoring-mutations-r1.test.ts` | FAC-AUTH-04 | grade idempotency and trimmed feedback |
| `src/modules/courses/faculty-live-mutation-model.ts` | `facultyLiveMutationSchema` | `tests/unit/chat3-faculty-authoring-mutations-r1.test.ts` | FAC-LIVE-01/02 | HTTPS host allowlist, confirmed transitions, quarter hour and duration |
| `src/modules/courses/faculty-live-mutation-model.ts` | `facultyLiveWindow` | `tests/unit/chat3-faculty-authoring-mutations-r1.test.ts` | FAC-LIVE-03 | legacy academic period independence and valid window |
| `src/modules/courses/faculty-live-lock-model.ts` | `facultyLiveDeliveryLockKey` | `tests/unit/chat3-faculty-authoring-mutations-r1.test.ts` | FAC-LIVE-03 | per-delivery lock namespace |
| `src/modules/attendance/faculty-schedule-errors.ts` | `mapFacultyScheduleInsertError` | `tests/unit/chat3-faculty-authoring-mutations-r1.test.ts` | FAC-LIVE-04 | registered overlap constraints map to 409 domain conflict |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyChangeQuizChoiceType` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-01 | single vs multiple choice selection |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyToggleQuizAnswer` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-02/03 | zero/all correct guards |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyRemoveQuizOption` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-04 | two-option minimum and valid answer |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyRemoveQuizQuestion` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-05 | one-question minimum |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyAppendQuizQuestion` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-05 | 100-question cap |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizDraftEditable` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-06 | published quiz bank sealed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizMetadataEditable` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-06 | metadata edit across states |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizDraftLoadAllowsAction` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-07 | bank load failure blocks edit/publish |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizCanPublishSavedDraft` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-07 | no unsaved/failed bank publish |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizConfirmationAfterEdit` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-08 | confirmation revision binding |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizSwitchNeedsConfirmation` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-08 | unsaved quiz switch |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyBeginQuizWrite` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-08 | synchronous double-click lock |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizWriteMessage` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-09 | safe stale/internal messaging |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizCanRetryDetails` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-09 | retry only when possible |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizCanSaveChanges` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-09 | dirty/locked status rules |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyDuplicateQuizOption` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-10 | cloned answer unselected |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizCopyTitle` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-10 | bounded clone title |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizCanCopyToDraft` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-10 | local authorized copy |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizDraftIssue` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-11 | invalid title/points rejected |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizMetadataIssue` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-11 | metadata length validation |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizSavedFromCommand` | `tests/unit/chat3-faculty-quiz-exhaustive-r1.test.ts` | FAC-QUIZ-11 | strict persisted response guards |

| `src/modules/courses/faculty-gradebook-service.ts` | `getFacultyPublishedGradebook` | `tests/unit/chat3-faculty-gradebook-service-permissions.test.ts` | FAC-GRADE-SERVICE-01..05,07 | actual service mocked collaborators: wrong-role/disabled/suspended denial before reads, strict path input, roster-only published assignment and quiz score privacy, 101-assessment boundary |
| `src/modules/courses/faculty-gradebook-service.ts` | `getFacultyPublishedGradebookLearner` | `tests/unit/chat3-faculty-gradebook-service-permissions.test.ts` | FAC-GRADE-SERVICE-06 | exact roster membership, foreign-learner private error, source-visible scores only |
| `src/modules/courses/faculty-assignment-request-body.ts` | `facultyAssignmentAcceptsContentType`, `readFacultyAssignmentCommandBody`, `FacultyAssignmentBodyError` | `tests/unit/chat3-faculty-assignment-body-route.test.ts` | FAC-assignment-body-01 | actual bounded UTF-8 streaming/declared length, JSON media type, malicious oversized/invalid/empty payload, safe typed errors |
| `src/app/api/courses/faculty/assignments/[deliveryId]/command/route.ts` | `POST` | `tests/unit/chat3-faculty-assignment-body-route.test.ts` | FAC-assignment-body-02 | same-origin checked before auth, authenticated context forwarded, bounded JSON before mutation, user-safe 400/413/415, unexpected service exceptions handled centrally |
| `src/app/api/courses/faculty/gradebook/[deliveryId]/csv/route.ts` | `GET` | `tests/unit/chat3-faculty-gradebook-http-route.test.ts` | FAC-GRADE-HTTP-01 | HTTP headers, CSV formula escaping, no learner contact fields, strict delivery ID before context, private denied response, 500-row cap and omission label |

| `src/modules/courses/faculty-quiz-request-body.ts` | `readFacultyQuizCommandBody` | `tests/unit/chat3-faculty-quiz-transport-errors.test.ts` | FAC-QUIZ-TRANSPORT-01 | strict decimal content-length, 16 MiB declared/stream cap and valid UTF-8 JSON |
| `src/app/api/courses/faculty/quizzes/[deliveryId]/command/route.ts` | `POST` | `tests/unit/chat3-faculty-quiz-transport-errors.test.ts` | FAC-QUIZ-TRANSPORT-02 | CSRF before auth, 400/413/415 with safe action message/request-ID, no write on parser failure, safe business denial |
| `src/modules/courses/faculty-authoring-request-body.ts` | `readFacultyAuthoringBody` | `tests/unit/chat3-faculty-authoring-body-routes.test.ts` | FAC-HTTP-BODY-01 | 128KiB streamed metadata, declared cap, strict JSON media/UTF-8, invalid/empty payload denial |
| `src/app/api/courses/faculty/live-classes/[deliveryId]/command/route.ts` | `POST` | `tests/unit/chat3-faculty-authoring-body-routes.test.ts` | FAC-HTTP-BODY-02 | same-origin before context, authenticated delegated actor, bounded body, safe 400/413/415 and canonical service errors |
| `src/app/api/courses/faculty/attendance/[deliveryId]/schedule/route.ts` | `POST` | `tests/unit/chat3-faculty-authoring-body-routes.test.ts` | FAC-HTTP-BODY-02 | same-origin before context, authenticated delegated actor, bounded body, safe 400/413/415 and canonical service errors |
| `src/modules/courses/faculty-assessment-filter.ts` | `filterFacultyAssessments` | `tests/unit/chat3-faculty-content-navigation-csv-boundaries.test.ts` | FAC-BOUNDS-01 | delivery/status/search filtering only over authorized records, no source mutation |
| `src/modules/courses/faculty-content-order-ui-model.ts` | `facultyMoveContentId`, `facultyContentOrderDirty`, `facultyContentOrderValid`, `facultyResetContentOrder`, `facultyContentOrderReceiptMatches` | `tests/unit/chat3-faculty-content-navigation-csv-boundaries.test.ts` | FAC-BOUNDS-02 | immutability, boundaries, no duplicates/foreign IDs, saved receipt must match ordered Section |
| `src/modules/courses/faculty-notification-link-model.ts` | `facultyNotificationActionHref` | `tests/unit/chat3-faculty-content-navigation-csv-boundaries.test.ts` | FAC-BOUNDS-03 | internal teacher URL allowlist, no untrusted external/encoded traversal/control links |
| `src/modules/courses/faculty-quiz-question-csv.ts` | `facultyQuizQuestionAccuracyCsv` | `tests/unit/chat3-faculty-content-navigation-csv-boundaries.test.ts` | FAC-BOUNDS-04 | 500 question cap, formula neutralization and correct omission disclosure |
| `src/modules/courses/faculty-report-csv-request.ts` | `facultyReportCsvHref`, `parseFacultyCsvDownloadUrl`, `facultyCsvAttachmentHeaders` | `tests/unit/chat3-faculty-content-navigation-csv-boundaries.test.ts` | FAC-BOUNDS-05 | strict query selectors, no extra/duplicate tenant filters, valid round-trip, safe attachment headers |

| `src/modules/courses/faculty-discussion-reply-service.ts` | `postFacultyDiscussionReply` | `tests/unit/chat3-faculty-discussion-reply-permissions.test.ts` | FAC-DISCUSSION-SERVICE-01 | actual service role matrix, malformed input before scope, foreign college/organization, teaching revocation before write and exact authenticated command |

| `src/modules/courses/faculty-assessment-report-service.ts` | `getFacultyAssignmentReport`, `getFacultyQuizReport` | `tests/unit/chat3-faculty-assessment-report-service-scope.test.ts` | FAC-REPORT-SERVICE-01 | current enrolled Section roster only, foreign learners excluded from metrics and responses, ambiguous Section denied, latest retake precedence, invalid grade safety and revoked report source failure |

## Role/security matrix

- FAC-SCOPE-01/02: Faculty allowed only after central `courses.read` and active teaching role; Learner, Mentor, College Admin, Super Admin, missing membership and foreign tenant denied in unit-model mock contract.
- FAC-SCOPE-03/04: invalid assessment IDs/query shapes denied, wrong Section report errors rendered as private not-found; unexpected errors are never incorrectly hidden.
- FAC-ATT-03, FAC-AUTH-03 and FAC-LIVE-04 exercise stale optimistic precision and registered SQL conflict mapping.
- Each test exists as source, but unit runner/DB access is not available to this lane, so **tests are authored, not certified passing**.

## Outstanding mandatory master-queue work (not represented as tested)

- Remaining `src/modules/courses/faculty-*` exports and DB-backed services (assessment, live class, submissions, profiles, report exports, contacts, roster, discussion and quiz authoring).
- All Faculty API route handlers: unauthenticated, same-origin, own/foreign tenant, transition audit and idempotency.
- PostgreSQL integration tests: constraints, advisory/exclusion locks, transaction rollback, activity/audit and notifications.
- Admin APIs and additional modules beyond academics/people/recruiters.
