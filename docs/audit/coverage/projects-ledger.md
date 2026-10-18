# IIT Dharwad Projects — module-wide coverage ledger (chat-14)

Branch: `chatgpt/chat-14-b`; audit date 2026-10-18. **No release sign-off.** A missing test is marked `GAP`, never claimed as covered. Source/static assertions cannot substitute for behavioural, real PostgreSQL or browser tests; CI has not been run in this GitHub-only execution environment.

Sources reviewed: `docs/audit/coverage/projects-mentor-services-ledger.md` (mentor), `projects-chat9-admin-ledger.md` (admin/college), `projects-breaker-chat6-ledger.md` (breaker), `chat-17-projects-placements-pg-ledger.md` (database), `docs/audit/defects-chat-13.md` (Super Admin), `docs/audit/projects-defects.md` (chat-9 and chat-6). A reviewer other than the author must approve every fix.

## Module exports / schemas

| File | Exported symbol | Authored test | Evidence / outstanding cases |
|---|---|---|---|
| `src/modules/projects/access.ts` | `loadProjectScope` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/access.ts` | `requireProjectManageAccess` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/access.ts` | `requireProjectReadAccess` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/access.ts` | `requireProjectLifecycleAccess` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/access.ts` | `requireProjectLifecycleMutationAccess` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/activity-service.ts` | `getProjectActivityPage` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/activity-service.ts` | `listProjectActivity` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/admin-college-scope.ts` | `getProjectAdminCollegeId` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/admin-insights-service.ts` | `listProjectAdminSnapshots` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/admin-insights-service.ts` | `listProjectAdminRiskQueue` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/admin-insights-service.ts` | `getProjectAdminSubmissionSummary` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/admin-insights-service.ts` | `listProjectAdminSubmissionQueue` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/admin-readiness-overrides-service.ts` | `listCollegeActiveReadinessOverrides` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/admin-submission-lock-policy.ts` | `mayRecordCollegeAdminDeliveryLock` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/admin-submission-review-model.ts` | `canAdminSettleDelivery` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/admin-submission-review-model.ts` | `adminDeliveryToast` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/admin-submission-review-service.ts` | `lockAdminProjectSubmission` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/admin-unsubmitted-service.ts` | `listProjectAdminUnsubmitted` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-audit.ts` | `projectTeamCreateAudit` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-balanced-move.ts` | `moveMemberBalanced` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-capacity.ts` | `classTeamCapacity` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-create-feedback-model.ts` | `classTeamCreationFeedback` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-create-once-model.ts` | `mayBeginClassTeamCreation` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-create-request.ts` | `createClassTeamWorkspacesSchema` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-creator-empty-model.ts` | `classTeamCreatorEmptyMessages` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-csv-export.ts` | `exportClassTeamsCsv` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-edit-guard-model.ts` | `canEditClassTeamPlanner` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-member-diff.ts` | `diffTeamMembership` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-preview-token.ts` | `previewVersion` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-preview-token.ts` | `assertPreviewVersion` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-preview-token.ts` | `previewVersionSchema` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-preview-validation.ts` | `verifyClassTeamPreview` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-preview-validation.ts` | `classTeamPreviewSchema` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-role-policy.ts` | `canManageProjectTeams` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-roster-refresh-model.ts` | `canRefreshClassTeamRoster` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-roster-service.ts` | `classRosterRevision` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-roster-service.ts` | `requireTeamCreationAuthority` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-roster-service.ts` | `listProjectTeamClasses` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-roster-service.ts` | `loadClassTeamRoster` | **GAP** | **GAP — behavioural test missing** |
| `src/modules/projects/class-team-roster-snapshot.ts` | `assertRosterStillCurrent` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/class-team-roster-snapshot.ts` | `classRosterSnapshotSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/class-team-slug-conflict.ts` | `assertWorkspaceSlugsAvailable` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/class-team-slug-model.ts` | `isValidClassTeamBaseSlug` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/class-team-split-model.ts` | `previewClassTeams` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/class-team-split-model.ts` | `movePreviewMember` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/class-team-split-model.ts` | `teamSplitInputSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/class-team-swap-model.ts` | `swapClassTeamMembers` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/class-team-workspace-names.ts` | `planClassTeamWorkspaceNames` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/class-team-workspace-service.ts` | `createClassTeamWorkspaces` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/cohort-creation-outcome-model.ts` | `cohortCreationResultRows` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/cohort-preflight-service.ts` | `getCohortCreationPreflight` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/college-project-roster-model.ts` | `replaceCollegeProjectRosterSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/college-project-roster-service.ts` | `replaceCollegeProjectLearners` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/college-project-summary-model.ts` | `collegeProjectStatusChangeAllowed` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/college-project-summary-model.ts` | `collegeProjectSummaryPatch` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/college-project-summary-service.ts` | `updateCollegeProjectSummary` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/college-projects-query-model.ts` | `parseCollegeProjectsQuery` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/college-readiness-releases-service.ts` | `listCollegeReadinessWorkspaceChoices` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/college-readiness-releases-service.ts` | `listCollegeReadinessReleases` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/college-workspace-status-label.ts` | `collegeWorkspaceStatusLabel` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/constants.ts` | `PROJECT_TEMPLATE_STATUSES` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/constants.ts` | `PROJECT_TASK_PRIORITIES` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/constants.ts` | `PROJECT_STATUSES` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/constants.ts` | `PROJECT_RELEASE_STATUSES` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/constants.ts` | `PROJECT_SPRINT_STATUSES` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/constants.ts` | `PROJECT_TASK_STATUSES` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/constants.ts` | `PROJECT_MEMBER_ROLES` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/constants.ts` | `PROJECT_TASK_SUBMISSION_STATUSES` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/constants.ts` | `PROJECT_TASK_REVIEW_DECISIONS` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/constants.ts` | `PROJECT_SUBMISSION_STATUSES` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/constants.ts` | `PROJECT_SUBMISSION_REVIEW_DECISIONS` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/constants.ts` | `PROJECT_MEETING_STATUSES` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/constants.ts` | `PROJECT_MEETING_TYPES` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/delivery-activity-model.ts` | `projectDeliveryActivity` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/delivery-reopen-service.ts` | `reopenApprovedProjectDelivery` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/errors.ts` | `postgresConstraintName` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/errors.ts` | `isRetryableProjectTransactionError` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/evaluation-service.ts` | `createProjectEvaluation` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/evaluation-service.ts` | `getProjectEvaluation` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/evaluation-service.ts` | `listProjectEvaluations` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/execution-readiness.ts` | `deriveProjectExecutionReadiness` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/instance-restore-model.ts` | `restoredProjectStatus` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/instance-restore-model.ts` | `restoreProjectInstanceInputSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/instance-restore-service.ts` | `restoreProjectInstance` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/instance-service.ts` | `createProjectInstance` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/instance-service.ts` | `listProjectInstances` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/instance-service.ts` | `archiveProjectInstance` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/instance-service.ts` | `getProjectInstanceWorkspace` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-attention-service.ts` | `listMyLearnerProjectAttention` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-backlog-pull-service.ts` | `pullOwnBacklogTask` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-card-model.ts` | `learnerBoardCardMetadata` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-lanes-model.ts` | `learnerTaskLane` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-lanes-model.ts` | `groupLearnerBoardLanes` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-lanes-model.ts` | `LEARNER_BOARD_LANES` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-priority-model.ts` | `learnerBoardPriorityCounts` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-priority-model.ts` | `learnerBoardPriorityFilterHref` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-priority-model.ts` | `LEARNER_BOARD_PRIORITY_LABELS` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-selection-notice-model.ts` | `learnerBoardTaskSelectionNotice` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-sort-model.ts` | `sortLearnerBoardTasks` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-sort-model.ts` | `learnerBoardSortSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-summary-model.ts` | `learnerBoardStatusCounts` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-summary-model.ts` | `learnerBoardStatusFilterHref` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-summary-model.ts` | `LEARNER_BOARD_STATUS_LABELS` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-task-attention-tone-model.ts` | `learnerBoardTaskStatusTone` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-task-attention-tone-model.ts` | `learnerBoardTaskPriorityTone` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-task-detail-model.ts` | `findOwnLearnerBoardTask` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-task-detail-model.ts` | `learnerBoardTaskHref` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-task-dialog-navigation-model.ts` | `createLearnerBoardTaskDialogNavigationGuard` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-task-status-label-model.ts` | `learnerBoardTaskStatusLabel` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-task-status-label-model.ts` | `learnerBoardTaskPriorityLabel` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-board-task-workflow-model.ts` | `learnerBoardTaskWorkspaceHref` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-own-task-input-model.ts` | `learnerOwnTaskCreateInputSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-own-task-service.ts` | `createLearnerOwnTask` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-own-task-service.ts` | `deleteLearnerOwnTask` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-activity-csv-model.ts` | `learnerProjectActivityCsv` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-activity-cursor-model.ts` | `learnerProjectActivityLastFetched` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-activity-empty-model.ts` | `learnerProjectActivityEmptyMessage` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `learnerProjectActivityCategory` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `filterLearnerProjectActivity` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `parseLearnerProjectActivityFilters` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `learnerProjectActivityDateBounds` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `learnerProjectActivityPrefixes` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `learnerProjectActivityPageHref` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `learnerProjectActivityCategorySchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `learnerProjectActivityCategories` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `learnerProjectActivityFilterSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-activity-page-summary-model.ts` | `learnerProjectActivityPageSummary` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-activity-text-model.ts` | `filterLearnerProjectActivityText` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-archive-model.ts` | `learnerProjectArchiveState` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-board-model.ts` | `filterLearnerBoardTasks` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-board-model.ts` | `learnerBoardEmptyState` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-board-model.ts` | `learnerBoardActiveFilterCount` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-board-model.ts` | `learnerBoardSearchSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-board-model.ts` | `learnerBoardSprintSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-board-model.ts` | `learnerBoardReleaseSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-board-model.ts` | `learnerBoardPrioritySchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-board-model.ts` | `learnerBoardStatusSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-detail-error-model.ts` | `learnerProjectReadFailureDisposition` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-due-service.ts` | `listMyLearnerProjectDueStates` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-goals-model.ts` | `learnerProjectGoalSummary` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-goals-service.ts` | `getLearnerProjectGoals` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-list-empty-model.ts` | `learnerProjectListEmptyState` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-mobile-filter-model.ts` | `learnerProjectMobileFilterSummary` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-progress-model.ts` | `summarizeLearnerProjectProgress` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-progress-service.ts` | `listMyLearnerProjectProgress` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-review-notification-model.ts` | `learnerProjectTaskReviewNotice` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-review-notification-model.ts` | `learnerProjectDeliveryReviewNotice` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-review-notification-model.ts` | `learnerProjectDeliveryReopenedNotice` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-search-model.ts` | `learnerProjectMatchesSearch` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-sort-model.ts` | `compareNumberedTeamProjects` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-sort-model.ts` | `sortLearnerProjectRows` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-tab-alias-model.ts` | `canonicalLearnerProjectTab` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-tab-alias-model.ts` | `LEARNER_PROJECT_DETAIL_TABS` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-tab-href-model.ts` | `learnerProjectTabHref` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-team-model.ts` | `summarizeLearnerProjectTeams` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-team-service.ts` | `listMyLearnerProjectTeams` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-work-model.ts` | `learnerProjectHasBlockedTasks` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-project-work-model.ts` | `learnerProjectHasNoTrackedTasks` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-sprint-progress-model.ts` | `learnerSprintRollup` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-sprint-progress-model.ts` | `learnerSprintProgress` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-task-criteria-model.ts` | `learnerTaskCriteriaPreview` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-task-progress-model.ts` | `learnerTaskTransitionAllowed` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-task-progress-model.ts` | `learnerTaskProgressSuccess` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-task-progress-model.ts` | `learnerTaskProgressParamsSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-task-progress-model.ts` | `learnerTaskProgressInputSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-task-progress-service.ts` | `updateLearnerProjectTaskProgress` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-task-status-policy.ts` | `canLearnerMoveOwnTask` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-task-status-policy.ts` | `learnerTaskStatusInputSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/learner-task-status-service.ts` | `moveOwnLearnerProjectTask` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/lifecycle-service.ts` | `startProjectSprint` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/lifecycle-service.ts` | `completeProjectSprint` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/lifecycle-service.ts` | `reopenProjectSprint` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/lifecycle-service.ts` | `updateProjectTaskStatus` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/lifecycle-service.ts` | `unshipProjectRelease` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/lifecycle-service.ts` | `shipProjectRelease` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/meeting-service.ts` | `listProjectMeetings` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/meeting-service.ts` | `requestProjectMeeting` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/meeting-service.ts` | `scheduleProjectMeeting` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/meeting-service.ts` | `transitionProjectMeeting` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/meeting-window-policy.ts` | `isFutureProjectMeetingWindow` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/member-role-kind-model.ts` | `mayMutateProjectWithRole` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/member-role-kind-model.ts` | `PROJECT_MEMBER_ROLE_KINDS` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/member-service.ts` | `listProjectMemberCandidates` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/member-service.ts` | `listProjectMentorCandidates` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/member-service.ts` | `reassignProjectPrimaryMentor` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/member-service.ts` | `bulkReassignProjectMentor` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/member-service.ts` | `addProjectMember` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/member-service.ts` | `updateProjectMember` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/member-service.ts` | `endProjectMember` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/member-service.ts` | `listProjectMembers` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/member-service.ts` | `listMyProjectInstances` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-activity-display-model.ts` | `mentorActivityLabel` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-activity-display-model.ts` | `mentorActivityCategory` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-activity-display-model.ts` | `mentorActivityRelativeTime` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-attention-kind-model.ts` | `selectMentorAttention` | `tests/unit/projects-mentor-attention-risk-chat14.test.ts` | Runtime authored, unrun |
| `src/modules/projects/mentor-attention-kind-model.ts` | `mentorAttentionProjectOptions` | `tests/unit/projects-mentor-attention-risk-chat14.test.ts` | Runtime authored, unrun |
| `src/modules/projects/mentor-attention-kind-model.ts` | `mentorAttentionKindSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-attention-kind-model.ts` | `mentorAttentionOrderSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-attention-kind-model.ts` | `mentorAttentionProjectSchema` | `tests/unit/projects-mentor-attention-risk-chat14.test.ts` | Runtime authored, unrun |
| `src/modules/projects/mentor-attention-service.ts` | `listMyMentorProjectAttention` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-attention.ts` | `deriveMentorProjectAttention` | `tests/unit/projects-mentor-attention-risk-chat14.test.ts` | Runtime authored, unrun |
| `src/modules/projects/mentor-auto-assign-service.ts` | `autoAssignProjectTasks` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-backlog-service.ts` | `moveMentorBacklogTask` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-backlog-service.ts` | `createMentorBacklogTask` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-board-review-model.ts` | `mentorBoardReview` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-board-review-model.ts` | `mentorBoardReviewHref` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-board-review-model.ts` | `csvSafeCell` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-board-review-model.ts` | `mentorBoardExportCsv` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-board-review-model.ts` | `mentorSprintSummaryCsv` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-board-review-model.ts` | `mentorBoardReviewQuerySchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-board-review-service.ts` | `getMentorBoardReview` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-calendar-export-model.ts` | `mentorCalendarCsv` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-calendar-filter-model.ts` | `filterMentorCalendar` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-calendar-filter-model.ts` | `mentorCalendarFilterHref` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-calendar-filter-model.ts` | `mentorCalendarFiltersSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-calendar-service.ts` | `listMyMentorCalendarMeetings` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-calendar-view.ts` | `splitMentorMeetings` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-calendar-view.ts` | `mentorMeetingDisplayStatus` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-calendar-view.ts` | `safeMentorMeetingJoinUrl` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-closeout-model.ts` | `closeoutChecklist` | `tests/unit/projects-mentor-policy-matrix-chat14.test.ts` | Runtime authored, unrun |
| `src/modules/projects/mentor-closeout-model.ts` | `mentorCloseoutParamsSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-closeout-model.ts` | `mentorCloseoutSchema` | `tests/unit/projects-mentor-policy-matrix-chat14.test.ts` | Runtime authored, unrun |
| `src/modules/projects/mentor-closeout-service.ts` | `getMentorProjectCloseout` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-closeout-service.ts` | `completeMentorProject` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-delivery-lock-service.ts` | `lockMentorFinalDelivery` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-delivery-version-model.ts` | `mentorDeliveryVersionDisplay` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-delivery-version-model.ts` | `mentorDeliveryVersionParamsSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-delivery-version-service.ts` | `getMentorDeliveryVersion` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-estimation-unit-model.ts` | `mentorEstimationUnit` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-estimation-unit-model.ts` | `mentorEstimateOptions` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-estimation-unit-model.ts` | `mentorEstimateLabel` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-filter-query.ts` | `singleValueMentorFilters` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-filter-query.ts` | `singleValueMentorExportFilters` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-final-delivery-decision-model.ts` | `mentorFinalDeliveryCanReview` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-final-delivery-decision-model.ts` | `mentorFinalDeliveryDecisionSchema` | **GAP** | **GAP — behaviour untested** |
| `src/modules/projects/mentor-final-delivery-decision-service.ts` | `decideMentorFinalDelivery` | `tests/unit/projects-mentor-service-guards-chat14.test.ts` | Static/source only, behavioural pending |
| `src/modules/projects/mentor-latest-review-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-meeting-decision-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-meeting-decision-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-meeting-display-status.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-meeting-facilitation-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-meeting-form-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-meeting-notes-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-meeting-notes-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-meeting-reschedule-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-meeting-reschedule-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-meeting-status-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-overload-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-overview-edit-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-overview-edit-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-overview-presenter.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-paged-project-list-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-paged-project-list-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-pending-task-review-export.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-portfolio-activity-export-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-portfolio-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-portfolio-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-project-activity-export-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-project-activity-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-project-activity-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-project-assignment-filter-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-project-attention-filter-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-project-event-attribution.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-project-list-query.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-project-order-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-project-team-size-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-project-timeline-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-project-timeline-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-project-work-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-project-work-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-reassignment-workload-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-release-version-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-release-write-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-reports-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-reports-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-resource-audit-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-resource-directory-layout-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-resource-directory-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-resource-directory-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-review-completeness-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-review-completeness-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-review-export-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-review-history-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-review-history-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-review-overview-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-review-overview-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-risk-readiness-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-risk-readiness-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-sprint-delete-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-sprint-details-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-sprint-details-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-sprint-progress-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-sprint-progress-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-sprint-write-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-sprint-write-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-create-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-create-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-delete-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-details-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-details-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-feedback-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-feedback-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-history-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-history-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-quick-action-copy.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-review-export-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-review-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-review-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-review-token-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-transition-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-task-transition-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-team-audit-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-team-coverage-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-team-coverage-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-team-history-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-team-history-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-team-meetings-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-team-meetings-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/mentor-workspace-evidence-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/pr-s2-04-task-fields-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/pr-s2-07-delivery-reopen-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/primary-mentor-policy.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/progress-percentage-policy.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/project-notification-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/project-resource-audit-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/project-resource-file-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/project-resource-files-ui-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/project-task-visible-facts-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/project-template-catalogue-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/readiness-override-copy.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/readiness-override-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/readiness-override-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/readiness-overrides-export-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/readiness-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/resource-file-action-state-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/resource-file-delete-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/resource-file-empty-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/resource-file-filter-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/resource-file-filter-url-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/resource-file-layout-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/resource-file-list-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/resource-file-permission-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/resource-file-preflight-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/resource-file-status-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/resource-file-upload-session-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/resource-file-upload-state.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/resource-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/resource-visibility-policy.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/risk-signals.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/scope.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/sprint-close-policy.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/submission-draft-policy.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/submission-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/super-admin-template-create-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/super-admin-template-directory-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/super-admin-template-directory-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/task-assignee-policy.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/task-assignment-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/task-comment-kind-staged.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/task-comment-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/task-submission-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/template-assignment-read-scope.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/template-college-availability-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/template-college-availability-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/template-metadata-edit-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/template-metadata-edit-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/template-plan-editor-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/template-rollback-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/template-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/template-subview-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/template-subview-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/template-version-comparison-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/template-version-comparison-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/template-version-history-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/template-version-history-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/validation.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/workspace-brief-model.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/workspace-brief-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |
| `src/modules/projects/workspace-view-service.ts` | **EXPORT AUDIT PENDING** | **GAP** | Need each export, allowed/forbidden transitions, IDOR, CAS, audit/notification |

## Project HTTP route handlers

| File | Method | Behavioural tests | Status |
|---|---|---|---|
| `src/app/api/mentor/activity/export/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/mentor/calendar/export/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/mentor/notifications/[notificationId]/read/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/mentor/notifications/read-all/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/mentor/reports/export/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/mentor/reviews/export/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/mentor/sprint-progress/export/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/mentor/task-review-history/export/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/mentor/task-reviews/export/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/activity/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/archive/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/backlog/pull/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/backlog/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/brief/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/complete/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/meetings/[meetingId]/mentor-decision/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/meetings/[meetingId]/mentor-notes/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/meetings/[meetingId]/mentor-reschedule/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/meetings/[meetingId]/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/meetings/[meetingId]/transition/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/meetings/request/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/meetings/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/member-candidates/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/members/[memberId]/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/members/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/mentor-activity-export/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/mentor-board-export/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/mentor-delivery-review-export/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/mentor-overview/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/mentor-resources-export/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/mentor-sprint-summary-export/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/readiness/override/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/readiness/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/releases/[releaseId]/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/releases/[releaseId]/ship/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/releases/[releaseId]/unship/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/releases/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/resource-files/[fileId]/complete/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/resource-files/[fileId]/download-grant/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/resource-files/[fileId]/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/resource-files/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/resources/[resourceId]/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/resources/reorder/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/resources/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/restore/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/roster/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/sprints/[sprintId]/complete/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/sprints/[sprintId]/mentor-transition/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/sprints/[sprintId]/reopen/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/sprints/[sprintId]/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/sprints/[sprintId]/start/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/sprints/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/submissions/[submissionId]/evaluation/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/submissions/[submissionId]/lock/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/submissions/[submissionId]/mentor-decision/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/submissions/[submissionId]/mentor-lock/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/submissions/[submissionId]/reopen/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/submissions/[submissionId]/review/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/submissions/[submissionId]/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/submissions/[submissionId]/submit/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/submissions/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/tasks/[taskId]/assignee/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/tasks/[taskId]/comments/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/tasks/[taskId]/details/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/tasks/[taskId]/learner-own/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/tasks/[taskId]/learner-progress/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/tasks/[taskId]/learner-status/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/tasks/[taskId]/mentor-transition/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/tasks/[taskId]/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/tasks/[taskId]/submissions/[submissionId]/review/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/tasks/[taskId]/submissions/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/tasks/auto-assign/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/[projectId]/tasks/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/class-team-classes/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/class-team-roster/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/class-team-workspaces/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/cohort-preflight/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/me/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/mentor-candidates/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/readiness-overrides/export/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/reassign-mentor/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/templates/[templateId]/assignments/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/templates/[templateId]/duplicate/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/templates/[templateId]/metadata/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/templates/[templateId]/publish/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/templates/[templateId]/rollback/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/templates/[templateId]/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/templates/[templateId]/unpublish/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |
| `src/app/api/projects/templates/route.ts` | **METHOD AUDIT PENDING** | **GAP** | Same-origin, unauthenticated, tenant, invalid body, GET-no-write, conflicts |

## Project account pages

| Page | Test | Outstanding UI cases |
|---|---|---|
| `src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/[projectId]/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/[projectId]/readiness/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/at-risk/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/audit/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/readiness/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/reassign-mentor/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/submissions/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/templates/[templateId]/colleges/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/templates/[templateId]/overview/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/templates/[templateId]/resources/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/templates/[templateId]/sprints/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/templates/[templateId]/tasks/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/[versionId]/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/templates/[templateId]/versions/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/templates/new/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/templates/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/admin/projects/workspaces/new/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/[projectId]/[section]/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/[projectId]/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/[projectId]/readiness/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/at-risk/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/audit/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/create/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/readiness/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/reassign-mentor/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/submissions/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/templates/[templateId]/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/templates/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/[section]/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/workspaces/[workspaceId]/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/workspaces/new/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/college/projects/workspaces/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/learn/projects/[projectId]/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/learn/projects/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/activity/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/calendar/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/projects/[projectId]/activity-history/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/projects/[projectId]/board-review/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/projects/[projectId]/closeout/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/projects/[projectId]/meetings/[meetingId]/notes/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/projects/[projectId]/resources-directory/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/projects/[projectId]/review-overview/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/projects/[projectId]/risk-readiness/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/projects/[projectId]/tasks/[taskId]/feedback/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/projects/[projectId]/team-history/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/projects/[projectId]/team-meetings/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/projects/[projectId]/timeline/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/projects/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/reports/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/review-history/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/reviews/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/sprint-progress/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/task-review-history/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/task-reviews/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |
| `src/app/(authenticated)/mentor/team-coverage/page.tsx` | **GAP — source test mapping pending** | loading, empty, error, denied, partial, mobile, keyboard |

## Role/tenant matrix (must have behavioural proof)

| Actor | In-scope authority | Wrong college / organization | Wrong role / expired or removed membership | Stale tab / retry |
|---|---|---|---|---|
| Mentor | Active assigned project; mutation if permitted | Deny | Observer read-only; removed mentor cannot mutate | Version conflict and exact-once |
| Learner | Active team member, own submissions | Deny | No Mentor/Faculty promotion via forged IDs | Late/deadline authority; no duplicate delivery |
| Faculty | Explicit read scope only | Deny | No Mentor write rights | Safe same-origin and expired session |
| College Admin | Selected same tenant management scope | Deny | Active membership and `can()` | Archive/reassign CAS |
| Super Admin | Explicit acting-college scope | No global union | Persisted platform role; audited actor | No mistaken College Admin impersonation |
| TPO | Read only permitted project fields | Deny | No Mentor actions | Bounded bulk and exports |
| HR/Recruiter | Only explicitly granted project context | Deny | Revoked grant denies reads | No cross-college replay |

## Known release blockers / unverified gates

- Chat-13 identifies Super Admin lock-without-College-Admin-membership parity gap and an actor audit schema dependency: no impersonation workaround.
- Chat-9 and chat-6 identify tenant/archival/storage/security fixes; source fixes and authored tests still require a PostgreSQL race run and independent review.
- Grade-release visibility product state, request-size limits, exactly-once notifications, signed URLs, restore semantics, IST boundaries, 1,000+ row query plans, and 90% branch coverage are NOT certified.
- Full Vitest, `tsc --noEmit`, PostgreSQL integrations, actual authenticated HTTP, mobile/keyboard/browser runs have **not** executed in this environment.

Initial source inventory: 263 module TypeScript files; 91 API route files; 63 Project/Mentor page files. Export/method expansion in progress, GAP rows explicitly mark unfinished coverage.
