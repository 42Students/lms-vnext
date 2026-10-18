# Projects breaker coverage contribution — chat-6

**Scope:** focused adversarial contribution for the IIT Dharwad release hardening brief; not the whole 603-export Projects module ledger (owner chat-14). Tests are written, **not run** in this GitHub-connector environment. `PENDING` cases require the PostgreSQL harness and independent review.

| Source | Export/handler | Breaker test case(s) | Grounded coverage and remaining boundary |
|---|---|---|---|
| `src/modules/projects/access.ts` | `loadProjectScope,requireProjectManageAccess,requireProjectReadAccess,requireProjectLifecycleAccess,requireProjectLifecycleMutationAccess` | `PROJ-BREAK-idor-01` | context, tenant, role, active membership; DB-role permutations pending |
| `src/modules/projects/evaluation-service.ts` | `createProjectEvaluation,getProjectEvaluation,listProjectEvaluations` | `PROJ-BREAK-grading-02,PROJ-BREAK-grading-03,PROJ-BREAK-database-01` | scores, duplicate rubric, evaluation confidentiality, index uniqueness; DB write/read pending |
| `src/modules/projects/submission-service.ts` | `createProjectSubmissionDraft,updateProjectSubmissionDraft,submitProjectSubmission,reviewProjectSubmission` | `PROJ-BREAK-state-02,PROJ-BREAK-state-03` | terminal completed/archived guards, row-lock source; DB concurrency pending |
| `src/modules/projects/project-resource-file-service.ts` | `issueProjectFileUploadGrant,completeProjectFileUpload,listProjectFiles,updateProjectFileDetails,removeProjectFile,issueProjectFileDownloadGrant` | `PROJ-BREAK-file-01,PROJ-BREAK-file-02,PROJ-BREAK-file-04,PROJ-BREAK-file-05` | scan verification, UI permissions, archive/write CAS; actual signed URL expiry and PG race pending |
| `src/modules/projects/mentor-board-review-model.ts` | `mentorBoardReview,csvSafeCell,mentorBoardExportCsv` | `PROJ-BREAK-export-01,PROJ-BREAK-scale-01` | CSV Unicode injection and 1001-task paging |
| `src/modules/projects/learner-project-activity-csv-model.ts` | `learnerProjectActivityCsv` | `PROJ-BREAK-export-02,PROJ-BREAK-resilience-01` | 100 rows, hostile Unicode values, invalid date fallback |
| `src/modules/projects/class-team-csv-export.ts` | `exportClassTeamsCsv` | `PROJ-BREAK-export-06` | roster CSV bidi isolation |
| `src/modules/projects/mentor-calendar-export-model.ts` | `mentorCalendarCsv` | `PROJ-BREAK-export-04` | 500 cap, invalid timestamps |
| `src/modules/projects/mentor-pending-task-review-export.ts` | `mentorPendingTaskReviewCsv` | `PROJ-BREAK-export-03` | 500 cap, invalid timestamps |
| `src/modules/projects/mentor-review-export-model.ts` | `mentorReviewExportCsv,mentorReviewExportHref` | `PROJ-BREAK-export-05` | already-bounded review CSV; href tenant context integration pending |
| `src/modules/projects/meeting-window-policy.ts` | `isFutureProjectMeetingWindow` | `PROJ-BREAK-deadline-01` | IST midnight and invalid dates |
| `src/modules/projects/mentor-task-transition-model.ts` | `allowedMentorTaskTransition,mentorTaskTransitionSchema` | `PROJ-BREAK-state-01` | forbidden jumps and confirmed CAS tokens |
| `src/modules/projects/mentor-task-review-token-model.ts` | `mentorTaskReviewTokenMatches` | `PROJ-BREAK-race-01` | ms CAS stale browser tab |
| `src/modules/projects/resource-file-permission-model.ts` | `resourceFileUiAllowed` | `PROJ-BREAK-file-02` | role, tenant, storage, archive UI matrix |
| `src/modules/projects/resource-file-preflight-model.ts` | `resourceFilePreflight` | `PROJ-BREAK-file-03` | filename, MIME, size and count |
| `src/modules/projects/resource-file-upload-state.ts` | `transitionResourceUploadUi` | `PROJ-BREAK-file-01` | no successful upload without VERIFIED event |
| `src/modules/projects/mentor-final-delivery-decision-model.ts` | `mentorFinalDeliveryCanReview,mentorFinalDeliveryDecisionSchema` | `PROJ-BREAK-state-02` | submission-review transition and reason validation |
| `src/modules/projects/instance-restore-model.ts` | `restoredProjectStatus` | `PROJ-BREAK-recovery-01` | whitelisted historical state |
| `src/modules/projects/primary-mentor-policy.ts` | `mayRemovePrimaryProjectMentor` | `PROJ-BREAK-mentor-01` | active primary continuity |
| `src/modules/projects/progress-percentage-policy.ts` | `projectCompletionPercent` | `PROJ-BREAK-grading-01` | rounding fairness |
| `src/modules/projects/project-notification-service.ts` | `notifyActiveProjectMembers,notifyProjectMemberships,projectNoticeHref` | `PROJ-BREAK-notification-01` | active same college recipient constraints; delivery integration pending |
| `src/app/api/projects/[projectId]/submissions/[submissionId]/evaluation/route.ts` | `GET,POST` | `PROJ-BREAK-grading-02,PROJ-BREAK-security-01` | GET scope and POST same-origin guards; integration pending |

## Uncovered hardening dimensions requiring DB/browser authority

Full 14-category module matrix, 82 project API handlers, 1000+ task EXPLAIN/index checks, migration-up on realistic data, session-expiry role journeys, storage object generation/expiry, channel exactly-once under retries and device-level UX are **not certified** here. The above tests must be executed and independently reviewed before any release PASS.
