# Faculty coverage ledger (chat-3)

Status: INCOMPLETE. Tests have not been executed; do not use this ledger for release sign-off.

## Faculty source files

| Source path | Export coverage |
|---|---|
| `src/modules/attendance/faculty-attendance-edit-state.ts` | `initialAbsencesForSession` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-attendance-edit-state.ts` | `resolveFacultyAttendanceSession` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-attendance-edit-state.ts` | `resolveFacultyAttendanceDeepLink` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-attendance-edit-state.ts` | `facultyAttendanceMarksDirty` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-correction-audit-model.ts` | `facultyCorrectionDelta` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-correction-audit-model.ts` | `facultyCorrectionReasonValid` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-correction-audit-model.ts` | `facultyAttendanceConfirmation` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-correction-audit-model.ts` | `facultyAttendanceChangedMemberships` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-correction-model.ts` | `facultyCorrectionQuerySchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-correction-model.test.ts` |
| `src/modules/attendance/faculty-correction-model.ts` | `facultyCorrectionSessionPage`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-correction-model.test.ts` |
| `src/modules/attendance/faculty-correction-model.ts` | `facultyCorrectionHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-correction-model.test.ts` |
| `src/modules/attendance/faculty-correction-service.ts` | `getFacultyCorrectionAvailability`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-correction-token-model.ts` | `facultyAttendanceCorrectionTokenMatches` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-correction-token-model.ts` | `facultyAttendanceNextMarkedAt` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-grid-model.ts` | `indiaAttendanceDayKey` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-grid-model.ts` | `indiaAttendanceMonthKey` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-grid-model.ts` | `shiftIndiaAttendanceMonth` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-grid-model.ts` | `groupFacultyAttendanceSessionsByIndiaDay` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-grid-model.ts` | `facultyAttendanceDayCell` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-learner-attendance-detail.ts` | `facultyLearnerAttendanceDetail`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-learner-attendance-detail.test.ts` |
| `src/modules/attendance/faculty-learner-attendance-detail.ts` | `facultyAttendanceMonthSummary`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-learner-attendance-detail.test.ts` |
| `src/modules/attendance/faculty-learner-attendance-detail.ts` | `facultyAttendanceThresholdBreakdown`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-learner-attendance-detail.test.ts` |
| `src/modules/attendance/faculty-marking-window.ts` | `facultyAttendanceMarkingWindow` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-schedule-editor-model.ts` | `localDateTimeInput`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-schedule-editor-model.test.ts` |
| `src/modules/attendance/faculty-schedule-editor-model.ts` | `facultyScheduleInstants`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-schedule-editor-model.test.ts` |
| `src/modules/attendance/faculty-schedule-editor-model.ts` | `validateFacultyScheduleWindow`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-schedule-editor-model.test.ts` |
| `src/modules/attendance/faculty-schedule-errors.ts` | `mapFacultyScheduleInsertError`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-schedule-errors.test.ts` |
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
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentLimitEditable` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentLimitPatch` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentCanArchive` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentEditReceiptMatches` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentArchiveReceiptMatches` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-filter.ts` | `filterFacultyAssessments`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assessment-filter.test.ts` |
| `src/modules/courses/faculty-assessment-report-service.ts` | `buildScoreDistribution` — `tests/unit/faculty-assessment-report.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-report-service.ts` | `latestQuizAttemptsByLearner` — `tests/unit/faculty-assessment-report.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-report-service.ts` | `questionAccuracy` — `tests/unit/faculty-assessment-report.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-report-service.ts` | `assignmentScoreSummary` — `tests/unit/faculty-assessment-report.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-report-service.ts` | `scoreSummary` — `tests/unit/faculty-assessment-report.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-report-service.ts` | `getFacultyQuizReport` — `tests/unit/COURSES-BREAK-FACULTY-06.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-report-service.ts` | `getFacultyAssignmentReport` — `tests/unit/COURSES-BREAK-FACULTY-06.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-route-boundary.ts` | `parseFacultyAssessmentReportRoute`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assessment-route-boundary.test.ts` |
| `src/modules/courses/faculty-assessment-route-boundary.ts` | `facultyAssignmentReportHidden`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assessment-route-boundary.test.ts` |
| `src/modules/courses/faculty-assessment-route-boundary.ts` | `facultyQuizReportHidden`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assessment-route-boundary.test.ts` |
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
| `src/modules/courses/faculty-assignment-grading-policy.ts` | `facultyAssignmentGradingAllowed` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (not executed) |
| `src/modules/courses/faculty-assignment-grading-policy.ts` | `facultyAssignmentGradePublicationAllowed` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (not executed) |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionFilterSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assignment-submissions-model.test.ts` |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionListQuerySchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assignment-submissions-model.test.ts` |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionReportPageQuerySchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assignment-submissions-model.test.ts` |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionReportSearchSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assignment-submissions-model.test.ts` |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `selectFacultyAssignmentSubmissions`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assignment-submissions-model.test.ts` |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionListPage`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assignment-submissions-model.test.ts` |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionListHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assignment-submissions-model.test.ts` |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `parseFacultySubmissionReviewUrl`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assignment-submissions-model.test.ts` |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionReviewApiHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assignment-submissions-model.test.ts` |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySortSubmissionReportRows`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assignment-submissions-model.test.ts` |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySearchSubmissionReportRows`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assignment-submissions-model.test.ts` |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultyFilterSubmissionPublication`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assignment-submissions-model.test.ts` |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionReportEmptyState`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assignment-submissions-model.test.ts` |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionCsvScopeNote`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-assignment-submissions-model.test.ts` |
| `src/modules/courses/faculty-authoring-datetime-model.ts` | `authoringLocalDateTime`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-authoring-datetime-model.test.ts` |
| `src/modules/courses/faculty-authoring-datetime-model.ts` | `authoringDueInstant`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-authoring-datetime-model.test.ts` |
| `src/modules/courses/faculty-authoring-datetime-model.ts` | `assignmentActionAvailable`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-authoring-datetime-model.test.ts` |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactDetailParamsSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-contact-detail-model.test.ts` |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactRoleLabel`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-contact-detail-model.test.ts` |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactTabMatches`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-contact-detail-model.test.ts` |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactDetailHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-contact-detail-model.test.ts` |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactDetailHidden`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-contact-detail-model.test.ts` |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactDirectoryQuery`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-contact-detail-model.test.ts` |
| `src/modules/courses/faculty-contacts-filter-model.ts` | `parseFacultyContactsQuery`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-contacts-filter-model.test.ts` |
| `src/modules/courses/faculty-contacts-service.ts` | `listFacultyContacts`: GAP — behavioural test needed |
| `src/modules/courses/faculty-contacts-service.ts` | `getFacultyContactDetail`: GAP — behavioural test needed |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentPatch`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-content-edit-model.test.ts` |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentDraftChanged`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-content-edit-model.test.ts` |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentMayChangeOpen`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-content-edit-model.test.ts` |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentSaveReceiptMatches`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-content-edit-model.test.ts` |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentMaySave`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-content-edit-model.test.ts` |
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
| `src/modules/courses/faculty-course-home-model.ts` | `buildFacultyCourseHomeSignals`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-course-home-model.test.ts` |
| `src/modules/courses/faculty-course-home-service.ts` | `getFacultyCourseHomeSignals`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-list-model.ts` | `facultyCourseListQuerySchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-course-list-model.test.ts` |
| `src/modules/courses/faculty-course-list-model.ts` | `FACULTY_COURSE_LIST_PAGE_SIZE`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-course-list-model.test.ts` |
| `src/modules/courses/faculty-course-list-model.ts` | `pageFacultyCourseList`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-course-list-model.test.ts` |
| `src/modules/courses/faculty-course-list-model.ts` | `facultyCourseListHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-course-list-model.test.ts` |
| `src/modules/courses/faculty-course-list-model.ts` | `facultyCourseWorkspaceRevokedError`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-course-list-model.test.ts` |
| `src/modules/courses/faculty-course-list-model.ts` | `parseFacultyCourseListLocation`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-course-list-model.test.ts` |
| `src/modules/courses/faculty-course-list-service.ts` | `getFacultyCourseList`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-navigation.ts` | `facultyCourseTabs`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-course-navigation.test.ts` |
| `src/modules/courses/faculty-course-navigation.ts` | `isFacultyCourseTab`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-course-navigation.test.ts` |
| `src/modules/courses/faculty-course-navigation.ts` | `facultyCourseTabHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-course-navigation.test.ts` |
| `src/modules/courses/faculty-course-navigation.ts` | `facultyCourseTabFromPath`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-course-navigation.test.ts` |
| `src/modules/courses/faculty-course-navigation.ts` | `validFacultyDefaultDeliveryId`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-course-navigation.test.ts` |
| `src/modules/courses/faculty-course-route-errors.ts` | `hidesFacultyCourseRouteError`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-course-route-errors.test.ts` |
| `src/modules/courses/faculty-course-service.ts` | `listFacultyCourseDeliveries`: GAP — behavioural test needed |
| `src/modules/courses/faculty-course-service.ts` | `getFacultyCourseWorkspace`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-history-model.ts` | `facultyDiscussionHistorySchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-discussion-history-model.test.ts` |
| `src/modules/courses/faculty-discussion-history-model.ts` | `discussionHistoryPagination`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-discussion-history-model.test.ts` |
| `src/modules/courses/faculty-discussion-history-model.ts` | `facultyDiscussionHistoryHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-discussion-history-model.test.ts` |
| `src/modules/courses/faculty-discussion-history-model.ts` | `discussionHistoryLabel`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-discussion-history-model.test.ts` |
| `src/modules/courses/faculty-discussion-history-model.ts` | `parseFacultyDiscussionHistoryLocation`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-discussion-history-model.test.ts` |
| `src/modules/courses/faculty-discussion-history-service.ts` | `getFacultyDiscussionHistory`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-moderation-model.ts` | `facultyDiscussionModerationSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-discussion-moderation-model.test.ts` |
| `src/modules/courses/faculty-discussion-moderation-model.ts` | `facultyDiscussionTokenMatches`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-discussion-moderation-model.test.ts` |
| `src/modules/courses/faculty-discussion-participation-model.ts` | `facultyDiscussionParticipationSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-participation-model.ts` | `facultyDiscussionParticipationSummary`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-participation-service.ts` | `getFacultyDiscussionParticipation`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-reply-model.ts` | `facultyDiscussionReplySchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-discussion-reply-model.test.ts` |
| `src/modules/courses/faculty-discussion-reply-model.ts` | `facultyReplyParentTokenMatches`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-discussion-reply-model.test.ts` |
| `src/modules/courses/faculty-discussion-reply-service.ts` | `postFacultyDiscussionReply`: GAP — behavioural test needed |
| `src/modules/courses/faculty-followup-export.ts` | `facultyFollowUpPageCsv` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-followup-export.ts` | `facultyFollowUpCsvHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-grade-editor-model.ts` | `facultyGradeEditorState`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-grade-editor-model.test.ts` |
| `src/modules/courses/faculty-grade-noop-model.ts` | `facultyGradeHasChanges`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-grade-noop-model.test.ts` |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookParamsSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-gradebook-model.test.ts` |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyPublishedGradeRows` — `tests/unit/chat3-faculty-gradebook-integrity.test.ts` (not executed) |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookCsv`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-gradebook-model.test.ts` |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyPublishedLearnerBreakdown` — `tests/unit/chat3-faculty-gradebook-integrity.test.ts` (not executed) |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookViewQuerySchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-gradebook-model.test.ts` |
| `src/modules/courses/faculty-gradebook-model.ts` | `paginateFacultyGradebookRows`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-gradebook-model.test.ts` |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookViewHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-gradebook-model.test.ts` |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookPrivateNotFound`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-gradebook-model.test.ts` |
| `src/modules/courses/faculty-gradebook-service.ts` | `getFacultyPublishedGradebook` — `tests/unit/chat3-faculty-gradebook-service-journey.test.ts` (not executed) |
| `src/modules/courses/faculty-gradebook-service.ts` | `getFacultyPublishedGradebookLearner` — `tests/unit/chat3-faculty-gradebook-service-journey.test.ts` (not executed) |
| `src/modules/courses/faculty-inbox-query-model.ts` | `parseFacultyInboxQuery`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-inbox-query-model.test.ts` |
| `src/modules/courses/faculty-ist-month-model.ts` | `facultyMonthQuerySchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-ist-month-model.test.ts` |
| `src/modules/courses/faculty-ist-month-model.ts` | `istDateKey`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-ist-month-model.test.ts` |
| `src/modules/courses/faculty-ist-month-model.ts` | `currentIstMonth`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-ist-month-model.test.ts` |
| `src/modules/courses/faculty-ist-month-model.ts` | `shiftMonth`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-ist-month-model.test.ts` |
| `src/modules/courses/faculty-ist-month-model.ts` | `facultyMonthGrid`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-ist-month-model.test.ts` |
| `src/modules/courses/faculty-ist-month-model.ts` | `facultyMonthHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-ist-month-model.test.ts` |
| `src/modules/courses/faculty-ist-month-service.ts` | `getFacultyIstMonth`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `FACULTY_IST_QUARTER_MINUTES`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `FACULTY_IST_NOTE`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `facultyIstTimeParts`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `facultyIstWallTime`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `facultyIstQuarterHourIssue`: GAP — behavioural test needed |
| `src/modules/courses/faculty-lesson-visibility-model.ts` | `lessonVisibilityCommandSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-lesson-visibility-model.test.ts` |
| `src/modules/courses/faculty-lesson-visibility-model.ts` | `lessonVisibleToReader`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-lesson-visibility-model.test.ts` |
| `src/modules/courses/faculty-lesson-visibility-model.ts` | `mayEditLessonStudentVisibility`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-lesson-visibility-model.test.ts` |
| `src/modules/courses/faculty-lesson-visibility-staged.ts` | `filterStagedStudentVisibleLessonContents`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-lesson-visibility-staged.test.ts` |
| `src/modules/courses/faculty-live-classes-model.ts` | `facultyLiveClassesQuerySchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-classes-model.ts` | `safeHttpsMeetingLink`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-classes-model.ts` | `pageFacultyLiveClasses`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-classes-model.ts` | `facultyLiveClassesHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-classes-service.ts` | `getFacultyLiveClasses`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-confirmation.ts` | `facultyLiveConfirmText`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-live-confirmation.test.ts` |
| `src/modules/courses/faculty-live-editor-command.ts` | `facultyLiveEditorCommand`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-live-editor-command.test.ts` |
| `src/modules/courses/faculty-live-editor-model.ts` | `facultyLiveEditorDraft`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-live-editor-model.test.ts` |
| `src/modules/courses/faculty-live-editor-model.ts` | `emptyFacultyLiveDraft`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-live-editor-model.test.ts` |
| `src/modules/courses/faculty-live-lock-model.ts` | `facultyLiveDeliveryLockKey`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-live-lock-model.test.ts` |
| `src/modules/courses/faculty-live-mutation-model.ts` | `facultyLiveMutationParamsSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-live-mutation-model.test.ts` |
| `src/modules/courses/faculty-live-mutation-model.ts` | `facultyLiveMutationSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-live-mutation-model.test.ts` |
| `src/modules/courses/faculty-live-mutation-model.ts` | `facultyLiveWindow`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-live-mutation-model.test.ts` |
| `src/modules/courses/faculty-live-mutation-service.ts` | `commandFacultyLiveClass`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-published-policy.ts` | `facultyLivePublishedMutationAllowed`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-live-published-policy.test.ts` |
| `src/modules/courses/faculty-live-save-feedback.ts` | `facultyLiveSaveFeedback`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-live-save-feedback.test.ts` |
| `src/modules/courses/faculty-live-session-option.ts` | `facultyLiveSessionOption`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-live-session-option.test.ts` |
| `src/modules/courses/faculty-live-success.ts` | `facultyLiveMutationSuccess`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-live-success.test.ts` |
| `src/modules/courses/faculty-manual-grade-receipt.ts` | `FacultyManualGradeReceiptError`: GAP — behavioural test needed |
| `src/modules/courses/faculty-manual-grade-receipt.ts` | `facultyManualGradeReceipt`: GAP — behavioural test needed |
| `src/modules/courses/faculty-manual-grade-receipt.ts` | `beginFacultyManualGradeOperation`: GAP — behavioural test needed |
| `src/modules/courses/faculty-manual-grade-receipt.ts` | `facultyManualGradeUncertainMessage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-manual-grade-receipt.ts` | `facultyManualGradePublishPrompt`: GAP — behavioural test needed |
| `src/modules/courses/faculty-manual-grade-receipt.ts` | `facultyManualGradeNeedsRefresh`: GAP — behavioural test needed |
| `src/modules/courses/faculty-manual-grade-receipt.ts` | `facultyManualGradeSuccessMessage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-notices-model.ts` | `facultyNoticeParamsSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-notices-model.test.ts` |
| `src/modules/courses/faculty-notices-model.ts` | `FACULTY_SECTION_NOTICES_BLOCKER`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-notices-model.test.ts` |
| `src/modules/courses/faculty-notices-service.ts` | `getFacultySectionNotices`: GAP — behavioural test needed |
| `src/modules/courses/faculty-notification-link-model.ts` | `facultyNotificationActionHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-notification-link-model.test.ts` |
| `src/modules/courses/faculty-profile-teaching-model.ts` | `facultyProfileTeachingQuerySchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-profile-teaching-model.test.ts` |
| `src/modules/courses/faculty-profile-teaching-model.ts` | `pageOwnFacultyTeaching`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-profile-teaching-model.test.ts` |
| `src/modules/courses/faculty-profile-teaching-model.ts` | `ownFacultyTeachingHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-profile-teaching-model.test.ts` |
| `src/modules/courses/faculty-profile-teaching-service.ts` | `getOwnFacultyTeachingSection`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-attempts-model.ts` | `facultyQuizAttemptsQuerySchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-attempts-model.test.ts` |
| `src/modules/courses/faculty-quiz-attempts-model.ts` | `facultyQuizAttemptSearchSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-attempts-model.test.ts` |
| `src/modules/courses/faculty-quiz-attempts-model.ts` | `facultyQuizAttemptsPage`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-attempts-model.test.ts` |
| `src/modules/courses/faculty-quiz-attempts-model.ts` | `facultyQuizAttemptsHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-attempts-model.test.ts` |
| `src/modules/courses/faculty-quiz-attempts-model.ts` | `facultySearchQuizAttempts`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-attempts-model.test.ts` |
| `src/modules/courses/faculty-quiz-attempts-service.ts` | `getFacultyQuizAttemptDrilldown`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-model.ts` | `facultyQuizParamsSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-model.ts` | `facultyQuizCommandSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-model.ts` | `sumQuizPoints`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-model.ts` | `facultyQuizVersionMatches`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-model.ts` | `facultyQuizLegacyEdit`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-model.ts` | `facultyQuizMetadataUnchanged`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-model.ts` | `facultyQuizAttemptLimitLocked`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-service.ts` | `commandFacultyQuiz`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyAuthoringQuestionsFromResponse`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizDraftIssue`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyChangeQuizChoiceType`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizDraftEditable`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizMetadataEditable`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyToggleQuizAnswer`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyRemoveQuizOption`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizConfirmationAfterEdit`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyRemoveQuizQuestion`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyAppendQuizQuestion`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizDraftLoadAllowsAction`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizMetadataIssue`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizWriteMessage`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizCanRetryDetails`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizCanPublishSavedDraft`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizSavedFromCommand`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizReconcileRows`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyMoveQuizQuestion`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyMoveQuizOption`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyDuplicateQuizQuestion`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyDuplicateQuizOption`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizSwitchNeedsConfirmation`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyBeginQuizWrite`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizDraftReview`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizCanSaveChanges`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizMayResetDraft`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizCanCopyToDraft`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizCopyTitle`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizNormalizeQuestions`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizMatchesSearch`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizQuestionMatches`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizQuestionIssue`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizAnswerSummary`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyInsertQuizQuestionAfter`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyMoveQuizQuestionToEdge`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyInsertQuizOptionAfter`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizOptionRemovalNeedsConfirmation`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizQuestionRemovalPrompt`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizApplyPastedOptions`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizLoadedBankIssue`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizRetryNeedsConfirmation`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizTitleConflict`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizReviewIssues`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizShouldDisplayQuestion`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizReadErrorMessage`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizOptionRemovalPrompt`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizReadyToPublish`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-builder-model.test.ts` |
| `src/modules/courses/faculty-quiz-csv-cap.ts` | `FACULTY_QUIZ_CSV_MAX_ROWS`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-csv-cap.test.ts` |
| `src/modules/courses/faculty-quiz-csv-cap.ts` | `capFacultyQuizCsvRows`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-csv-cap.test.ts` |
| `src/modules/courses/faculty-quiz-csv-cap.ts` | `facultyQuizCsvNotice`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-csv-cap.test.ts` |
| `src/modules/courses/faculty-quiz-csv-cap.ts` | `selectFacultyQuizCsvRows`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-csv-cap.test.ts` |
| `src/modules/courses/faculty-quiz-question-csv-service.ts` | `getFacultyQuizQuestionCsvForDownload`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-question-csv.ts` | `FACULTY_QUIZ_QUESTION_CSV_MAX_ROWS`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-question-csv.test.ts` |
| `src/modules/courses/faculty-quiz-question-csv.ts` | `facultyQuizQuestionAccuracyCsv` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-quiz-report-route-errors.ts` | `hidesFacultyQuizRouteError`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-report-route-errors.test.ts` |
| `src/modules/courses/faculty-quiz-request-body.ts` | `FACULTY_QUIZ_COMMAND_LIMIT_BYTES`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-request-body.ts` | `FacultyQuizBodyError`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-request-body.ts` | `facultyQuizAcceptsContentType` — `tests/unit/COURSES-BREAK-FACULTY-02.test.ts` (not executed) |
| `src/modules/courses/faculty-quiz-request-body.ts` | `readFacultyQuizCommandBody` — `tests/unit/COURSES-BREAK-FACULTY-02.test.ts` (not executed) |
| `src/modules/courses/faculty-quiz-results-command-model.ts` | `facultyQuizResultsCommandSchema` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (not executed) |
| `src/modules/courses/faculty-quiz-results-command-model.ts` | `facultyQuizResultsTransition` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (not executed) |
| `src/modules/courses/faculty-quiz-results-command-service.ts` | `commandFacultyQuizResults` — `tests/unit/COURSES-BREAK-FACULTY-03.test.ts` (not executed) |
| `src/modules/courses/faculty-quiz-results-legacy-model.ts` | `legacyQuizResultsWriteAllowed`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-quiz-results-legacy-model.test.ts` |
| `src/modules/courses/faculty-regrade-feedback-model.ts` | `facultyRegradeFeedbackAllowed`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-regrade-feedback-model.test.ts` |
| `src/modules/courses/faculty-report-completeness.ts` | `facultyReportIsIncomplete`: GAP — behavioural test needed |
| `src/modules/courses/faculty-report-csv-request.ts` | `facultyReportCsvRequestSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-report-csv-request.test.ts` |
| `src/modules/courses/faculty-report-csv-request.ts` | `facultyReportCsvHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-report-csv-request.test.ts` |
| `src/modules/courses/faculty-report-csv-request.ts` | `parseFacultyCsvDownloadUrl`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-report-csv-request.test.ts` |
| `src/modules/courses/faculty-report-csv-request.ts` | `facultyCsvAttachmentHeaders`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-report-csv-request.test.ts` |
| `src/modules/courses/faculty-report-csv-service.ts` | `getFacultyReportCsvForDownload`: GAP — behavioural test needed |
| `src/modules/courses/faculty-report-csv.ts` | `facultyReportCsvSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-report-csv.test.ts` |
| `src/modules/courses/faculty-report-csv.ts` | `neutralizeFacultyCsvCell` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-report-csv.ts` | `facultyReportCsv` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-report-csv.ts` | `facultyReportCsvFilename` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-report-csv.ts` | `facultyCsvIstTimestamp` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-report-csv.ts` | `FACULTY_REPORT_CSV_MAX_ROWS`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-report-csv.test.ts` |
| `src/modules/courses/faculty-report-csv.ts` | `capFacultyReportCsvRows` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-report-csv.ts` | `facultyCsvLearnerLabel` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-report-pdf.ts` | `buildFacultyReportPdf`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-report-pdf.test.ts` |
| `src/modules/courses/faculty-report-students.ts` | `FACULTY_REPORT_PAGE_SIZE`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-report-students.test.ts` |
| `src/modules/courses/faculty-report-students.ts` | `facultyReportStudentPage`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-report-students.test.ts` |
| `src/modules/courses/faculty-report-students.ts` | `facultyReportLearnerName`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-report-students.test.ts` |
| `src/modules/courses/faculty-report-time.ts` | `facultyReportIstTimestamp`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-report-time.test.ts` |
| `src/modules/courses/faculty-reports-hub-model.ts` | `facultyReportsHubQuerySchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-reports-hub-model.test.ts` |
| `src/modules/courses/faculty-reports-hub-model.ts` | `facultyReportHubHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-reports-hub-model.test.ts` |
| `src/modules/courses/faculty-reports-hub-model.ts` | `publishedReportBreakdown`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-reports-hub-model.test.ts` |
| `src/modules/courses/faculty-reports-hub-model.ts` | `attendanceReportCounts`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-reports-hub-model.test.ts` |
| `src/modules/courses/faculty-reports-hub-model.ts` | `parseFacultyReportsHubLocation`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-reports-hub-model.test.ts` |
| `src/modules/courses/faculty-reports-hub-service.ts` | `getFacultyReportsHub`: GAP — behavioural test needed |
| `src/modules/courses/faculty-response-followup-model.ts` | `facultyResponseFollowUpQuerySchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-response-followup-model.test.ts` |
| `src/modules/courses/faculty-response-followup-model.ts` | `selectPastDueAssessments`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-response-followup-model.test.ts` |
| `src/modules/courses/faculty-response-followup-model.ts` | `facultyResponseFollowUpPage`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-response-followup-model.test.ts` |
| `src/modules/courses/faculty-response-followup-model.ts` | `facultyResponseFollowUpHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-response-followup-model.test.ts` |
| `src/modules/courses/faculty-response-followup-model.ts` | `limitedMissingLearners`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-response-followup-model.test.ts` |
| `src/modules/courses/faculty-response-followup-model.ts` | `parseFacultyFollowUpSearchParams`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-response-followup-model.test.ts` |
| `src/modules/courses/faculty-response-followup-model.ts` | `facultyFollowupEmptyState`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-response-followup-model.test.ts` |
| `src/modules/courses/faculty-response-followup-service.ts` | `getFacultyResponseFollowUps`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-export.ts` | `facultyResultsCsvCell`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-export.ts` | `facultyResultExportAverage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-export.ts` | `facultyResultsPageCsv` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-results-export.ts` | `facultyResultsCsvHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-model.ts` | `facultyResultsQuerySchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-results-model.test.ts` |
| `src/modules/courses/faculty-results-model.ts` | `safeFacultyDueTime`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-results-model.test.ts` |
| `src/modules/courses/faculty-results-model.ts` | `filterFacultyResultCandidates`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-results-model.test.ts` |
| `src/modules/courses/faculty-results-model.ts` | `paginateFacultyResults`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-results-model.test.ts` |
| `src/modules/courses/faculty-results-model.ts` | `facultyResultsHref`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-results-model.test.ts` |
| `src/modules/courses/faculty-results-model.ts` | `facultyRecordedResponseRate`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-results-model.test.ts` |
| `src/modules/courses/faculty-results-model.ts` | `parseFacultyResultsSearchParams`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-results-model.test.ts` |
| `src/modules/courses/faculty-results-model.ts` | `facultyResultsEmptyState`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-results-model.test.ts` |
| `src/modules/courses/faculty-results-service.ts` | `getFacultyAssessmentResults`: GAP — behavioural test needed |
| `src/modules/courses/faculty-roster-display-model.ts` | `facultyRosterDisplayName`: GAP — behavioural test needed |
| `src/modules/courses/faculty-roster-display-model.ts` | `sortFacultyRosterByRollThenName`: GAP — behavioural test needed |
| `src/modules/courses/faculty-roster-display-model.ts` | `facultyRosterMetrics`: GAP — behavioural test needed |
| `src/modules/courses/faculty-roster-display-model.ts` | `facultyRosterPhotoPreview`: GAP — behavioural test needed |
| `src/modules/courses/faculty-roster-export.ts` | `facultyRosterCsv` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-roster-export.ts` | `facultyRosterFileName`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-roster-export.test.ts` |
| `src/modules/courses/faculty-route-access-model.ts` | `canAccessFacultyRoute`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-route-access-model.test.ts` |
| `src/modules/courses/faculty-schedule-service.ts` | `getFacultyClassSchedule`: GAP — behavioural test needed |
| `src/modules/courses/faculty-session-coverage-model.ts` | `facultySessionCoverageSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-session-coverage-model.ts` | `facultySessionCoverage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-session-coverage-service.ts` | `getFacultySessionCoverage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-student-detail-model.ts` | `facultyStudentDetailParamsSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-student-detail-model.test.ts` |
| `src/modules/courses/faculty-student-detail-model.ts` | `findAuthorizedFacultyStudent`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-student-detail-model.test.ts` |
| `src/modules/courses/faculty-student-detail-model.ts` | `summarizeFacultyStudentAttendance`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-student-detail-model.test.ts` |
| `src/modules/courses/faculty-student-detail-service.ts` | `getFacultyStudentDetail`: GAP — behavioural test needed |
| `src/modules/courses/faculty-submission-content-model.ts` | `facultySubmissionContentSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-submission-content-model.test.ts` |
| `src/modules/courses/faculty-submission-content-model.ts` | `facultySubmissionContentView`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-submission-content-model.test.ts` |
| `src/modules/courses/faculty-submission-review-model.ts` | `facultySubmissionReviewRowSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-submission-review-model.test.ts` |
| `src/modules/courses/faculty-submission-review-model.ts` | `facultySubmissionReviewResponseSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-submission-review-model.test.ts` |
| `src/modules/courses/faculty-submission-review-model.ts` | `facultySubmissionReviewResponse`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-submission-review-model.test.ts` |
| `src/modules/courses/faculty-submission-review-model.ts` | `facultySubmissionReviewMatchesScope`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-submission-review-model.test.ts` |
| `src/modules/courses/faculty-submission-review-model.ts` | `facultySubmissionReviewEmptyLabel`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-submission-review-model.test.ts` |
| `src/modules/courses/faculty-submission-review-model.ts` | `facultyReviewRequestCurrent`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-submission-review-model.test.ts` |
| `src/modules/courses/faculty-submission-review-model.ts` | `facultySubmissionReviewFailure`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-submission-review-model.test.ts` |
| `src/modules/courses/faculty-submission-review-service.ts` | `getFacultySubmissionReviewPage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-teaching-selector.ts` | `facultyTeachingSelectionAllowed`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyLessonVideoSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideosForLesson`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideoStatusBadge`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideoListFilterSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyFilterLessonVideos`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyOrderLessonVideos`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideoListEmptyState`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideoCanReplace`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideoReplacePrompt`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideoReplaceIntentSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideoArchivePrompt`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideoArchiveIntentSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideoLearnerVisible`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideoVisibilityLabel`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideoVisibilityIntentSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideoCanEnableVisibility`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideoCardActions`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideoMetadataCsv`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-management-model.ts` | `facultyVideoStatusUpdate`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-storage-model.ts` | `managedVideoSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-video-storage-model.test.ts` |
| `src/modules/courses/faculty-video-storage-model.ts` | `parseManagedVideos`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-video-storage-model.test.ts` |
| `src/modules/courses/faculty-video-storage-model.ts` | `facultyVideoMayPublish`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-video-storage-model.test.ts` |
| `src/modules/courses/faculty-video-storage-model.ts` | `facultyVideoMayReplace`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-video-storage-model.test.ts` |
| `src/modules/courses/faculty-video-storage-model.ts` | `facultyVideoMayPreview`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-video-storage-model.test.ts` |
| `src/modules/courses/faculty-video-storage-model.ts` | `facultyVideoPublishAction`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-video-storage-model.test.ts` |
| `src/modules/courses/faculty-video-storage-model.ts` | `facultyVideoReorderPlan`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-video-storage-model.test.ts` |
| `src/modules/courses/faculty-video-storage-model.ts` | `videoUploadGrantSchema`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-video-storage-model.test.ts` |
| `src/modules/courses/faculty-video-storage-model.ts` | `parseFacultyVideoUploadGrant`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-video-storage-model.test.ts` |
| `src/modules/courses/faculty-video-storage-model.ts` | `managedVideoAfterAction`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-video-storage-model.test.ts` |
| `src/modules/courses/faculty-video-storage-model.ts` | `facultyVideoStatus`: **CANDIDATE (not yet assertion-reviewed)** `tests/unit/faculty-video-storage-model.test.ts` |

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
| `src/app/api/courses/faculty/assignments/[deliveryId]/command/route.ts` (`POST`) | `tests/unit/COURSES-BREAK-FACULTY-08.test.ts` (route host, session, malformed body; pending CI) |
| `src/app/api/courses/faculty/assignments/[deliveryId]/methods/route.ts` (`GET`) | **GAP — authenticated GET handler, export scoping and cache tests pending** |
| `src/app/api/courses/faculty/assignments/[deliveryId]/submissions/route.ts` (`GET`) | **GAP — authenticated GET handler, export scoping and cache tests pending** |
| `src/app/api/courses/faculty/attendance/[deliveryId]/schedule/route.ts` (`POST`) | `tests/unit/COURSES-BREAK-FACULTY-08.test.ts` (route host, session, malformed body; pending CI) |
| `src/app/api/courses/faculty/gradebook/[deliveryId]/csv/route.ts` (`GET`) | **GAP — authenticated GET handler, export scoping and cache tests pending** |
| `src/app/api/courses/faculty/live-classes/[deliveryId]/command/route.ts` (`POST`) | `tests/unit/COURSES-BREAK-FACULTY-08.test.ts` (route host, session, malformed body; pending CI) |
| `src/app/api/courses/faculty/quizzes/[deliveryId]/command/route.ts` (`POST`) | `tests/unit/COURSES-BREAK-FACULTY-08.test.ts` (route host, session, malformed body; pending CI) |
| `src/app/api/courses/faculty/reports/[kind]/[assessmentId]/csv/route.ts` (`GET`) | **GAP — authenticated GET handler, export scoping and cache tests pending** |
| `src/app/api/courses/faculty/reports/quiz/[quizId]/question-csv/route.ts` (`GET`) | **GAP — authenticated GET handler, export scoping and cache tests pending** |
| `src/app/api/courses/faculty/response-followups/csv/route.ts` (`GET`) | **GAP — authenticated GET handler, export scoping and cache tests pending** |
| `src/app/api/courses/faculty/results/csv/route.ts` (`GET`) | **GAP — authenticated GET handler, export scoping and cache tests pending** |

Known role and integrity evidence: `tests/unit/PROJ-BREAK-FACULTY-01.test.ts`, `PROJ-BREAK-FACULTY-02.test.ts`, `PROJ-BREAK-FACULTY-03.test.ts`, `COURSES-BREAK-FACULTY-01.test.ts`, `COURSES-BREAK-FACULTY-02.test.ts`, `COURSES-BREAK-FACULTY-03.test.ts`, `COURSES-BREAK-FACULTY-04.test.ts`, `COURSES-BREAK-FACULTY-05.test.ts`, `SA-ACADEMICS-PEOPLE-BREAK-chat3.test.ts`, and `chat3-faculty-gradebook-integrity.test.ts`. These do not establish PostgreSQL integration or full method coverage.

Next actions: enumerate runtime symbols, map behavioural tests per export, run TypeScript and Vitest, complete Super Admin Academics/People audit, close UX gaps.

### 18 October follow-on risk findings

- `FAC-CSV-004/005/006` in `docs/audit/defects-chat-3.md`: bounded report cells, zero-width prefixed spreadsheet formula mitigation, and valid aggregate count guards; unexecuted tests `COURSES-BREAK-FACULTY-04`.
- `FAC-courses-01`: real central `can()` plus `canAccessFacultyRoute` role, disabled-session, stale-membership and selected-admin-scope tests (`COURSES-BREAK-FACULTY-05`); does not replace authenticated browser testing.
- `SA-academics-people`: scoped section lookup, foreign college and disabled Super Admin account regressions (`SA-ACADEMICS-PEOPLE-BREAK-chat3`); remainder of admin people and recruiter pages **not audited exhaustively**.
- Initial unit-failure report may contain stale source-assertion failures already remediated by main merges; only a fresh Vitest run can verify.


## October 18 additional evidence

- Faculty/mentor Projects routes: `tests/unit/PROJ-BREAK-FACULTY-04.test.ts` asserts origin, persisted actor, safe failure and strict body parser across six mutation endpoints; `PROJ-BREAK-FACULTY-05.test.ts` covers byte cap/UTF-8/content type.
- Faculty current-Section Quiz and Assignment report data integrity: `tests/unit/COURSES-BREAK-FACULTY-06.test.ts` and `src/modules/courses/faculty-assessment-report-service.ts`; mocked dependencies only, real DB enrollment churn remains a release gate.
- Faculty attendance correction token, role/session URL, IST midnight and exact deadline: `tests/unit/COURSES-BREAK-FACULTY-07.test.ts`.
- Four Faculty POST command routes' CSRF/session/body bounds: `tests/unit/COURSES-BREAK-FACULTY-08.test.ts`.
- These are direct runtime/route assertions, but not proof of successful TypeScript, Vitest or PostgreSQL CI.

## Additional executable witnesses (2026-10-18)

- `tests/integration/projects-faculty-mentor-access-chat3.test.ts`: with the disposable rollback-only PostgreSQL harness, joins real project members and active membership roles, checks foreign college/user, revoked Faculty/Mentor role, suspended/ended membership, deactivated user, ended project membership, and readonly mutation bit. It is a **database predicate witness**, not a substitute for an HTTP-level Projects service acceptance suite.
- `tests/unit/PROJ-BREAK-FACULTY-06.test.ts`: meeting postmortem notes and decision stale revision handling, terminal state, one audit record, and scoped notification count, using mocked transactions; actual concurrent PostgreSQL writes remain a release gate.
- `tests/e2e/faculty-role-denial-chat3.spec.ts`: browser guest/Learner deep-link denial, changing the active Faculty college after opening a Course, keyboard skip-target, and mobile/desktop error resilience. Requires seeded E2E credentials, not yet run.
- `tests/unit/SA-ACADEMICS-PEOPLE-BREAK-chat3-02.test.ts` and `docs/audit/coverage/admin-academics-people-chat3-ledger.md` enumerate selected organization/college roles and current Super Admin Academics/People page evidence; uncovered click journeys are retained as GAPs.
