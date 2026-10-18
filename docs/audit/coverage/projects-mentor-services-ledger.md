# Projects mentor services coverage ledger — chat-14

Area: `src/modules/projects` mentor workflows and their `src/app/api/projects/[projectId]` route handlers. This is an **incremental evidence ledger**, not a claim that every service in the 258-file Projects module has full coverage. It distinguishes pure behavioral tests from code-contract checks. Files outside this table remain to be inventoried and tested.

| Exported module | Export/function under test | Test file | Cases tested | Evidence kind |
|---|---|---|---|---|
| `src/modules/projects/mentor-task-transition-model.ts` | `allowedMentorTaskTransition, mentorTaskTransitionSchema` | `tests/unit/projects-mentor-policy-matrix-chat14.test.ts` | TODO/IN_PROGRESS/BLOCKED transitions; no-ops, forbidden states, version and confirmation | runtime unit assertions |
| `src/modules/projects/mentor-closeout-model.ts` | `closeoutChecklist, mentorCloseoutSchema` | `tests/unit/projects-mentor-policy-matrix-chat14.test.ts` | approved delivery, task/sprint/release zero state, 3 confirmations, status | runtime unit assertions |
| `src/modules/projects/mentor-meeting-decision-model.ts` | `mentorMeetingDecisionStatus, mentorMeetingDecisionSchema` | `tests/unit/projects-mentor-policy-matrix-chat14.test.ts` | scheduled completion, requested cancellation, contradictory note/outcome, confirmation | runtime unit assertions |
| `src/modules/projects/mentor-project-list-query.ts` | `mentorProjectListQuerySchema` | `tests/unit/projects-mentor-policy-matrix-chat14.test.ts` | role-scoped paging, empty legacy selectors, tenant injection, invalid sizes | runtime unit assertions |
| `src/modules/projects/mentor-sprint-write-model.ts` | `mentorSprintCreateSchema, mentorSprintTransitionSchema, isValidMentorSprintTransition` | `tests/unit/projects-mentor-sprint-resource-coverage-chat14.test.ts` | date ordering, no-op/reopen/complete/start state matrix, update token | runtime unit assertions |
| `src/modules/projects/mentor-sprint-details-model.ts` | `mentorSprintDetailsSchema, sprintDetailsChanged` | `tests/unit/projects-mentor-sprint-resource-coverage-chat14.test.ts` | required version, dates, goal changes and no-op | runtime unit assertions |
| `src/modules/projects/mentor-task-create-model.ts` | `mentorTaskCreateSchema` | `tests/unit/projects-mentor-sprint-resource-coverage-chat14.test.ts` | backlog default, sprint optimistic token, blocker, estimate, title, priority | runtime unit assertions |
| `src/modules/projects/mentor-task-details-model.ts` | `mentorTaskDetailsInputSchema, taskDetailsChangedFields` | `tests/unit/projects-mentor-sprint-resource-coverage-chat14.test.ts` | whitelist fields, changed-field diff, cross-tenant injection | runtime unit assertions |
| `src/modules/projects/mentor-meeting-reschedule-model.ts` | `mentorMeetingRescheduleSchema, mentorMeetingCanReschedule, toIstLocalInput, fromIstLocalInput` | `tests/unit/projects-mentor-sprint-resource-coverage-chat14.test.ts` | 12h duration bound, confirmation, status gate, IST roundtrip | runtime unit assertions |
| `src/modules/projects/mentor-resource-directory-model.ts` | `safeHttpsResourceUrl, mentorResourceDirectory, mentorResourceDirectoryHref, mentorResourceDirectoryCsv, parseMentorResourceDirectorySearch` | `tests/unit/projects-mentor-sprint-resource-coverage-chat14.test.ts` | no unsafe URL, selected filter facets, count, paging, 200-row CSV cap, forged query | runtime unit assertions |
| `src/modules/projects/mentor-review-completeness-model.ts` | `projectReviewCompleteness, reviewCompletenessPage, mentorReviewCompletenessHref` | `tests/unit/projects-mentor-sprint-resource-coverage-chat14.test.ts` | persisted evidence only, missing review, approved/feedback flags, pagination | runtime unit assertions |
| `src/modules/projects/mentor-sprint-write-service.ts` | `createMentorProjectSprint, transitionMentorProjectSprint` | `tests/unit/projects-mentor-service-guards-chat14.test.ts` | locked project/release, concurrency, active sprint exclusivity, no open tasks, audit | static service-contract assertions |
| `src/modules/projects/mentor-sprint-details-service.ts` | `updateMentorSprintDetails` | `tests/unit/projects-mentor-service-guards-chat14.test.ts` | tenant/module/permission checks, row-lock, stale token, event | static service-contract assertions |
| `src/modules/projects/mentor-task-create-service.ts` | `createMentorProjectTask` | `tests/unit/projects-mentor-service-guards-chat14.test.ts` | mentor role/tenant, active assignee, parent locks, atomic activity and notification | static service-contract assertions |
| `src/modules/projects/mentor-task-details-service.ts` | `updateMentorTaskDetails` | `tests/unit/projects-mentor-service-guards-chat14.test.ts` | locked project/task, CAS timestamp, audit event | static service-contract assertions |
| `src/modules/projects/mentor-task-transition-service.ts` | `transitionMentorProjectTask` | `tests/unit/projects-mentor-service-guards-chat14.test.ts` | allowed transition state, sprint, CAS, audit | static service-contract assertions |
| `src/modules/projects/mentor-meeting-decision-service.ts` | `decideMentorProjectMeeting` | `tests/unit/projects-mentor-service-guards-chat14.test.ts` | mentor-only, stale version, no draft notification, active recipients | static service-contract assertions |
| `src/modules/projects/mentor-meeting-reschedule-service.ts` | `rescheduleMentorMeeting` | `tests/unit/projects-mentor-service-guards-chat14.test.ts` | tenant and timestamp check, row-lock and notification | static service-contract assertions |
| `src/modules/projects/mentor-release-write-service.ts` | `writeMentorProjectRelease` | `tests/unit/projects-mentor-service-guards-chat14.test.ts` | create/edit/delete, shipped lock, mutation gate, event | static service-contract assertions |
| `src/modules/projects/mentor-final-delivery-decision-service.ts` | `decideMentorFinalDelivery` | `tests/unit/projects-mentor-service-guards-chat14.test.ts` | read scope, CAS and active-member notification | static service-contract assertions |

## HTTP route handler inventory

All rows below have a test that checks the request origin guard, authenticated context acquisition, delegated service, and friendly API error mapping. These are static contract checks; integration tests must separately confirm real HTTP response behavior.

| Handler | Method | Test |
|---|---|---|
| `src/app/api/projects/[projectId]/sprints/route.ts` | `POST` | `tests/unit/projects-mentor-route-guards-chat14.test.ts` |
| `src/app/api/projects/[projectId]/sprints/[sprintId]/mentor-transition/route.ts` | `POST` | `tests/unit/projects-mentor-route-guards-chat14.test.ts` |
| `src/app/api/projects/[projectId]/sprints/[sprintId]/route.ts` | `PATCH` | `tests/unit/projects-mentor-route-guards-chat14.test.ts` |
| `src/app/api/projects/[projectId]/sprints/[sprintId]/route.ts` | `DELETE` | `tests/unit/projects-mentor-route-guards-chat14.test.ts` |
| `src/app/api/projects/[projectId]/tasks/route.ts` | `POST` | `tests/unit/projects-mentor-route-guards-chat14.test.ts` |
| `src/app/api/projects/[projectId]/tasks/[taskId]/details/route.ts` | `PATCH` | `tests/unit/projects-mentor-route-guards-chat14.test.ts` |
| `src/app/api/projects/[projectId]/tasks/[taskId]/mentor-transition/route.ts` | `PATCH` | `tests/unit/projects-mentor-route-guards-chat14.test.ts` |
| `src/app/api/projects/[projectId]/meetings/[meetingId]/mentor-decision/route.ts` | `POST` | `tests/unit/projects-mentor-route-guards-chat14.test.ts` |
| `src/app/api/projects/[projectId]/meetings/[meetingId]/mentor-reschedule/route.ts` | `PATCH` | `tests/unit/projects-mentor-route-guards-chat14.test.ts` |
| `src/app/api/projects/[projectId]/releases/route.ts` | `POST` | `tests/unit/projects-mentor-route-guards-chat14.test.ts` |
| `src/app/api/projects/[projectId]/releases/[releaseId]/route.ts` | `PATCH` | `tests/unit/projects-mentor-route-guards-chat14.test.ts` |
| `src/app/api/projects/[projectId]/releases/[releaseId]/route.ts` | `DELETE` | `tests/unit/projects-mentor-route-guards-chat14.test.ts` |

## UI and permission evidence

- `tests/unit/UX-mentor-all-pages-scope-02.test.ts` verifies **26 active mentor routes**, their scoped services, distinct empty/recovery UI state, shared PageHeader, and access boundary.
- `tests/unit/UX-mentor-legacy-navigation-01.test.ts` verifies six redirect-only legacy bookmarks and their real mentor destinations.
- `tests/unit/UX-projects-mentor-overlays-01.test.ts` and `UX-projects-shared-overlays-02.test.ts` cover project dialog confirmation/draft semantics.
- `tests/unit/UX-mentor-scroll-motion-01.test.ts` and `UX-projects-tables-chat14.test.ts` cover four responsive DataTable conversions and two scrollable mentor boards.
- `src/modules/projects/access.ts` is checked by `UX-mentor-all-pages-scope-02` for current college, active user membership and role-scoped project access, and by service guard tests for permission calls.

## Unverified / next integration obligations

These checks were written but **not executed** in this GitHub-only environment. This ledger is **not full exhaustive coverage**. Real PostgreSQL and HTTP integrations still need tests for each permitted and forbidden role, cross-college reads/writes, optimistic-update race, transaction rollback, schema constraints, all notifications/audit records, and authenticated error payloads. Re-running `npx tsc --noEmit`, `vitest` and `node scripts/audit/ux-coverage.mjs` belongs to the orchestrator, which has a complete local checkout. Do not mark those obligations as verified until CI succeeds.
