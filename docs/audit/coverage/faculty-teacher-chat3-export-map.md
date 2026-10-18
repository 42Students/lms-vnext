# Faculty source export inventory — chat-3

GitHub source declaration review, October 19, 2026. **This is a symbol map, not behavioral or passing test evidence.** It complements `faculty-teacher-chat3-inventory.md` and `chat3-faculty-teacher-ledger.md`. No CI, TypeScript, PostgreSQL or UI tests were executed.

**Target:** 114 `src/modules/courses/faculty-*.ts` files; other attendance, shared course, UI and API files are tracked separately.

| Source file | Named runtime exports | Type/interface exports | LOC | Evidence status |
|---|---|---|---:|---|
| `src/modules/courses/faculty-assessment-batch-model.ts` | `facultyAssessmentVisibleToDelivery`, `nextFacultyLessonContentSequence` | — | 24 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assessment-editor-model.ts` | `facultyAssessmentLimitEditable`, `facultyAssessmentLimitPatch`, `facultyAssessmentCanArchive`, `facultyAssessmentEditReceiptMatches`, `facultyAssessmentArchiveReceiptMatches` | — | 38 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assessment-filter.ts` | `filterFacultyAssessments` | `FacultyAssessmentFilterQuery` | 34 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assessment-report-service.ts` | `facultyReportCurrentRosterRows`, `buildScoreDistribution`, `latestQuizAttemptsByLearner`, `questionAccuracy`, `assignmentScoreSummary`, `scoreSummary`, `getFacultyQuizReport`, `getFacultyAssignmentReport` | `ScoreDistributionBucket` | 362 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assessment-route-boundary.ts` | `parseFacultyAssessmentReportRoute`, `facultyAssignmentReportHidden`, `facultyQuizReportHidden` | — | 24 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assessment-service.ts` | `getFacultyAssessmentOverview` | — | 159 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assignment-authoring-model.ts` | `facultyAssignmentParamsSchema`, `facultyAssignmentCommandSchema`, `assignmentFieldsChanged`, `facultyAssignmentMethodsChanged`, `facultyAssignmentVersionMatches`, `facultyAssignmentLegacyEdit`, `facultyAssignmentEditLockedBySubmissions` | `FacultyAssignmentCommand` | 88 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assignment-authoring-service.ts` | `commandFacultyAssignment`, `getFacultyAssignmentMethods` | — | 167 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assignment-editor-ui-model.ts` | `facultyAssignmentDraftDirty`, `facultyAssignmentDraftIssue`, `facultyAssignmentCommandReceipt`, `facultyAssignmentMaySubmit`, `facultyAssignmentConfirmationOnEdit`, `facultyAssignmentSwitchNeedsConfirmation`, `facultyAssignmentArchiveWarning`, `facultyAssignmentPublishIssue`, `facultyAssignmentCommandError`, `facultyAssignmentCanSaveDraft` | `FacultyAssignmentAction` | 100 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assignment-grading-policy.ts` | `facultyAssignmentGradingAllowed`, `facultyAssignmentGradePublicationAllowed` | — | 8 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assignment-method-load-model.ts` | `verifiedFacultyAssignmentMethodsResponse`, `facultyAssignmentMethodsLoadVersion` | — | 24 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assignment-methods-query.ts` | `parseFacultyAssignmentMethodsQuery` | — | 17 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assignment-request-body.ts` | `FACULTY_ASSIGNMENT_COMMAND_LIMIT_BYTES`, `FacultyAssignmentBodyError`, `facultyAssignmentAcceptsContentType`, `readFacultyAssignmentCommandBody` | — | 72 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-assignment-submissions-model.ts` | `facultySubmissionFilterSchema`, `facultySubmissionListQuerySchema`, `facultySubmissionReportPageQuerySchema`, `facultySubmissionReportSearchSchema`, `selectFacultyAssignmentSubmissions`, `facultySubmissionListPage`, `facultySubmissionListHref`, `parseFacultySubmissionReviewUrl`, `facultySubmissionReviewApiHref`, `facultySortSubmissionReportRows`, `facultySearchSubmissionReportRows`, `facultyFilterSubmissionPublication`, `facultySubmissionReportEmptyState`, `facultySubmissionCsvScopeNote` | `FacultySubmissionFilter`, `FacultySubmissionListQuery` | 145 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-authoring-datetime-model.ts` | `authoringLocalDateTime`, `authoringDueInstant`, `assignmentActionAvailable` | — | 25 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-authoring-request-body.ts` | `FACULTY_AUTHORING_LIMIT_BYTES`, `FacultyAuthoringBodyError`, `readFacultyAuthoringBody` | — | 68 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-contact-detail-model.ts` | `facultyContactDetailParamsSchema`, `facultyContactRoleLabel`, `facultyContactTabMatches`, `facultyContactDetailHref`, `facultyContactDetailHidden`, `facultyContactDirectoryQuery` | — | 48 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-contacts-filter-model.ts` | `parseFacultyContactsQuery` | — | 16 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-contacts-service.ts` | `listFacultyContacts`, `getFacultyContactDetail` | — | 149 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-content-edit-model.ts` | `facultyContentPatch`, `facultyContentDraftChanged`, `facultyContentMayChangeOpen`, `facultyContentSaveReceiptMatches`, `facultyContentMaySave` | `EditableContent`, `FacultyContentDraftSnapshot` | 98 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-content-input-model.ts` | `facultyYouTubeLinkIssue`, `facultyLiveClassIssue` | — | 36 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-content-order-ui-model.ts` | `facultyMoveContentId`, `facultyContentOrderDirty`, `facultyResetContentOrder`, `facultyContentOrderValid`, `facultyContentOrderReceiptMatches` | — | 36 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-content-preview-model.ts` | `facultyContentExternalHref`, `facultyYouTubeEmbed` | — | 25 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-course-card-summary-model.ts` | `countFacultyCourseCardItems` | — | 34 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-course-card-summary-service.ts` | `listFacultyCourseCardSummaries` | `FacultyCourseCardSummary` | 95 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-course-health-model.ts` | `facultyCourseHealthParamsSchema`, `selectFacultyCourseHealthCandidates`, `facultyCourseHealthHref`, `responseCoverage` | `FacultyCourseHealthParams`, `FacultyCourseHealthCandidate` | 64 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-course-health-service.ts` | `getFacultyCourseAssessmentHealth` | — | 84 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-course-home-model.ts` | `buildFacultyCourseHomeSignals` | — | 401 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-course-home-service.ts` | `getFacultyCourseHomeSignals` | — | 75 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-course-list-model.ts` | `facultyCourseListQuerySchema`, `FACULTY_COURSE_LIST_PAGE_SIZE`, `pageFacultyCourseList`, `facultyCourseListHref`, `facultyCourseWorkspaceRevokedError`, `parseFacultyCourseListLocation` | `FacultyCourseListQuery` | 63 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-course-list-service.ts` | `getFacultyCourseList` | — | 23 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-course-navigation.ts` | `facultyCourseTabs`, `isFacultyCourseTab`, `facultyCourseTabHref`, `facultyCourseTabFromPath`, `validFacultyDefaultDeliveryId` | `FacultyCourseTab` | 29 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-course-route-errors.ts` | `hidesFacultyCourseRouteError` | — | 12 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-course-service.ts` | `listFacultyCourseDeliveries`, `getFacultyCourseWorkspace` | — | 335 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-discussion-history-model.ts` | `facultyDiscussionHistorySchema`, `discussionHistoryPagination`, `facultyDiscussionHistoryHref`, `discussionHistoryLabel`, `parseFacultyDiscussionHistoryLocation` | `FacultyDiscussionHistoryQuery` | 41 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-discussion-history-service.ts` | `getFacultyDiscussionHistory` | — | 54 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-discussion-moderation-model.ts` | `facultyDiscussionModerationSchema`, `facultyDiscussionTokenMatches` | — | 12 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-discussion-participation-model.ts` | `facultyDiscussionParticipationSchema`, `facultyDiscussionParticipationSummary` | `FacultyDiscussionCountRow` | 10 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-discussion-participation-service.ts` | `getFacultyDiscussionParticipation` | — | 38 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-discussion-reply-model.ts` | `facultyDiscussionReplySchema`, `facultyReplyParentTokenMatches` | — | 12 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-discussion-reply-service.ts` | `postFacultyDiscussionReply` | — | 24 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-followup-export.ts` | `facultyFollowUpPageCsv`, `facultyFollowUpCsvHref` | — | 22 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-grade-editor-model.ts` | `facultyGradeEditorState` | — | 27 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-grade-noop-model.ts` | `facultyGradeHasChanges` | — | 9 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-gradebook-model.ts` | `facultyGradebookParamsSchema`, `facultyPublishedGradeRows`, `facultyGradebookCsv`, `facultyPublishedLearnerBreakdown`, `facultyGradebookViewQuerySchema`, `paginateFacultyGradebookRows`, `facultyGradebookViewHref`, `facultyGradebookPrivateNotFound` | `GradebookScore`, `GradebookLearner`, `FacultyGradebookRow`, `FacultyGradebookAssessment`, `FacultyGradebookViewQuery` | 141 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-gradebook-report-batch.ts` | `mapFacultyGradebookReportBatch` | — | 14 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-gradebook-service.ts` | `getFacultyPublishedGradebook`, `getFacultyPublishedGradebookLearner` | — | 101 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-inbox-query-model.ts` | `parseFacultyInboxQuery` | — | 27 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-ist-month-model.ts` | `facultyMonthQuerySchema`, `istDateKey`, `currentIstMonth`, `shiftMonth`, `facultyMonthGrid`, `facultyMonthHref` | `FacultyMonthQuery`, `FacultyMonthCourse`, `FacultyMonthEvent` | 74 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-ist-month-service.ts` | `getFacultyIstMonth` | — | 26 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-ist-quarter-hour-model.ts` | `FACULTY_IST_QUARTER_MINUTES`, `FACULTY_IST_NOTE`, `facultyIstTimeParts`, `facultyIstWallTime`, `facultyIstQuarterHourIssue` | — | 26 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-lesson-visibility-model.ts` | `lessonVisibilityCommandSchema`, `lessonVisibleToReader`, `mayEditLessonStudentVisibility` | — | 27 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-lesson-visibility-staged.ts` | `filterStagedStudentVisibleLessonContents` | — | 30 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-live-classes-model.ts` | `facultyLiveClassesQuerySchema`, `safeHttpsMeetingLink`, `pageFacultyLiveClasses`, `facultyLiveClassesHref`, `mapFacultyLiveWorkspacesInBatches` | `FacultyLiveClassesQuery`, `FacultyLiveClass` | 73 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-live-classes-service.ts` | `getFacultyLiveClasses` | — | 41 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-live-confirmation.ts` | `facultyLiveConfirmText` | — | 12 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-live-editor-command.ts` | `facultyLiveEditorCommand` | — | 25 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-live-editor-model.ts` | `facultyLiveEditorDraft`, `emptyFacultyLiveDraft` | `FacultyLiveEditableSession` | 15 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-live-lock-model.ts` | `facultyLiveDeliveryLockKey` | — | 5 | Declared; behavioral verification pending |
| `src/modules/courses/faculty-live-mutation-model.ts` | `facultyLiveMutationParamsSchema`, `facultyLiveMutationSchema`, `facultyLiveWindow` | — | 58 | Declared; behavioral verification pending |
