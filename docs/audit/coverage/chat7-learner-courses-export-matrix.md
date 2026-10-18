# chat-7 Learner Courses exported symbol inventory

19 October 2026. Source-only, no test execution. `src/modules/courses/learner-*.ts` has 129 files; entries below represent top-level named TypeScript exports inspected through the connected GitHub branch. An unlinked entry is **not** proof of no test elsewhere; this is an incomplete direct-behavioural crosswalk. Remaining Files, API route exports and imported symbols require separate review.

| File | Export | Direct test crosswalk |
|---|---|---|
| `learner-access-guard.ts` | `requireOwnCourseLearnerRead` | Not individually linked in this inventory |
| `learner-assessment-action-counts-model.ts` | `learnerAssessmentActionCounts` | Not individually linked in this inventory |
| `learner-assessment-active-course-model.ts` | `learnerAssessmentActiveCourse` | Not individually linked in this inventory |
| `learner-assessment-clock-model.ts` | `learnerAssessmentClock` | Not individually linked in this inventory |
| `learner-assessment-course-counts-model.ts` | `learnerAssessmentCourseCounts` | Not individually linked in this inventory |
| `learner-assessment-course-query-model.ts` | `learnerAssessmentAuthorizedCourse` | Not individually linked in this inventory |
| `learner-assessment-course-query-model.ts` | `learnerAssessmentCourseHref` | Not individually linked in this inventory |
| `learner-assessment-course-scope-count-model.ts` | `learnerAssessmentCourseScopeCount` | Not individually linked in this inventory |
| `learner-assessment-date-label-model.ts` | `learnerAssessmentDateLabel` | Not individually linked in this inventory |
| `learner-assessment-drawer-scope-model.ts` | `learnerAssessmentDrawerSelectionAllowed` | Not individually linked in this inventory |
| `learner-assessment-empty-model.ts` | `learnerAssessmentEmptyMessage` | Not individually linked in this inventory |
| `learner-assessment-filters-active-model.ts` | `learnerAssessmentFiltersActive` | Not individually linked in this inventory |
| `learner-assessment-flat-query.ts` | `listOwnLearnerAssessmentRows` | Not individually linked in this inventory |
| `learner-assessment-page-summary-model.ts` | `learnerAssessmentPageSummary` | Authored direct model regression, unrun |
| `learner-assessment-quick-counts-model.ts` | `LEARNER_ASSESSMENT_QUICK_STATES` | Not individually linked in this inventory |
| `learner-assessment-quick-counts-model.ts` | `LearnerAssessmentQuickState` | Not individually linked in this inventory |
| `learner-assessment-quick-counts-model.ts` | `learnerAssessmentQuickCounts` | Authored direct model regression, unrun |
| `learner-assessment-scope-attention-model.ts` | `learnerAssessmentScopedItems` | Not individually linked in this inventory |
| `learner-assessment-search-model.ts` | `normalizeLearnerAssessmentSearch` | Authored direct model regression, unrun |
| `learner-assessment-search-model.ts` | `learnerAssessmentMatchesSearch` | Authored direct model regression, unrun |
| `learner-assessment-service.ts` | `getLearnerAssessmentOverview` | Not individually linked in this inventory |
| `learner-assessment-sort-model.ts` | `LEARNER_ASSESSMENT_SORT_OPTIONS` | Not individually linked in this inventory |
| `learner-assessment-sort-model.ts` | `LearnerAssessmentSort` | Not individually linked in this inventory |
| `learner-assessment-sort-model.ts` | `learnerAssessmentSort` | Authored direct model regression, unrun |
| `learner-assessment-state-filter-model.ts` | `LEARNER_ASSESSMENT_STATE_OPTIONS` | Not individually linked in this inventory |
| `learner-assessment-state-filter-model.ts` | `LearnerAssessmentStateFilter` | Not individually linked in this inventory |
| `learner-assessment-state-filter-model.ts` | `learnerAssessmentMatchesState` | Not individually linked in this inventory |
| `learner-assessment-submitted-link-model.ts` | `learnerAssessmentSubmittedLinkHref` | Authored direct model regression, unrun |
| `learner-assignment-confirmation-model.ts` | `learnerAssignmentFinalConfirmation` | Authored direct model regression, unrun |
| `learner-assignment-detail-model.ts` | `learnerAssignmentDetailQuery` | Not individually linked in this inventory |
| `learner-assignment-detail-model.ts` | `findOwnLearnerAssignment` | Not individually linked in this inventory |
| `learner-assignment-display.ts` | `AssignmentDisplayInput` | Not individually linked in this inventory |
| `learner-assignment-display.ts` | `assignmentOverviewState` | Not individually linked in this inventory |
| `learner-assignment-due-notice-model.ts` | `LearnerDueSource` | Not individually linked in this inventory |
| `learner-assignment-due-notice-model.ts` | `LearnerDueNotice` | Not individually linked in this inventory |
| `learner-assignment-due-notice-model.ts` | `learnerDueSoonNotices` | Authored direct model regression, unrun |
| `learner-assignment-file-model.ts` | `learnerAssignmentFileAccept` | Not individually linked in this inventory |
| `learner-assignment-file-model.ts` | `learnerAssignmentFileRequest` | Not individually linked in this inventory |
| `learner-assignment-file-model.ts` | `learnerAssignmentUploadGrantSchema` | Not individually linked in this inventory |
| `learner-assignment-file-model.ts` | `learnerAssignmentUploadHeadersSafe` | Not individually linked in this inventory |
| `learner-assignment-file-model.ts` | `validateLearnerAssignmentUploadGrant` | Not individually linked in this inventory |
| `learner-assignment-file-model.ts` | `learnerAssignmentFilePayload` | Not individually linked in this inventory |
| `learner-assignment-file-model.ts` | `learnerAssignmentReadGrantSchema` | Not individually linked in this inventory |
| `learner-assignment-file-model.ts` | `validateLearnerAssignmentReadGrant` | Not individually linked in this inventory |
| `learner-assignment-file-selection-model.ts` | `selectLearnerAssignmentFile` | Not individually linked in this inventory |
| `learner-assignment-grade-label-model.ts` | `learnerAssignmentPublishedGradeLabel` | Authored direct model regression, unrun |
| `learner-assignment-link-model.ts` | `learnerAssignmentHttpsLinkSchema` | Not individually linked in this inventory |
| `learner-assignment-link-model.ts` | `isLearnerAssignmentHttpsLink` | Not individually linked in this inventory |
| `learner-assignment-materials-model.ts` | `facultyAssignmentMaterialLinkSchema` | Not individually linked in this inventory |
| `learner-assignment-materials-model.ts` | `FacultyAssignmentMaterialLink` | Not individually linked in this inventory |
| `learner-assignment-materials-model.ts` | `safeLearnerAssignmentMaterialLink` | Not individually linked in this inventory |
| `learner-assignment-materials-service.ts` | `assignmentMaterialTableReady` | Not individually linked in this inventory |
| `learner-assignment-materials-service.ts` | `listOwnLearnerAssignmentMaterialLinks` | Not individually linked in this inventory |
| `learner-assignment-materials-service.ts` | `commandFacultyAssignmentMaterialLink` | Not individually linked in this inventory |
| `learner-assignment-methods-service.ts` | `getLearnerAssignmentMethods` | Not individually linked in this inventory |
| `learner-assignment-mobile-model.ts` | `learnerAssignmentMobileState` | Not individually linked in this inventory |
| `learner-assignment-notification-model.ts` | `learnerAssignmentPublishedNotice` | Not individually linked in this inventory |
| `learner-course-about-model.ts` | `learnerCourseAboutSource` | Not individually linked in this inventory |
| `learner-course-active-filters-model.ts` | `LearnerCourseActiveFilters` | Not individually linked in this inventory |
| `learner-course-active-filters-model.ts` | `learnerCourseHasActiveFilters` | Authored direct model regression, unrun |
| `learner-course-announcements-service.ts` | `listLearnerCourseClassAnnouncements` | Not individually linked in this inventory |
| `learner-course-card-date-model.ts` | `learnerCourseCardDate` | Not individually linked in this inventory |
| `learner-course-card-due-label-model.ts` | `learnerCourseCardDueLabel` | Not individually linked in this inventory |
| `learner-course-card-media-model.ts` | `learnerCourseCardMedia` | Not individually linked in this inventory |
| `learner-course-card-media-model.ts` | `learnerCourseFallbackMedia` | Not individually linked in this inventory |
| `learner-course-card-media-model.ts` | `learnerCourseCardMediaAfterError` | Not individually linked in this inventory |
| `learner-course-card-next-label-model.ts` | `learnerCourseCardNextLabel` | Not individually linked in this inventory |
| `learner-course-card-progress-model.ts` | `learnerCourseCardProgress` | Authored direct model regression, unrun |
| `learner-course-card-search-model.ts` | `learnerCourseMatchesSearch` | Not individually linked in this inventory |
| `learner-course-continue-model.ts` | `learnerCourseHasContinueAction` | Authored direct model regression, unrun |
| `learner-course-copy-model.ts` | `LEARNER_BACK_TO_COURSES` | Not individually linked in this inventory |
| `learner-course-copy-model.ts` | `LEARNER_COURSE_SEARCH_PLACEHOLDER` | Not individually linked in this inventory |
| `learner-course-credit-summary-model.ts` | `learnerCourseCreditSummary` | Not individually linked in this inventory |
| `learner-course-current-period-model.ts` | `resolveLearnerCoursePeriod` | Not individually linked in this inventory |
| `learner-course-date-model.ts` | `formatLearnerCourseMoment` | Not individually linked in this inventory |
| `learner-course-drilldown-model.ts` | `learnerAttendanceMonthSchema` | Not individually linked in this inventory |
| `learner-course-drilldown-model.ts` | `LearnerLessonProgressInput` | Not individually linked in this inventory |
| `learner-course-drilldown-model.ts` | `buildLearnerLessonProgress` | Not individually linked in this inventory |
| `learner-course-drilldown-model.ts` | `LearnerCourseAttendanceRecord` | Not individually linked in this inventory |
| `learner-course-drilldown-model.ts` | `buildLearnerCourseAttendanceMonths` | Not individually linked in this inventory |
| `learner-course-drilldown-service.ts` | `getOwnLearnerCourseProgressBreakdown` | Not individually linked in this inventory |
| `learner-course-drilldown-service.ts` | `getOwnLearnerCourseAttendanceHistory` | Not individually linked in this inventory |
| `learner-course-file-reference-service.ts` | `getLearnerCourseFileReference` | Not individually linked in this inventory |
| `learner-course-filtered-empty-model.ts` | `learnerCourseFilteredEmptyTitle` | Not individually linked in this inventory |
| `learner-course-home-action-label-model.ts` | `learnerCourseHomeActionLabel` | Not individually linked in this inventory |
| `learner-course-home-completion-model.ts` | `learnerCourseHomeCompletion` | Authored direct model regression, unrun |
| `learner-course-image-reset-key-model.ts` | `learnerCourseImageResetKey` | Not individually linked in this inventory |
| `learner-course-instructor-labels-model.ts` | `learnerCourseInstructorLabels` | Not individually linked in this inventory |
| `learner-course-list-concurrency-model.ts` | `mapLearnerCourseCardsLimited` | Not individually linked in this inventory |
| `learner-course-next-action-model.ts` | `learnerCourseNextItemHref` | Authored direct model regression, unrun |
| `learner-course-overdue-link-model.ts` | `selectLearnerOverdueAssignment` | Not individually linked in this inventory |
| `learner-course-overview-mobile-model.ts` | `LearnerCourseOverviewJump` | Not individually linked in this inventory |
| `learner-course-overview-mobile-model.ts` | `learnerCourseOverviewJumps` | Not individually linked in this inventory |
| `learner-course-overview-model.ts` | `CourseOverviewLesson` | Not individually linked in this inventory |
| `learner-course-overview-model.ts` | `learnerCourseListSignals` | Not individually linked in this inventory |
| `learner-course-path-preview-model.ts` | `LearnerPathPreviewInput` | Not individually linked in this inventory |
| `learner-course-path-preview-model.ts` | `learnerCoursePathPreview` | Not individually linked in this inventory |
| `learner-course-preferred-period-model.ts` | `learnerCoursePreferredPeriod` | Not individually linked in this inventory |
| `learner-course-progress-filter-model.ts` | `LearnerCourseProgressFilter` | Not individually linked in this inventory |
| `learner-course-progress-filter-model.ts` | `learnerCourseMatchesProgress` | Not individually linked in this inventory |
| `learner-course-result-summary-model.ts` | `learnerCourseResultSummary` | Authored direct model regression, unrun |
| `learner-course-semester-filter-model.ts` | `learnerCourseSemesterFilterReset` | Not individually linked in this inventory |
| `learner-course-service.ts` | `listLearnerCourseDeliveries` | Not individually linked in this inventory |
| `learner-course-service.ts` | `listLearnerCourseInstructors` | Not individually linked in this inventory |
| `learner-course-service.ts` | `getLearnerCourseWorkspace` | Not individually linked in this inventory |
| `learner-course-setup-copy.ts` | `LearnerCourseSetupStatus` | Not individually linked in this inventory |
| `learner-course-setup-copy.ts` | `learnerCourseSetupCopy` | Not individually linked in this inventory |
| `learner-course-setup-service.ts` | `getLearnerCourseSetupStatus` | Not individually linked in this inventory |
| `learner-course-setup-service.ts` | `listLearnerProgramSemesters` | Not individually linked in this inventory |
| `learner-course-sort-model.ts` | `LearnerCourseSortMode` | Not individually linked in this inventory |
| `learner-course-sort-model.ts` | `sortLearnerCourseCards` | Not individually linked in this inventory |
| `learner-course-tab-context-model.ts` | `learnerCourseTabPersistentQuery` | Not individually linked in this inventory |
| `learner-course-tab-route-model.ts` | `learnerCourseTabPath` | Not individually linked in this inventory |
| `learner-course-term-state-model.ts` | `LearnerCourseTermState` | Not individually linked in this inventory |
| `learner-course-term-state-model.ts` | `learnerCourseMatchesTermState` | Not individually linked in this inventory |
| `learner-course-type-availability-model.ts` | `LearnerCourseTypeFilter` | Not individually linked in this inventory |
| `learner-course-type-availability-model.ts` | `resolveLearnerCourseTypeFilter` | Not individually linked in this inventory |
| `learner-course-upcoming-quiz-model.ts` | `learnerUpcomingQuizEligible` | Not individually linked in this inventory |
| `learner-discussion-capability-model.ts` | `learnerDiscussionCanPost` | Not individually linked in this inventory |
| `learner-discussion-history-flight-model.ts` | `createLearnerDiscussionHistoryFlight` | Not individually linked in this inventory |
| `learner-discussion-message-limit-model.ts` | `LEARNER_DISCUSSION_MESSAGE_MAX_LENGTH` | Not individually linked in this inventory |
| `learner-discussion-message-limit-model.ts` | `learnerDiscussionDraftValid` | Authored direct model regression, unrun |
| `learner-discussion-refresh-order-model.ts` | `learnerDiscussionRefreshIsCurrent` | Not individually linked in this inventory |
| `learner-discussion-reply-model.ts` | `formatDiscussionReply` | Authored direct model regression, unrun |
| `learner-discussion-response-model.ts` | `learnerDiscussionListResponse` | Authored direct model regression, unrun |
| `learner-discussion-scope-key-model.ts` | `learnerDiscussionScopeKey` | Not individually linked in this inventory |
| `learner-discussion-submit-guard-model.ts` | `learnerDiscussionMayPost` | Authored direct model regression, unrun |
| `learner-discussion-time-model.ts` | `learnerDiscussionTimeLabel` | Not individually linked in this inventory |
| `learner-discussion-time-model.ts` | `learnerDiscussionRelativeTimeLabel` | Not individually linked in this inventory |
| `learner-external-content-link-model.ts` | `learnerSafeExternalContentHref` | Not individually linked in this inventory |
| `learner-file-action-cancel-model.ts` | `learnerFileUploadMayCancel` | Not individually linked in this inventory |
| `learner-latest-quiz-attempt-model.ts` | `selectLearnerLatestQuizAttempt` | Authored direct model regression, unrun |
| `learner-live-link-availability-model.ts` | `learnerVisibleContentExternalUrl` | Not individually linked in this inventory |
| `learner-manual-completion-model.ts` | `manualContentCompletionGate` | Not individually linked in this inventory |
| `learner-offering-delivery-model.ts` | `LearnerOfferingDeliveryResolution` | Not individually linked in this inventory |
| `learner-offering-delivery-model.ts` | `resolveLearnerOfferingDelivery` | Not individually linked in this inventory |
| `learner-overview-priority.ts` | `LearnerOverviewActivity` | Not individually linked in this inventory |
| `learner-overview-priority.ts` | `selectPriorityLearnerActivity` | Not individually linked in this inventory |
| `learner-playback-settings.ts` | `LEARNER_PLAYBACK_DEFAULTS` | Not individually linked in this inventory |
| `learner-playback-settings.ts` | `learnerPlaybackSettingValue` | Not individually linked in this inventory |
| `learner-playback-settings.ts` | `readLearnerPlaybackSettings` | Not individually linked in this inventory |
| `learner-program-semester-options-model.ts` | `LearnerSemesterOption` | Not individually linked in this inventory |
| `learner-program-semester-options-model.ts` | `LearnerProgramSemester` | Not individually linked in this inventory |
| `learner-program-semester-options-model.ts` | `learnerSemesterOptions` | Not individually linked in this inventory |
| `learner-progress-availability.ts` | `LearnerProgressAvailability` | Not individually linked in this inventory |
| `learner-progress-availability.ts` | `learnerProgressAvailability` | Not individually linked in this inventory |
| `learner-quiz-answer-edit-model.ts` | `clearLearnerQuizAnswer` | Not individually linked in this inventory |
| `learner-quiz-answer-progress-model.ts` | `learnerQuizAnswerProgress` | Not individually linked in this inventory |
| `learner-quiz-autosave-scope-model.ts` | `learnerQuizDraftCanPersist` | Not individually linked in this inventory |
| `learner-quiz-clock-interval-model.ts` | `learnerQuizClockInterval` | Not individually linked in this inventory |
| `learner-quiz-correctness-visibility-model.ts` | `canReviewLearnerQuizCorrectAnswers` | Not individually linked in this inventory |
| `learner-quiz-deadline-display-model.ts` | `learnerQuizDeadlineDisplay` | Not individually linked in this inventory |
| `learner-quiz-deadline-warning-model.ts` | `learnerQuizDeadlineWarning` | Not individually linked in this inventory |
| `learner-quiz-draft-scope-model.ts` | `normalizeLearnerQuizDraftForQuestions` | Not individually linked in this inventory |
| `learner-quiz-draft.ts` | `LearnerQuizDraft` | Not individually linked in this inventory |
| `learner-quiz-draft.ts` | `parseLearnerQuizDraft` | Not individually linked in this inventory |
| `learner-quiz-empty-question-model.ts` | `learnerQuizEmptyQuestionMessage` | Not individually linked in this inventory |
| `learner-quiz-history-model.ts` | `learnerQuizHistoryQuerySchema` | Authored direct model regression, unrun |
| `learner-quiz-history-model.ts` | `ownQuizHistorySelection` | Authored direct model regression, unrun |
| `learner-quiz-history-model.ts` | `learnerAttemptResultLabel` | Authored direct model regression, unrun |
| `learner-quiz-history-model.ts` | `learnerQuizAttemptDateLabel` | Authored direct model regression, unrun |
| `learner-quiz-history-model.ts` | `learnerQuizQuestionAwardLabel` | Authored direct model regression, unrun |
| `learner-quiz-history-model.ts` | `learnerQuizSelectedAnswerMessage` | Authored direct model regression, unrun |
| `learner-quiz-mobile-model.ts` | `learnerQuizMobileState` | Not individually linked in this inventory |
| `learner-quiz-question-nav-model.ts` | `learnerQuizQuestionNavState` | Not individually linked in this inventory |
| `learner-quiz-refresh-failure-model.ts` | `learnerQuizRefreshFailureMessage` | Not individually linked in this inventory |
| `learner-quiz-request-race-model.ts` | `learnerQuizRequestCurrent` | Not individually linked in this inventory |
| `learner-quiz-response-id-model.ts` | `requireLearnerQuizResponseId` | Not individually linked in this inventory |
| `learner-quiz-result-release-policy.ts` | `learnerQuizResultsReleased` | Not individually linked in this inventory |
