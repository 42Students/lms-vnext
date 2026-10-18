# Projects learner exported-symbol coverage ledger — chat-7

Generated against chatgpt/chat-7-b October 18, 2026. Every named exported symbol in the 46 learner-specific Projects source files appears below. Rows explicitly marked NO DIRECT TEST are OPEN and are **not** coverage claims. A linked test is only candidate evidence until CI and PostgreSQL integration are green.

| File | Named export | Behavioural test / remaining obligation |
|---|---|---|
| `src/modules/projects/learner-attention-service.ts` | `LearnerProjectAttention` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-attention-service.ts` | `listMyLearnerProjectAttention` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-backlog-pull-service.ts` | `learnerBacklogPullInputSchema` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-backlog-pull-service.ts` | `pullOwnBacklogTask` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-card-model.ts` | `LearnerBoardCardTask` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-card-model.ts` | `learnerBoardCardMetadata` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-lanes-model.ts` | `LEARNER_BOARD_LANES` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-lanes-model.ts` | `LearnerBoardLane` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-lanes-model.ts` | `learnerTaskLane` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-lanes-model.ts` | `groupLearnerBoardLanes` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-priority-model.ts` | `LEARNER_BOARD_PRIORITY_LABELS` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-priority-model.ts` | `LearnerBoardPriorityCounts` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-priority-model.ts` | `learnerBoardPriorityCounts` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-priority-model.ts` | `learnerBoardPriorityFilterHref` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-selection-notice-model.ts` | `learnerBoardTaskSelectionNotice` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-sort-model.ts` | `learnerBoardSortSchema` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-sort-model.ts` | `LearnerBoardSort` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-sort-model.ts` | `sortLearnerBoardTasks` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-summary-model.ts` | `LEARNER_BOARD_STATUS_LABELS` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-summary-model.ts` | `LearnerBoardStatusCounts` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-summary-model.ts` | `learnerBoardStatusCounts` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-summary-model.ts` | `learnerBoardStatusFilterHref` | **OPEN — NO DIRECT TEST LINKED**; exercise wrong tenant, revoked member, stale version, state transition |
| `src/modules/projects/learner-board-task-attention-tone-model.ts` | `learnerBoardTaskStatusTone` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-attention-tone-model.ts` | `learnerBoardTaskPriorityTone` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-detail-model.ts` | `LearnerTaskBoardUrlFilters` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-detail-model.ts` | `findOwnLearnerBoardTask` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-detail-model.ts` | `learnerBoardTaskHref` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-dialog-navigation-model.ts` | `createLearnerBoardTaskDialogNavigationGuard` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-status-label-model.ts` | `learnerBoardTaskStatusLabel` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-status-label-model.ts` | `learnerBoardTaskPriorityLabel` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-board-task-workflow-model.ts` | `learnerBoardTaskWorkspaceHref` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-mutation-guard.ts` | `assertPersistedLearnerProjectMutation` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-own-task-input-model.ts` | `learnerOwnTaskCreateInputSchema` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-own-task-service.ts` | `createLearnerOwnTask` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
| `src/modules/projects/learner-own-task-service.ts` | `deleteLearnerOwnTask` | **OPEN — NO DIRECT TEST LINKED**; verify tenant, role, state, 409/retry and API safety |
