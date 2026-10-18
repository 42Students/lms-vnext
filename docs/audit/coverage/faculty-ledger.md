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
| `src/modules/attendance/faculty-correction-model.ts` | `facultyCorrectionQuerySchema`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-correction-model.ts` | `facultyCorrectionSessionPage`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-correction-model.ts` | `facultyCorrectionHref`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-correction-service.ts` | `getFacultyCorrectionAvailability`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-correction-token-model.ts` | `facultyAttendanceCorrectionTokenMatches` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-correction-token-model.ts` | `facultyAttendanceNextMarkedAt` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-grid-model.ts` | `indiaAttendanceDayKey` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-grid-model.ts` | `indiaAttendanceMonthKey` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-grid-model.ts` | `shiftIndiaAttendanceMonth` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-grid-model.ts` | `groupFacultyAttendanceSessionsByIndiaDay` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-grid-model.ts` | `facultyAttendanceDayCell` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
| `src/modules/attendance/faculty-learner-attendance-detail.ts` | `facultyLearnerAttendanceDetail`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-learner-attendance-detail.ts` | `facultyAttendanceMonthSummary`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-learner-attendance-detail.ts` | `facultyAttendanceThresholdBreakdown`: GAP — behavioural test needed |
| `src/modules/attendance/faculty-marking-window.ts` | `facultyAttendanceMarkingWindow` — `tests/unit/COURSES-BREAK-FACULTY-07.test.ts` (behavioural, CI pending) |
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
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentLimitEditable` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentLimitPatch` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentCanArchive` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentEditReceiptMatches` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentArchiveReceiptMatches` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-filter.ts` | `filterFacultyAssessments`: GAP — behavioural test needed |
| `src/modules/courses/faculty-assessment-report-service.ts` | `buildScoreDistribution` — `tests/unit/faculty-assessment-report.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-report-service.ts` | `latestQuizAttemptsByLearner` — `tests/unit/faculty-assessment-report.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-report-service.ts` | `questionAccuracy` — `tests/unit/faculty-assessment-report.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-report-service.ts` | `assignmentScoreSummary` — `tests/unit/faculty-assessment-report.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-report-service.ts` | `scoreSummary` — `tests/unit/faculty-assessment-report.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-report-service.ts` | `getFacultyQuizReport` — `tests/unit/COURSES-BREAK-FACULTY-06.test.ts` (behavioural, CI pending) |
| `src/modules/courses/faculty-assessment-report-service.ts` | `getFacultyAssignmentReport` — `tests/unit/COURSES-BREAK-FACULTY-06.test.ts` (behavioural, CI pending) |
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
| `src/modules/courses/faculty-assignment-grading-policy.ts` | `facultyAssignmentGradingAllowed` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (not executed) |
| `src/modules/courses/faculty-assignment-grading-policy.ts` | `facultyAssignmentGradePublicationAllowed` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (not executed) |
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
| `src/modules/courses/faculty-discussion-history-service.ts` | `getFacultyDiscussionHistory`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-moderation-model.ts` | `facultyDiscussionModerationSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-moderation-model.ts` | `facultyDiscussionTokenMatches`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-participation-model.ts` | `facultyDiscussionParticipationSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-participation-model.ts` | `facultyDiscussionParticipationSummary`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-participation-service.ts` | `getFacultyDiscussionParticipation`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-reply-model.ts` | `facultyDiscussionReplySchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-reply-model.ts` | `facultyReplyParentTokenMatches`: GAP — behavioural test needed |
| `src/modules/courses/faculty-discussion-reply-service.ts` | `postFacultyDiscussionReply`: GAP — behavioural test needed |
| `src/modules/courses/faculty-followup-export.ts` | `facultyFollowUpPageCsv` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-followup-export.ts` | `facultyFollowUpCsvHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-grade-editor-model.ts` | `facultyGradeEditorState`: GAP — behavioural test needed |
| `src/modules/courses/faculty-grade-noop-model.ts` | `facultyGradeHasChanges`: GAP — behavioural test needed |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookParamsSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyPublishedGradeRows` — `tests/unit/chat3-faculty-gradebook-integrity.test.ts` (not executed) |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookCsv`: GAP — behavioural test needed |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyPublishedLearnerBreakdown` — `tests/unit/chat3-faculty-gradebook-integrity.test.ts` (not executed) |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookViewQuerySchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-gradebook-model.ts` | `paginateFacultyGradebookRows`: GAP — behavioural test needed |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookViewHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookPrivateNotFound`: GAP — behavioural test needed |
| `src/modules/courses/faculty-gradebook-service.ts` | `getFacultyPublishedGradebook` — `tests/unit/chat3-faculty-gradebook-service-journey.test.ts` (not executed) |
| `src/modules/courses/faculty-gradebook-service.ts` | `getFacultyPublishedGradebookLearner` — `tests/unit/chat3-faculty-gradebook-service-journey.test.ts` (not executed) |
| `src/modules/courses/faculty-inbox-query-model.ts` | `parseFacultyInboxQuery`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-month-model.ts` | `facultyMonthQuerySchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-month-model.ts` | `istDateKey`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-month-model.ts` | `currentIstMonth`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-month-model.ts` | `shiftMonth`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-month-model.ts` | `facultyMonthGrid`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-month-model.ts` | `facultyMonthHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-month-service.ts` | `getFacultyIstMonth`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `FACULTY_IST_QUARTER_MINUTES`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `FACULTY_IST_NOTE`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `facultyIstTimeParts`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `facultyIstWallTime`: GAP — behavioural test needed |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `facultyIstQuarterHourIssue`: GAP — behavioural test needed |
| `src/modules/courses/faculty-lesson-visibility-model.ts` | `lessonVisibilityCommandSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-lesson-visibility-model.ts` | `lessonVisibleToReader`: GAP — behavioural test needed |
| `src/modules/courses/faculty-lesson-visibility-model.ts` | `mayEditLessonStudentVisibility`: GAP — behavioural test needed |
| `src/modules/courses/faculty-lesson-visibility-staged.ts` | `filterStagedStudentVisibleLessonContents`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-classes-model.ts` | `facultyLiveClassesQuerySchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-classes-model.ts` | `safeHttpsMeetingLink`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-classes-model.ts` | `pageFacultyLiveClasses`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-classes-model.ts` | `facultyLiveClassesHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-classes-service.ts` | `getFacultyLiveClasses`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-confirmation.ts` | `facultyLiveConfirmText`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-editor-command.ts` | `facultyLiveEditorCommand`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-editor-model.ts` | `facultyLiveEditorDraft`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-editor-model.ts` | `emptyFacultyLiveDraft`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-lock-model.ts` | `facultyLiveDeliveryLockKey`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-mutation-model.ts` | `facultyLiveMutationParamsSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-mutation-model.ts` | `facultyLiveMutationSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-mutation-model.ts` | `facultyLiveWindow`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-mutation-service.ts` | `commandFacultyLiveClass`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-published-policy.ts` | `facultyLivePublishedMutationAllowed`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-save-feedback.ts` | `facultyLiveSaveFeedback`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-session-option.ts` | `facultyLiveSessionOption`: GAP — behavioural test needed |
| `src/modules/courses/faculty-live-success.ts` | `facultyLiveMutationSuccess`: GAP — behavioural test needed |
| `src/modules/courses/faculty-manual-grade-receipt.ts` | `FacultyManualGradeReceiptError`: GAP — behavioural test needed |
| `src/modules/courses/faculty-manual-grade-receipt.ts` | `facultyManualGradeReceipt`: GAP — behavioural test needed |
| `src/modules/courses/faculty-manual-grade-receipt.ts` | `beginFacultyManualGradeOperation`: GAP — behavioural test needed |
| `src/modules/courses/faculty-manual-grade-receipt.ts` | `facultyManualGradeUncertainMessage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-manual-grade-receipt.ts` | `facultyManualGradePublishPrompt`: GAP — behavioural test needed |
| `src/modules/courses/faculty-manual-grade-receipt.ts` | `facultyManualGradeNeedsRefresh`: GAP — behavioural test needed |
| `src/modules/courses/faculty-manual-grade-receipt.ts` | `facultyManualGradeSuccessMessage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-notices-model.ts` | `facultyNoticeParamsSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-notices-model.ts` | `FACULTY_SECTION_NOTICES_BLOCKER`: GAP — behavioural test needed |
| `src/modules/courses/faculty-notices-service.ts` | `getFacultySectionNotices`: GAP — behavioural test needed |
| `src/modules/courses/faculty-notification-link-model.ts` | `facultyNotificationActionHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-profile-teaching-model.ts` | `facultyProfileTeachingQuerySchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-profile-teaching-model.ts` | `pageOwnFacultyTeaching`: GAP — behavioural test needed |
| `src/modules/courses/faculty-profile-teaching-model.ts` | `ownFacultyTeachingHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-profile-teaching-service.ts` | `getOwnFacultyTeachingSection`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-attempts-model.ts` | `facultyQuizAttemptsQuerySchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-attempts-model.ts` | `facultyQuizAttemptSearchSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-attempts-model.ts` | `facultyQuizAttemptsPage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-attempts-model.ts` | `facultyQuizAttemptsHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-attempts-model.ts` | `facultySearchQuizAttempts`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-attempts-service.ts` | `getFacultyQuizAttemptDrilldown`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-model.ts` | `facultyQuizParamsSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-model.ts` | `facultyQuizCommandSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-model.ts` | `sumQuizPoints`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-model.ts` | `facultyQuizVersionMatches`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-model.ts` | `facultyQuizLegacyEdit`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-model.ts` | `facultyQuizMetadataUnchanged`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-model.ts` | `facultyQuizAttemptLimitLocked`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-authoring-service.ts` | `commandFacultyQuiz`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyAuthoringQuestionsFromResponse`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizDraftIssue`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyChangeQuizChoiceType`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizDraftEditable`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizMetadataEditable`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyToggleQuizAnswer`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyRemoveQuizOption`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizConfirmationAfterEdit`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyRemoveQuizQuestion`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyAppendQuizQuestion`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizDraftLoadAllowsAction`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizMetadataIssue`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizWriteMessage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizCanRetryDetails`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizCanPublishSavedDraft`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizSavedFromCommand`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizReconcileRows`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyMoveQuizQuestion`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyMoveQuizOption`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyDuplicateQuizQuestion`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyDuplicateQuizOption`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizSwitchNeedsConfirmation`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyBeginQuizWrite`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizDraftReview`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizCanSaveChanges`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizMayResetDraft`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizCanCopyToDraft`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizCopyTitle`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizNormalizeQuestions`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizMatchesSearch`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizQuestionMatches`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizQuestionIssue`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizAnswerSummary`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyInsertQuizQuestionAfter`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyMoveQuizQuestionToEdge`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyInsertQuizOptionAfter`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizOptionRemovalNeedsConfirmation`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizQuestionRemovalPrompt`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizApplyPastedOptions`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizLoadedBankIssue`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizRetryNeedsConfirmation`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizTitleConflict`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizReviewIssues`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizShouldDisplayQuestion`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizReadErrorMessage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizOptionRemovalPrompt`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-builder-model.ts` | `facultyQuizReadyToPublish`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-csv-cap.ts` | `FACULTY_QUIZ_CSV_MAX_ROWS`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-csv-cap.ts` | `capFacultyQuizCsvRows`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-csv-cap.ts` | `facultyQuizCsvNotice`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-csv-cap.ts` | `selectFacultyQuizCsvRows`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-question-csv-service.ts` | `getFacultyQuizQuestionCsvForDownload`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-question-csv.ts` | `FACULTY_QUIZ_QUESTION_CSV_MAX_ROWS`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-question-csv.ts` | `facultyQuizQuestionAccuracyCsv` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-quiz-report-route-errors.ts` | `hidesFacultyQuizRouteError`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-request-body.ts` | `FACULTY_QUIZ_COMMAND_LIMIT_BYTES`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-request-body.ts` | `FacultyQuizBodyError`: GAP — behavioural test needed |
| `src/modules/courses/faculty-quiz-request-body.ts` | `facultyQuizAcceptsContentType` — `tests/unit/COURSES-BREAK-FACULTY-02.test.ts` (not executed) |
| `src/modules/courses/faculty-quiz-request-body.ts` | `readFacultyQuizCommandBody` — `tests/unit/COURSES-BREAK-FACULTY-02.test.ts` (not executed) |
| `src/modules/courses/faculty-quiz-results-command-model.ts` | `facultyQuizResultsCommandSchema` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (not executed) |
| `src/modules/courses/faculty-quiz-results-command-model.ts` | `facultyQuizResultsTransition` — `tests/unit/COURSES-BREAK-FACULTY-01.test.ts` (not executed) |
| `src/modules/courses/faculty-quiz-results-command-service.ts` | `commandFacultyQuizResults` — `tests/unit/COURSES-BREAK-FACULTY-03.test.ts` (not executed) |
| `src/modules/courses/faculty-quiz-results-legacy-model.ts` | `legacyQuizResultsWriteAllowed`: GAP — behavioural test needed |
| `src/modules/courses/faculty-regrade-feedback-model.ts` | `facultyRegradeFeedbackAllowed`: GAP — behavioural test needed |
| `src/modules/courses/faculty-report-completeness.ts` | `facultyReportIsIncomplete`: GAP — behavioural test needed |
| `src/modules/courses/faculty-report-csv-request.ts` | `facultyReportCsvRequestSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-report-csv-request.ts` | `facultyReportCsvHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-report-csv-request.ts` | `parseFacultyCsvDownloadUrl`: GAP — behavioural test needed |
| `src/modules/courses/faculty-report-csv-request.ts` | `facultyCsvAttachmentHeaders`: GAP — behavioural test needed |
| `src/modules/courses/faculty-report-csv-service.ts` | `getFacultyReportCsvForDownload`: GAP — behavioural test needed |
| `src/modules/courses/faculty-report-csv.ts` | `facultyReportCsvSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-report-csv.ts` | `neutralizeFacultyCsvCell` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-report-csv.ts` | `facultyReportCsv` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-report-csv.ts` | `facultyReportCsvFilename` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-report-csv.ts` | `facultyCsvIstTimestamp` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-report-csv.ts` | `FACULTY_REPORT_CSV_MAX_ROWS`: GAP — behavioural test needed |
| `src/modules/courses/faculty-report-csv.ts` | `capFacultyReportCsvRows` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-report-csv.ts` | `facultyCsvLearnerLabel` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-report-pdf.ts` | `buildFacultyReportPdf`: GAP — behavioural test needed |
| `src/modules/courses/faculty-report-students.ts` | `FACULTY_REPORT_PAGE_SIZE`: GAP — behavioural test needed |
| `src/modules/courses/faculty-report-students.ts` | `facultyReportStudentPage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-report-students.ts` | `facultyReportLearnerName`: GAP — behavioural test needed |
| `src/modules/courses/faculty-report-time.ts` | `facultyReportIstTimestamp`: GAP — behavioural test needed |
| `src/modules/courses/faculty-reports-hub-model.ts` | `facultyReportsHubQuerySchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-reports-hub-model.ts` | `facultyReportHubHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-reports-hub-model.ts` | `publishedReportBreakdown`: GAP — behavioural test needed |
| `src/modules/courses/faculty-reports-hub-model.ts` | `attendanceReportCounts`: GAP — behavioural test needed |
| `src/modules/courses/faculty-reports-hub-model.ts` | `parseFacultyReportsHubLocation`: GAP — behavioural test needed |
| `src/modules/courses/faculty-reports-hub-service.ts` | `getFacultyReportsHub`: GAP — behavioural test needed |
| `src/modules/courses/faculty-response-followup-model.ts` | `facultyResponseFollowUpQuerySchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-response-followup-model.ts` | `selectPastDueAssessments`: GAP — behavioural test needed |
| `src/modules/courses/faculty-response-followup-model.ts` | `facultyResponseFollowUpPage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-response-followup-model.ts` | `facultyResponseFollowUpHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-response-followup-model.ts` | `limitedMissingLearners`: GAP — behavioural test needed |
| `src/modules/courses/faculty-response-followup-model.ts` | `parseFacultyFollowUpSearchParams`: GAP — behavioural test needed |
| `src/modules/courses/faculty-response-followup-model.ts` | `facultyFollowupEmptyState`: GAP — behavioural test needed |
| `src/modules/courses/faculty-response-followup-service.ts` | `getFacultyResponseFollowUps`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-export.ts` | `facultyResultsCsvCell`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-export.ts` | `facultyResultExportAverage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-export.ts` | `facultyResultsPageCsv` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-results-export.ts` | `facultyResultsCsvHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-model.ts` | `facultyResultsQuerySchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-model.ts` | `safeFacultyDueTime`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-model.ts` | `filterFacultyResultCandidates`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-model.ts` | `paginateFacultyResults`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-model.ts` | `facultyResultsHref`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-model.ts` | `facultyRecordedResponseRate`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-model.ts` | `parseFacultyResultsSearchParams`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-model.ts` | `facultyResultsEmptyState`: GAP — behavioural test needed |
| `src/modules/courses/faculty-results-service.ts` | `getFacultyAssessmentResults`: GAP — behavioural test needed |
| `src/modules/courses/faculty-roster-display-model.ts` | `facultyRosterDisplayName`: GAP — behavioural test needed |
| `src/modules/courses/faculty-roster-display-model.ts` | `sortFacultyRosterByRollThenName`: GAP — behavioural test needed |
| `src/modules/courses/faculty-roster-display-model.ts` | `facultyRosterMetrics`: GAP — behavioural test needed |
| `src/modules/courses/faculty-roster-display-model.ts` | `facultyRosterPhotoPreview`: GAP — behavioural test needed |
| `src/modules/courses/faculty-roster-export.ts` | `facultyRosterCsv` — `tests/unit/COURSES-BREAK-FACULTY-04.test.ts` (not executed) |
| `src/modules/courses/faculty-roster-export.ts` | `facultyRosterFileName`: GAP — behavioural test needed |
| `src/modules/courses/faculty-route-access-model.ts` | `canAccessFacultyRoute`: GAP — behavioural test needed |
| `src/modules/courses/faculty-schedule-service.ts` | `getFacultyClassSchedule`: GAP — behavioural test needed |
| `src/modules/courses/faculty-session-coverage-model.ts` | `facultySessionCoverageSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-session-coverage-model.ts` | `facultySessionCoverage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-session-coverage-service.ts` | `getFacultySessionCoverage`: GAP — behavioural test needed |
| `src/modules/courses/faculty-student-detail-model.ts` | `facultyStudentDetailParamsSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-student-detail-model.ts` | `findAuthorizedFacultyStudent`: GAP — behavioural test needed |
| `src/modules/courses/faculty-student-detail-model.ts` | `summarizeFacultyStudentAttendance`: GAP — behavioural test needed |
| `src/modules/courses/faculty-student-detail-service.ts` | `getFacultyStudentDetail`: GAP — behavioural test needed |
| `src/modules/courses/faculty-submission-content-model.ts` | `facultySubmissionContentSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-submission-content-model.ts` | `facultySubmissionContentView`: GAP — behavioural test needed |
| `src/modules/courses/faculty-submission-review-model.ts` | `facultySubmissionReviewRowSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-submission-review-model.ts` | `facultySubmissionReviewResponseSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-submission-review-model.ts` | `facultySubmissionReviewResponse`: GAP — behavioural test needed |
| `src/modules/courses/faculty-submission-review-model.ts` | `facultySubmissionReviewMatchesScope`: GAP — behavioural test needed |
| `src/modules/courses/faculty-submission-review-model.ts` | `facultySubmissionReviewEmptyLabel`: GAP — behavioural test needed |
| `src/modules/courses/faculty-submission-review-model.ts` | `facultyReviewRequestCurrent`: GAP — behavioural test needed |
| `src/modules/courses/faculty-submission-review-model.ts` | `facultySubmissionReviewFailure`: GAP — behavioural test needed |
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
| `src/modules/courses/faculty-video-storage-model.ts` | `managedVideoSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-storage-model.ts` | `parseManagedVideos`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-storage-model.ts` | `facultyVideoMayPublish`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-storage-model.ts` | `facultyVideoMayReplace`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-storage-model.ts` | `facultyVideoMayPreview`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-storage-model.ts` | `facultyVideoPublishAction`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-storage-model.ts` | `facultyVideoReorderPlan`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-storage-model.ts` | `videoUploadGrantSchema`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-storage-model.ts` | `parseFacultyVideoUploadGrant`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-storage-model.ts` | `managedVideoAfterAction`: GAP — behavioural test needed |
| `src/modules/courses/faculty-video-storage-model.ts` | `facultyVideoStatus`: GAP — behavioural test needed |

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
