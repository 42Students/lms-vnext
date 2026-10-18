# Projects learner exported-symbol coverage ledger — chat-7

Generated against chatgpt/chat-7-b October 18, 2026. Every named exported symbol in the 46 learner-specific Projects source files appears below. Rows explicitly marked NO DIRECT TEST are OPEN and are **not** coverage claims. A linked test is only candidate evidence until CI and PostgreSQL integration are green.

| File | Named export | Behavioural test / remaining obligation |
|---|---|---|
| `src/modules/projects/learner-attention-service.ts` | `LearnerProjectAttention` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-attention-service.ts` | `listMyLearnerProjectAttention` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-backlog-pull-service.ts` | `learnerBacklogPullInputSchema` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-backlog-pull-service.ts` | `pullOwnBacklogTask` | **TEST AUTHORED — NOT CI-VERIFIED:** `tests/unit/PROJ-BREAK-LEARNER-BACKLOG-01.test.ts` and `tests/unit/PROJ-BREAK-LEARNER-BACKLOG-03.test.ts` |
| `src/modules/projects/learner-board-card-model.ts` | `LearnerBoardCardTask` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-card-model.ts` | `learnerBoardCardMetadata` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-lanes-model.ts` | `LEARNER_BOARD_LANES` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-lanes-model.ts` | `LearnerBoardLane` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-lanes-model.ts` | `learnerTaskLane` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-board-lanes-model.ts` | `groupLearnerBoardLanes` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-board-priority-model.ts` | `LEARNER_BOARD_PRIORITY_LABELS` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-priority-model.ts` | `LearnerBoardPriorityCounts` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-priority-model.ts` | `learnerBoardPriorityCounts` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-board-priority-model.ts` | `learnerBoardPriorityFilterHref` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-board-selection-notice-model.ts` | `learnerBoardTaskSelectionNotice` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-board-sort-model.ts` | `learnerBoardSortSchema` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-sort-model.ts` | `LearnerBoardSort` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-sort-model.ts` | `sortLearnerBoardTasks` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-summary-model.ts` | `LEARNER_BOARD_STATUS_LABELS` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-summary-model.ts` | `LearnerBoardStatusCounts` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-summary-model.ts` | `learnerBoardStatusCounts` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-board-summary-model.ts` | `learnerBoardStatusFilterHref` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-board-task-attention-tone-model.ts` | `learnerBoardTaskStatusTone` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-attention-tone-model.ts` | `learnerBoardTaskPriorityTone` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-detail-model.ts` | `LearnerTaskBoardUrlFilters` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-detail-model.ts` | `findOwnLearnerBoardTask` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-detail-model.ts` | `learnerBoardTaskHref` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-dialog-navigation-model.ts` | `createLearnerBoardTaskDialogNavigationGuard` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-status-label-model.ts` | `learnerBoardTaskStatusLabel` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-status-label-model.ts` | `learnerBoardTaskPriorityLabel` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-workflow-model.ts` | `learnerBoardTaskWorkspaceHref` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-mutation-guard.ts` | `assertPersistedLearnerProjectMutation` | **TEST AUTHORED — CI UNVERIFIED:** `tests/unit/PROJ-BREAK-LEARNER-ACTOR-02.test.ts`; remaining PostgreSQL, mutation race, expired-session checks |
| `src/modules/projects/learner-own-task-input-model.ts` | `learnerOwnTaskCreateInputSchema` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-own-task-service.ts` | `createLearnerOwnTask` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-own-task-service.ts` | `deleteLearnerOwnTask` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-activity-csv-model.ts` | `learnerProjectActivityCsv` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-project-activity-cursor-model.ts` | `learnerProjectActivityLastFetched` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-project-activity-empty-model.ts` | `learnerProjectActivityEmptyMessage` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `learnerProjectActivityCategorySchema` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `LearnerProjectActivityCategory` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `learnerProjectActivityCategories` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `learnerProjectActivityCategory` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `filterLearnerProjectActivity` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `learnerProjectActivityFilterSchema` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `LearnerProjectActivityFilters` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `parseLearnerProjectActivityFilters` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `learnerProjectActivityDateBounds` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `learnerProjectActivityPrefixes` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-activity-filter-model.ts` | `learnerProjectActivityPageHref` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-activity-page-summary-model.ts` | `learnerProjectActivityPageSummary` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-project-activity-text-model.ts` | `filterLearnerProjectActivityText` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-archive-model.ts` | `learnerProjectArchiveState` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-board-model.ts` | `learnerBoardSearchSchema` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-board-model.ts` | `learnerBoardSprintSchema` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-board-model.ts` | `learnerBoardReleaseSchema` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-board-model.ts` | `learnerBoardPrioritySchema` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-board-model.ts` | `learnerBoardStatusSchema` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-board-model.ts` | `LearnerBoardTask` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-board-model.ts` | `filterLearnerBoardTasks` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-board-model.ts` | `LearnerBoardEmptyState` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-board-model.ts` | `learnerBoardEmptyState` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-board-model.ts` | `learnerBoardActiveFilterCount` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-detail-error-model.ts` | `learnerProjectReadFailureDisposition` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-due-service.ts` | `listMyLearnerProjectDueStates` | **TEST AUTHORED — CI UNVERIFIED:** `tests/unit/PROJ-BREAK-LEARNER-DUE-05.test.ts`; remaining PostgreSQL, mutation race, expired-session checks |
| `src/modules/projects/learner-project-goals-model.ts` | `LearnerProjectGoalSummary` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-goals-model.ts` | `learnerProjectGoalSummary` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-goals-service.ts` | `getLearnerProjectGoals` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-list-empty-model.ts` | `LearnerProjectListEmptyState` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-list-empty-model.ts` | `learnerProjectListEmptyState` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-project-mobile-filter-model.ts` | `LearnerProjectMobileFilterSummary` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-mobile-filter-model.ts` | `learnerProjectMobileFilterSummary` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-project-progress-model.ts` | `LearnerProjectTaskStatus` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-progress-model.ts` | `LearnerProjectProgress` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-progress-model.ts` | `summarizeLearnerProjectProgress` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-project-progress-service.ts` | `listMyLearnerProjectProgress` | **TEST AUTHORED — CI UNVERIFIED:** `tests/unit/PROJ-BREAK-LEARNER-PROGRESS-04.test.ts`; remaining PostgreSQL, mutation race, expired-session checks |
| `src/modules/projects/learner-project-review-notification-model.ts` | `learnerProjectTaskReviewNotice` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-project-review-notification-model.ts` | `learnerProjectDeliveryReviewNotice` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-project-review-notification-model.ts` | `learnerProjectDeliveryReopenedNotice` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-project-search-model.ts` | `learnerProjectMatchesSearch` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-project-sort-model.ts` | `compareNumberedTeamProjects` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-project-sort-model.ts` | `sortLearnerProjectRows` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-project-tab-alias-model.ts` | `canonicalLearnerProjectTab` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-tab-alias-model.ts` | `LEARNER_PROJECT_DETAIL_TABS` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-tab-href-model.ts` | `learnerProjectTabHref` | **TEST AUTHORED — NOT EXECUTED:** `tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts` (`PROJ-BREAK-LEARNER-99`, direct behavioral assertion); PostgreSQL tenant/role/races remain outstanding |
| `src/modules/projects/learner-project-team-model.ts` | `LearnerProjectTeamMember` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-team-model.ts` | `LearnerProjectTeamSummary` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-team-model.ts` | `summarizeLearnerProjectTeams` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-team-service.ts` | `listMyLearnerProjectTeams` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-work-model.ts` | `LearnerProjectProgressCounts` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-work-model.ts` | `learnerProjectHasBlockedTasks` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-project-work-model.ts` | `learnerProjectHasNoTrackedTasks` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-sprint-progress-model.ts` | `learnerSprintRollup` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-sprint-progress-model.ts` | `learnerSprintProgress` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-task-criteria-model.ts` | `learnerTaskCriteriaPreview` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-task-progress-model.ts` | `learnerTaskProgressParamsSchema` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-task-progress-model.ts` | `learnerTaskProgressInputSchema` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-task-progress-model.ts` | `learnerTaskTransitionAllowed` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-task-progress-model.ts` | `learnerTaskProgressSuccess` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-task-progress-service.ts` | `updateLearnerProjectTaskProgress` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-task-status-policy.ts` | `learnerTaskStatusInputSchema` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-task-status-policy.ts` | `canLearnerMoveOwnTask` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-task-status-service.ts` | `moveOwnLearnerProjectTask` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |

## Known direct regression evidence
- `learner-mutation-guard.ts` / `assertPersistedLearnerProjectMutation`: `tests/unit/PROJ-BREAK-LEARNER-ACTOR-02.test.ts` (active and revoked actor, tenant/role, locked DB guard).
- `learner-own-task-service.ts` / `deleteLearnerOwnTask`: `tests/unit/PROJ-BREAK-LEARNER-RELEASE-01.test.ts` (shipped release, wrong role, existing comments/attempts).
- `learner-backlog-pull-service.ts` / `pullOwnBacklogTask`: `tests/unit/PROJ-BREAK-LEARNER-BACKLOG-01.test.ts`, `tests/unit/PROJ-BREAK-LEARNER-BACKLOG-03.test.ts` (malformed payload, wrong tenant/assignee, race/retry, status).
- `learner-task-progress-service.ts` / `updateLearnerProjectTaskProgress`: existing `tests/unit/PROJ-BREAK-LEARNER-01.test.ts` (policy; DB still unverified).
- `learner-task-status-service.ts` / `moveOwnLearnerProjectTask`: existing learner Projects policy and route tests (role, stale token).

## Mandatory outstanding tests
- Every remaining `OPEN` row above requires a direct behavioural import/execution test with failure/retry/permission matrix. Their present unlinked state is not a claim of zero test coverage, only unverified evidence.
- Learner Project REST routes and `/learn/projects` page/error/loading surfaces must be enumerated in the parent Projects ledger maintained by chat-14.
- PostgreSQL integration of actor revocation/role swap, archived/project completion, release shipment, concurrent status writes, idempotency, and notification dedupe.
- At least 90% Projects module branch coverage and independent breaker review before release. (Not yet demonstrated.)



## PROJ-BREAK-LEARNER-99 incremental direct-model tests (19 October 2026)

Directly exercised `21` previously unlinked exported learner model functions in
`tests/unit/PROJ-BREAK-chat7-learner-readonly-model-matrix.test.ts`: progress denominators;
archived-project ordering and natural team sort; task lane/state and priority filtering; board
deep links; cursor-preserving activity paging and finite counts; CSV formula escaping and
100-row cap; scoped project search; filtered/unassigned empty states; mobile filter notices
and feedback-private review notifications. Source defect `learnerProjectActivityPageSummary`
accepted NaN/Infinity and rendered nonsensical counts; fixed in `638cb1c`.

**Not a coverage sign-off:** all rows still marked OPEN are outstanding; function models cannot
prove service membership checks, PostgreSQL isolation, concurrency, browser resilience,
or 90% branch coverage. Tests were authored but not executed.
