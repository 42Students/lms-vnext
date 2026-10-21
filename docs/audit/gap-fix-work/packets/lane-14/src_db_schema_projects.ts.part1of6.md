# Work packet: edit src/db/schema/projects.ts (part 1 of 6)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l15-u028-superadmin-workspace-sprints.md, docs/audit/gap2/lane-10/superadmin-projects-template-tasks.md, docs/audit/gap2/lane-10/superadmin-projects-workspaces.md, docs/audit/gap2/lane-12/project-task-comment.md, docs/audit/gap2/lane-13/project-task.md

## G2-15-028-050  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:26-70 — sprint rows keep key,dueLabel,releaseKey,goal,description.
- vNext now: src/db/schema/projects.ts:172-273 — normalized projectSprints and projectReleases, no free-text dueLabel mapping shown.
- Fix: Write schema/data migration for dueLabel/key and release grouping.

## G2-10-029-055  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:223-235 — upsert DTO tasks embedded in mutable template object.
- vNext now: src/db/schema/projects.ts:26-121 — template and immutable version rows with JSONB blueprint, version number and author.
- Fix: Write explicit version migration and taskField compatibility map.

## G2-10-028-056  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:306-323 — legacy numeric collegeId, ProjectWorkspaceDTO and five states.
- vNext now: src/db/schema/projects.ts:172-198,234-252 — UUID IDs, mandatory template/version, four-state check.
- Fix: Write status/data migration map incl missing template.

## G2-12-017-007  [P1] MISSING  facet F03  effort S
- Legacy: System event badges REVIEW,BLOCKED,STATUS_UPDATE produced by quick actions `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:6-13,30-35`
- vNext now: New schema accepts only three human values `src/db/schema/projects.ts:545-547`
- Fix: Include distinct system event types in associated activity projection.

## G2-12-017-013  [P1] MISSING  facet F04  effort M
- Legacy: Old progressValue nullable integer stores progress percent `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:34-35`
- vNext now: No progressValue in registered projectTaskComments; staged schema has it but not deployed `src/db/schema/projects.ts:500-530` `src/db/schema/project-audit-staged.ts:88-102`
- Fix: Promote progress_value with 0..100 validation, expose it in activity feed.

## G2-12-017-014  [P1] GAP  facet F04  effort M
- Legacy: Old commentType varchar30 stores six human/system variants `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:37-38` `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:13,21-35`
- vNext now: New commentKind varchar24 only NOTE/PROGRESS_UPDATE/FLAG_FOR_MENTOR `src/db/schema/projects.ts:517-519,545-547`
- Fix: Provide full comment-kind parity and migration aliases.

## G2-12-017-015  [P1] MISSING  facet F04  effort M
- Legacy: Old taskStatusSnapshot varchar30 nullable `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:40-41`
- vNext now: New registered schema omits status snapshot; staged has it only `src/db/schema/projects.ts:500-530` `src/db/schema/project-audit-staged.ts:88-102`
- Fix: Promote task status snapshot to registered schema and write on state action.

## G2-12-017-058  [P1] GAP  facet F22  effort L
- Legacy: Old MySQL project_task_comment int id, is_deleted, commenter metadata, progress_value, comment_type,status_snapshot `docs/legacy-source/backend/src/main/resources/db/migration/V76__project_task_comments.sql:1-17` `docs/legacy-source/backend/src/main/resources/db/migration/V77__project_task_comment_actions.sql:5-25`
- vNext now: Registered PG projectTaskComments UUID, authorMembership FK/body/kind, no progress/snapshot/deleted `src/db/schema/projects.ts:500-555`
- Fix: Promote needed staged columns, migrate legacy types, preserve historical system events.

## G2-12-017-060  [P1] GAP  facet F22  effort M
- Legacy: Old commentType VARCHAR30 includes NOTE/PROGRESS/NEEDS_HELP/REVIEW/BLOCKED/STATUS_UPDATE `docs/legacy-source/backend/src/main/resources/db/migration/V77__project_task_comment_actions.sql:1-14` `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:13-35`
- vNext now: New commentKind VARCHAR24 CHECK only three values `src/db/schema/projects.ts:517-519,545-547`
- Fix: Backfill legacy enum aliases and represent system state audit kinds.

## G2-13-017-001  [P1] GAP  facet F01  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:14-18` project_task entity with projectId/taskKey and workspace/template merge semantics
- vNext now: `src/db/schema/projects.ts:397-416` project_tasks uses projectInstances FK, templateKey, sprintId and carriedFromSprintId
- Fix: Map legacy task identity and template-vs-workspace merge state to UUID task and templateKey without resurrecting deleted overrides

## G2-13-017-007  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:20` projectId Integer, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:26` taskKey varchar120 unique per project
- vNext now: `src/db/schema/projects.ts:401-405` projectId UUID FK, `src/db/schema/projects.ts:415-418` templateKey varchar64 unique per project `src/db/schema/projects.ts:455-458`
- Fix: Crosswalk legacy project/task IDs and handle task keys longer than 64 without silent truncation/collision

## G2-13-017-010  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:41-48` dueDate, dueLabel, sprintKey, sprintLabel
- vNext now: `src/db/schema/projects.ts:406-414` sprintId/held carry refs, `src/db/schema/projects.ts:436` dueDate; no dueLabel/sprintLabel
- Fix: Preserve display label data or derive equivalent from linked sprint descriptions with verified rendering

## G2-13-017-013  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:68-75` assigneeId/assigneeType/assigneeName denormalized
- vNext now: `src/db/schema/projects.ts:430-433` single assigneeMembershipId UUID FK
- Fix: Resolve learner/faculty ID namespace ambiguity and preserve historical assignee display snapshot when needed

## G2-13-017-015  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:85-92` submissionUrl<=2048,submittedBy int,submittedAt LocalDateTime
- vNext now: `src/db/schema/projects.ts:735-752` version,submittedByMembershipId,submissionUrl text,submittedAt timestamptz
- Fix: Migrate URL and submitter to first versioned submission with accurate IST timestamp and validation cap

## G2-13-017-016  [P1] GAP  facet F04  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:94-104` sortOrder,createdBy,createdByType,updatedBy
- vNext now: `src/db/schema/projects.ts:428` sequence, `src/db/schema/projects.ts:439-448` timestamps but no creator/updater on task row
- Fix: Preserve creator/updater provenance via durable task activity history and migration actor references

## G2-13-017-031  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTaskRepository.java:15-19` JPA read/count soft-deleted=false projectId
- vNext now: `src/db/schema/projects.ts:401-405` FK and `src/db/schema/projects.ts:466-469` project/status index, no isDeleted
- Fix: Implement deleted-as-suppressed state when task template fallback requires history; otherwise document intentional hard deletion

## G2-13-017-033  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:97-104` createdByType disambiguates int actor IDs
- vNext now: `src/modules/projects/learner-own-task-service.ts:57-63` event metadata createdByMembershipId; `src/db/schema/projects.ts:439-448` no creator columns
- Fix: Guarantee every create/edit activity event carries durable actor and original role type

## G2-13-017-035  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:68-75` assigneeId+assigneeType allow learner/faculty separate ID namespaces
- vNext now: `src/db/schema/projects.ts:430-433` FK to collegeMemberships only; `src/modules/projects/learner-own-task-service.ts:20-27` learner mutation guard
- Fix: Map faculty/nonlearner assignment records with explicit owner decision; avoid accidental learner conversion

## G2-13-017-038  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:23-24` deletedByWorkspace false and BaseModel isDeleted false are distinct flags
- vNext now: `src/modules/projects/mentor-task-delete-service.ts:54-55` hard delete, `src/db/schema/projects.ts:397-449` no soft-delete fields
- Fix: Preserve distinction between soft-delete and workspace suppression in parity data model

## G2-13-017-052  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:26` taskKey varchar120, template key may be user-defined
- vNext now: `src/modules/projects/validation.ts:12-17` key 64 lower-kebab, `src/db/schema/projects.ts:415-417` varchar64
- Fix: Safely re-key invalid keys and preserve original as migration metadata/reference for copied tasks
