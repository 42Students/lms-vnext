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

| `src/app/(authenticated)/admin/projects/page.tsx` | SuperAdminProjectsPage | `PROJ-BREAK-pages-01` | Acting-college gate, permission-scoped snapshots, no-college recovery. |
| `src/app/(authenticated)/college/projects/page.tsx` | CollegeProjectsPage | `PROJ-BREAK-pages-02` | Missing membership recovery, tenant-derived list and pagination. |
| `src/app/(authenticated)/mentor/projects/page.tsx` | MentorProjectsPage | `PROJ-BREAK-pages-03` | Wrong role, module disabled, invalid filter recovery and paging. |
| `src/app/(authenticated)/mentor/projects/[projectId]/page.tsx` | MentorProjectPage | `PROJ-BREAK-pages-03` | Explicit project read access, rejected wrong-member bookmark, safe redirect. |
| `src/app/(authenticated)/learn/projects/page.tsx` | LearnerProjectsPage | `PROJ-BREAK-pages-04`, `PROJ-BREAK-pages-05` | LEARNER membership, disabled module denial, bounded page options and friendly empty state. |

## Uncovered hardening dimensions requiring DB/browser authority

Full 14-category module matrix, 82 project API handlers, 1000+ task EXPLAIN/index checks, migration-up on realistic data, session-expiry role journeys, storage object generation/expiry, channel exactly-once under retries and device-level UX are **not certified** here. The above tests must be executed and independently reviewed before any release PASS.


## Chat-6 Projects breaker extension — 18 October 2026

| Source | Export / handler | Adversarial cases | Test evidence | Remaining integration obligation |
|---|---|---|---|---|
| `src/modules/projects/project-resource-file-service.ts` | `listProjectFiles` | PROJ-BREAK-file-08: archived/draft/mentor-only/orphaned resource links excluded for learners | `tests/unit/PROJ-BREAK-chat6-delivery-grade-notices.test.ts` | Database fixture covering file visibility after concurrent archive |
| Same | `completeProjectFileUpload` | PROJ-BREAK-file-09: repeat completion when another request wins CAS; no duplicate SCAN_ATTESTED | same | PostgreSQL parallel requests, object-store WAIT/READY race and event-count assertion |
| Same | `removeProjectFile` | PROJ-BREAK-file-10: duplicate soft delete returns DELETED, no second event/object delete | same | PostgreSQL parallel requests and storage outage |
| `src/modules/projects/evaluation-service.ts` | `createProjectEvaluation` | PROJ-BREAK-grading-03/04: completed projects immutable, bounded integer rubric, duplicate criterion | same | Concurrent lock/regrade proof and persisted audit assertions |
| `src/modules/projects/submission-service.ts` | `createProjectSubmissionDraft`, `updateProjectSubmissionDraft`, `submitProjectSubmission` | PROJ-BREAK-submissions-06: forged attachment IDs and unsafe URL schemes, scoped READY evidence | same | **Open:** stale draft writes have no server-enforced expectedUpdatedAt; end-to-end client/API protocol fix required |
| `src/modules/projects/mentor-final-delivery-decision-model.ts` | `mentorFinalDeliveryCanReview` | PROJ-BREAK-state-04: only SUBMITTED and ACTIVE | same | Validate every role UI affordance against server rejection |
| `src/modules/projects/project-notification-service.ts` | `notifyActiveProjectMembers` | PROJ-BREAK-notifications-01/02: active college recipient/role scoping and no PII in notice copy | same | Exactly-once retries and partial notification delivery fault injection |
| `src/app/(authenticated)/college/projects/page.tsx` + `src/modules/projects/admin-college-scope.ts` | `CollegeProjectsPage`, `getProjectAdminCollegeId` | PROJ-BREAK-pages-02: central `can(projects.manage)` guard precedes snapshot access and rejects missing college | `tests/unit/PROJ-BREAK-chat6-role-journeys.test.ts` | Role/college database-backed impersonation denial |

Tests described as source contracts must **not** be counted as PostgreSQL behavioural coverage or release PASS.


## Multi-device final-delivery concurrency (PROJ-BREAK-submissions-10/11)

| Executable boundary | Happy path | Hostile path | Regression |
| --- | --- | --- | --- |
| `projectSubmissionDraftInputSchema` / `updateProjectSubmissionDraftInputSchema` | POST creation without a revision; PATCH with an ISO server revision | Absent, forged, malformed, or extra-college attributes denied | `tests/unit/PROJ-BREAK-chat6-draft-revision-race.test.ts` |
| `projectDraftRevisionMatches` and `nextProjectDraftUpdatedAt` | Current revision accepted; new timestamp strictly after old | Stale tab rejected, including same-millisecond races, invalid clocks | Same |
| `updateProjectSubmissionDraft` | Saved edits persist within project lock and atomically emit history | Wrong revision rejected prior to attachment/audit writes, independent of other tab's state | Same; PostgreSQL concurrency integration still required |
| `submitProjectSubmission` | Exact saved draft can finalize after project-readiness checks | Old tab or missing token cannot submit teammate edits | Same |
| `PATCH /api/projects/[projectId]/submissions/[submissionId]` | Same-origin, authenticated request forwards revision | Foreign origin rejected; stale validation reaches mapped response | `tests/unit/PROJ-BREAK-chat6-submission-http-race.test.ts` |
| `POST /api/projects/[projectId]/submissions/[submissionId]/submit` | Same-origin, authenticated request forwards persisted revision | Foreign origin denied before DB calls; malformed body does not transition | Same |
| `LearnerFinalDeliveryControl` | Manual save, autosave, reopen and submit retain server-acknowledged content and newest token | Double clicks serialized, unacknowledged or stale drafts not submitted, new draft ID read from refresh | Both regressions above and `tests/unit/PROJ-BREAK-chat6-saved-delivery-ui.test.ts` |

These are source-policy and mocked route tests. CI, real PostgreSQL parallel writes and authenticated browser multi-device behaviour remain unverified. The server intentionally refuses old clients that do not include `expectedUpdatedAt`; this prioritizes correctness over a silent data loss fallback.

## Super Admin Projects audit and tenant boundary (PROJ-BREAK-SA-17/18/19)

| Executable boundary | Attack | Test | Integration remaining |
| --- | --- | --- | --- |
| `getProjectAdminCollegeId` / `can(projects.manage)` | Dual-role Super Admin switching organizations; unselected college; suspended/disabled membership; unrelated learner and mentor | `tests/unit/PROJ-BREAK-chat6-super-admin-audit-scope.test.ts` | Real database records asserting the requested college belongs to the selected organization |
| `mayReadGlobalProjectAudit` | College/org-scoped Super Admin attempting the global activity stream, non-platform user or disabled user attempting escalation | Same | Live HTTP route with foreign tenant audit IDs and page/CSV consistency |

The test executes the permission model, not a mocked or stubbed assertion. It does not verify actual PostgreSQL ownership joins; continue to treat the database-backed IDOR/security pass as **pending** until CI and integration testing execute it.

## PROJ-BREAK-submissions-07 persisted evidence validation (chat-6)

`savedDeliverySubmissionReadiness` now rejects a nominal `FILE` row without a valid file UUID, any FILE claiming an external link, and unsafe or malformed primary/demo URLs. This closes a client readiness mismatch where a legacy/forged persisted attachment could display a submit-ready state despite the service refusing the evidence. `tests/unit/PROJ-BREAK-chat6-saved-delivery-ui.test.ts` adds negative cases for absent/null/forged IDs, conflicting FILE URL, unsafe schemes and a valid HTTPS control. The service still remains authoritative for READY status, college ownership and file-scanner attestation. Unit test authored, cloud CI **not yet executed**.
