# Faculty coverage ledger (chat-3)

Status: INCOMPLETE. Tests have not been executed; do not use this ledger for release sign-off.

## Faculty source files

| Source path | Export coverage |
|---|---|
| `src/modules/attendance/faculty-attendance-edit-state.ts` | `initialAbsencesForSession`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-attendance-edit-state.ts` | `resolveFacultyAttendanceSession`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-attendance-edit-state.ts` | `resolveFacultyAttendanceDeepLink`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-attendance-edit-state.ts` | `facultyAttendanceMarksDirty`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-correction-audit-model.ts` | `facultyCorrectionDelta`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-correction-audit-model.ts` | `facultyCorrectionReasonValid`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-correction-audit-model.ts` | `facultyAttendanceConfirmation`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-correction-audit-model.ts` | `facultyAttendanceChangedMemberships`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-correction-model.ts` | `facultyCorrectionQuerySchema`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-correction-model.ts` | `facultyCorrectionSessionPage`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-correction-model.ts` | `facultyCorrectionHref`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-correction-service.ts` | `getFacultyCorrectionAvailability`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-correction-token-model.ts` | `facultyAttendanceCorrectionTokenMatches`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-correction-token-model.ts` | `facultyAttendanceNextMarkedAt`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-grid-model.ts` | `indiaAttendanceDayKey`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-grid-model.ts` | `indiaAttendanceMonthKey`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-grid-model.ts` | `shiftIndiaAttendanceMonth`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-grid-model.ts` | `groupFacultyAttendanceSessionsByIndiaDay`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-grid-model.ts` | `facultyAttendanceDayCell`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-learner-attendance-detail.ts` | `facultyLearnerAttendanceDetail`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-learner-attendance-detail.ts` | `facultyAttendanceMonthSummary`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-learner-attendance-detail.ts` | `facultyAttendanceThresholdBreakdown`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-marking-window.ts` | `facultyAttendanceMarkingWindow`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-schedule-editor-model.ts` | `localDateTimeInput`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-schedule-editor-model.ts` | `facultyScheduleInstants`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-schedule-editor-model.ts` | `validateFacultyScheduleWindow`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-schedule-errors.ts` | `mapFacultyScheduleInsertError`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-schedule-mutation-model.ts` | `facultyAttendanceScheduleSchema`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-schedule-mutation-model.ts` | `facultyAttendanceScheduleParamsSchema`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-schedule-mutation-model.ts` | `facultyScheduleFieldsChanged`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-schedule-mutation-model.ts` | `facultyScheduleErrorMessage`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-schedule-mutation-service.ts` | `commandFacultyAttendanceSchedule`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-service.ts` | `getFacultyDeliveryRoster`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-service.ts` | `getFacultyAttendanceWorkspace`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-service.ts` | `createFacultyAttendanceSession`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-service.ts` | `markFacultyAttendance`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-batch-model.ts` | `facultyAssessmentVisibleToDelivery`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentLimitEditable`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentLimitPatch`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentCanArchive`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentEditReceiptMatches`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentArchiveReceiptMatches`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-filter.ts` | `filterFacultyAssessments`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-report-service.ts` | `buildScoreDistribution`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-report-service.ts` | `latestQuizAttemptsByLearner`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-report-service.ts` | `questionAccuracy`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-report-service.ts` | `assignmentScoreSummary`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-report-service.ts` | `scoreSummary`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-report-service.ts` | `getFacultyQuizReport`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-report-service.ts` | `getFacultyAssignmentReport`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-route-boundary.ts` | `parseFacultyAssessmentReportRoute`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-route-boundary.ts` | `facultyAssignmentReportHidden`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-route-boundary.ts` | `facultyQuizReportHidden`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-service.ts` | `getFacultyAssessmentOverview`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentParamsSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentCommandSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `assignmentFieldsChanged`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentMethodsChanged`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentVersionMatches`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentLegacyEdit`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentEditLockedBySubmissions`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-authoring-service.ts` | `commandFacultyAssignment`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-authoring-service.ts` | `getFacultyAssignmentMethods`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentDraftDirty`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentDraftIssue`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentCommandReceipt`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentMaySubmit`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentConfirmationOnEdit`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentSwitchNeedsConfirmation`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentArchiveWarning`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentPublishIssue`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentCommandError`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentCanSaveDraft`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-grading-policy.ts` | `facultyAssignmentGradingAllowed`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-grading-policy.ts` | `facultyAssignmentGradePublicationAllowed`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionFilterSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionListQuerySchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionReportPageQuerySchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionReportSearchSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `selectFacultyAssignmentSubmissions`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionListPage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionListHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `parseFacultySubmissionReviewUrl`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionReviewApiHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySortSubmissionReportRows`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySearchSubmissionReportRows`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultyFilterSubmissionPublication`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionReportEmptyState`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionCsvScopeNote`: GAP — behavioural test needed |
| `src/modules/courses/faculty-authoring-datetime-model.ts` | `authoringLocalDateTime`: GAP — behavioural test needed |
| `src/modules/courses/faculty-authoring-datetime-model.ts` | `authoringDueInstant`: GAP — behavioural test needed |
| `src/modules/courses/faculty-authoring-datetime-model.ts` | `assignmentActionAvailable`: GAP — behavioural test needed |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactDetailParamsSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactRoleLabel`: GAP — behavioural test needed |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactTabMatches`: GAP — behavioural test needed |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactDetailHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactDetailHidden`: GAP — behavioural test needed |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactDirectoryQuery`: GAP — behavioural test needed |
| `src/modules/courses/faculty-contacts-filter-model.ts` | `parseFacultyContactsQuery`: GAP — behavioural test needed |
| `src/modules/courses/faculty-contacts-service.ts` | `listFacultyContacts`: GAP — behavioural test needed |
| `src/modules/courses/faculty-contacts-service.ts` | `getFacultyContactDetail`: GAP — behavioural test needed |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentPatch`: GAP — behavioural test needed |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentDraftChanged`: GAP — behavioural test needed |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentMayChangeOpen`: GAP — behavioural test needed |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentSaveReceiptMatches`: GAP — behavioural test needed |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentMaySave`: GAP — behavioural test needed |
| `src/modules/courses/faculty-content-input-model.ts` | `facultyYouTubeLinkIssue`: GAP — behavioural test needed |
| `src/modules/courses/faculty-content-input-model.ts` | `facultyLiveClassIssue`: GAP — behavioural test needed |
| `src/modules/courses/faculty-content-order-ui-model.ts` | `facultyMoveContentId`: GAP — behavioural test needed |
| `src/modules/courses/faculty-content-order-ui-model.ts` | `facultyContentOrderDirty`: GAP — behavioural test needed |
| `src/modules/courses/faculty-content-order-ui-model.ts` | `facultyResetContentOrder`: GAP — behavioural test needed |
| `src/modules/courses/faculty-content-order-ui-model.ts` | `facultyContentOrderValid`: GAP — behavioural test needed |
| `src/modules/courses/faculty-content-order-ui-model.ts` | `facultyContentOrderReceiptMatches`: GAP — behavioural test needed |
| `src/modules/courses/faculty-content-preview-model.ts` | `facultyContentExternalHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-content-preview-model.ts` | `facultyYouTubeEmbed`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-card-summary-model.ts` | `countFacultyCourseCardItems`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-card-summary-service.ts` | `listFacultyCourseCardSummaries`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-health-model.ts` | `facultyCourseHealthParamsSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-health-model.ts` | `selectFacultyCourseHealthCandidates`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-health-model.ts` | `facultyCourseHealthHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-health-model.ts` | `responseCoverage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-health-service.ts` | `getFacultyCourseAssessmentHealth`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-home-model.ts` | `buildFacultyCourseHomeSignals`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-home-service.ts` | `getFacultyCourseHomeSignals`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-list-model.ts` | `facultyCourseListQuerySchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-list-model.ts` | `FACULTY_COURSE_LIST_PAGE_SIZE`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-list-model.ts` | `pageFacultyCourseList`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-list-model.ts` | `facultyCourseListHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-list-model.ts` | `facultyCourseWorkspaceRevokedError`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-list-model.ts` | `parseFacultyCourseListLocation`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-list-service.ts` | `getFacultyCourseList`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-navigation.ts` | `facultyCourseTabs`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-navigation.ts` | `isFacultyCourseTab`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-navigation.ts` | `facultyCourseTabHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-navigation.ts` | `facultyCourseTabFromPath`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-navigation.ts` | `validFacultyDefaultDeliveryId`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-route-errors.ts` | `hidesFacultyCourseRouteError`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-service.ts` | `listFacultyCourseDeliveries`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-service.ts` | `getFacultyCourseWorkspace`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-history-model.ts` | `facultyDiscussionHistorySchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-history-model.ts` | `discussionHistoryPagination`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-history-model.ts` | `facultyDiscussionHistoryHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-history-model.ts` | `discussionHistoryLabel`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-history-model.ts` | `parseFacultyDiscussionHistoryLocation`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-history-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-discussion-moderation-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-discussion-participation-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-discussion-participation-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-discussion-reply-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-discussion-reply-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-followup-export.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-grade-editor-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-grade-noop-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-gradebook-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-gradebook-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-inbox-query-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-ist-month-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-ist-month-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-lesson-visibility-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-lesson-visibility-staged.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-live-classes-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-live-classes-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-live-confirmation.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-live-editor-command.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-live-editor-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-live-lock-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-live-mutation-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-live-mutation-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-live-published-policy.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-live-save-feedback.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-live-session-option.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-live-success.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-manual-grade-receipt.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-notices-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-notices-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-notification-link-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-profile-teaching-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-profile-teaching-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-quiz-attempts-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-quiz-attempts-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-quiz-authoring-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-quiz-authoring-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-quiz-builder-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-quiz-csv-cap.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-quiz-question-csv-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-quiz-question-csv.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-quiz-report-route-errors.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-quiz-request-body.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-quiz-results-command-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-quiz-results-command-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-quiz-results-legacy-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-regrade-feedback-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-report-completeness.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-report-csv-request.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-report-csv-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-report-csv.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-report-pdf.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-report-students.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-report-time.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-reports-hub-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-reports-hub-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-response-followup-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-response-followup-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-results-export.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-results-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-results-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-roster-display-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-roster-export.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-route-access-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-schedule-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-session-coverage-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-session-coverage-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-student-detail-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-student-detail-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-submission-content-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-submission-review-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-submission-review-service.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-teaching-selector.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-video-management-model.ts` | GAP: exported-function test inventory required |
| `src/modules/courses/faculty-video-storage-model.ts` | GAP: exported-function test inventory required |

## Teacher pages

| Page | Functional coverage |
|---|---|
| `src/app/(authenticated)/teacher/allAssignments/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/allQuizzes/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/calendar/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/contacts/[contactsTab]/[membershipId]/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/contacts/[contactsTab]/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/contacts/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/[...courseTab]/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/assessment-health/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/assignments/manage/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/attendance-corrections/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-history/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/discussion-participation/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/discussions/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/gradebook/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/notices/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/quizzes/manage/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/reports/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/session-coverage/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/students/[membershipId]/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/[deliveryId]/students/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/courses/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/live-classes/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/notifications/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/profile/contacts/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/profile/details/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/profile/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/profile/teaching/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/report/assignment/[contentId]/submissions/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/report/quiz/[quizId]/attempts/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/response-followups/page.tsx` | GAP: authenticated, responsive and error-path test required |
| `src/app/(authenticated)/teacher/results/page.tsx` | GAP: authenticated, responsive and error-path test required |

## Faculty API routes

| Route | Handler coverage |
|---|---|
| `src/app/api/courses/faculty/assignments/[deliveryId]/command/route.ts` | GAP: each handler requires role, scope, validation and race test |
| `src/app/api/courses/faculty/assignments/[deliveryId]/methods/route.ts` | GAP: each handler requires role, scope, validation and race test |
| `src/app/api/courses/faculty/assignments/[deliveryId]/submissions/route.ts` | GAP: each handler requires role, scope, validation and race test |
| `src/app/api/courses/faculty/attendance/[deliveryId]/schedule/route.ts` | GAP: each handler requires role, scope, validation and race test |
| `src/app/api/courses/faculty/gradebook/[deliveryId]/csv/route.ts` | GAP: each handler requires role, scope, validation and race test |
| `src/app/api/courses/faculty/live-classes/[deliveryId]/command/route.ts` | GAP: each handler requires role, scope, validation and race test |
| `src/app/api/courses/faculty/quizzes/[deliveryId]/command/route.ts` | GAP: each handler requires role, scope, validation and race test |
| `src/app/api/courses/faculty/reports/[kind]/[assessmentId]/csv/route.ts` | GAP: each handler requires role, scope, validation and race test |
| `src/app/api/courses/faculty/reports/quiz/[quizId]/question-csv/route.ts` | GAP: each handler requires role, scope, validation and race test |
| `src/app/api/courses/faculty/response-followups/csv/route.ts` | GAP: each handler requires role, scope, validation and race test |
| `src/app/api/courses/faculty/results/csv/route.ts` | GAP: each handler requires role, scope, validation and race test |

Known role and integrity evidence: `tests/unit/PROJ-BREAK-FACULTY-01.test.ts`, `PROJ-BREAK-FACULTY-02.test.ts`, `PROJ-BREAK-FACULTY-03.test.ts`, `COURSES-BREAK-FACULTY-01.test.ts`, `COURSES-BREAK-FACULTY-02.test.ts`, `COURSES-BREAK-FACULTY-03.test.ts`, `COURSES-BREAK-FACULTY-04.test.ts`, and `chat3-faculty-gradebook-integrity.test.ts`. These do not establish PostgreSQL integration or full method coverage.

Next actions: enumerate runtime symbols, map behavioural tests per export, run TypeScript and Vitest, complete Super Admin Academics/People audit, close UX gaps.
