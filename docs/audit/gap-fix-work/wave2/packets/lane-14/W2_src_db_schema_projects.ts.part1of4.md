# Work packet (wave 2): edit src/db/schema/projects.ts (part 1 of 4)

40 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-workspaces.md, docs/audit/gap2/lane-12/project-task-comment.md, docs/audit/gap2/lane-13/project-task.md, docs/audit/gap2/lane-14/u017-project-sprint.md, docs/audit/gap2/lane-16/u028-superadmin-workspace-resources.md, docs/audit/gap2/lane-17/project-release-entity.md

## G2-10-028-057  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/adminProjectUtils.js:113-142 — members array and tasks/sprints completion.
- vNext now: src/db/schema/projects.ts:172-198 and src/modules/projects/admin-insights-service.ts:178-189 — normalized table aggregates.
- Fix: Compare member/archival and completion inclusion.

## G2-12-017-001  [P2] GAP  facet F01  effort S
- Legacy: ProjectTaskComment entity stores projectId and projectTaskId, shown inside task detail modal `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:10-20` `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:588-608`
- vNext now: New comment belongs to project/task and is behind 'Comments' expansion `src/db/schema/projects.ts:500-510` `src/components/projects/project-task-comments.tsx:47-51`
- Fix: Match always-visible Comments section in task modal instead of nested disclosure.

## G2-12-017-009  [P2] GAP  facet F04  effort M
- Legacy: Old projectId/taskId INT required `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:16-20` `docs/legacy-source/backend/src/main/resources/db/migration/V76__project_task_comments.sql:6-7`
- vNext now: New UUID projectId/taskId with composite FK `src/db/schema/projects.ts:504-510,532-536`
- Fix: Map legacy integer IDs and enforce correct project/task association.

## G2-12-017-010  [P2] GAP  facet F04  effort M
- Legacy: Old commenterId nullable and commenterType string max20 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:22-26`
- vNext now: New authorMembershipId non-null UUID FK; no commenterType field `src/db/schema/projects.ts:511-515`
- Fix: Represent legacy reviewer/learner identity, include role at creation for historical audit.

## G2-12-017-011  [P2] GAP  facet F04  effort M
- Legacy: Old commenterName string snapshot max160 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:28-29`
- vNext now: New live users.displayName join and no saved name `src/modules/projects/task-comment-service.ts:20-31` `src/db/schema/projects.ts:511-520`
- Fix: Persist author-name snapshot or durable tombstone pseudonym.

## G2-12-017-012  [P2] GAP  facet F04  effort S
- Legacy: Old message TEXT nullable at entity but @NotBlank in write DTO `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:31-32` `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectTaskCommentUpsertDTO.java:7-10`
- vNext now: New body text NOT NULL + trim1..4000 `src/db/schema/projects.ts:516,541-544`
- Fix: Preserve historic system comments with empty/null message if needed, but validate new input.

## G2-12-017-039  [P2] GAP  facet F12  effort M
- Legacy: Old soft deletion isDeleted inherited and repository filters active only `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:36-37` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTaskCommentRepository.java:14-15`
- vNext now: New table has no deletion flag, no DELETE route for comments `src/db/schema/projects.ts:500-530` `src/app/api/projects/[projectId]/tasks/[taskId]/comments/route.ts:8-18`
- Fix: Define retention and migration of deleted old comments.

## G2-12-017-042  [P2] GAP  facet F13  effort S
- Legacy: Old read may show body nullable and filters historical rows `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:31-41` `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:603-624`
- vNext now: New body NOT NULL and all rows visible; deleted historical records not modelled `src/db/schema/projects.ts:516,541-544` `src/modules/projects/task-comment-service.ts:20-31`
- Fix: Offer migration fallback for legacy null/event rows.

## G2-12-017-054  [P2] GAP  facet F19  effort M
- Legacy: Old indexed project/task/is_deleted, sort by int id ASC `docs/legacy-source/backend/src/main/resources/db/migration/V76__project_task_comments.sql:13-16` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTaskCommentRepository.java:14-15`
- vNext now: New index taskId+createdAt and project+task composite FK, ascending read `src/db/schema/projects.ts:532-540` `src/modules/projects/task-comment-service.ts:28-31`
- Fix: Verify indexes support project-scoped reads and system timeline sorting.

## G2-13-017-005  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:35-39` taskStatus TO_DO, priority MEDIUM; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:55-57` taskType STORY
- vNext now: `src/modules/projects/constants.ts:39-45` status TODO and `src/modules/projects/constants.ts:9-16` priority MEDIUM; `src/db/schema/projects.ts:438` taskType nullable
- Fix: Normalize legacy TO_DO→TODO and legacy STORY default to taskType STORY on migrated tasks

## G2-13-017-006  [P2] GAP  facet F03  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:44-48` dueLabel/sprintLabel visible text metadata independent of dates/sprint ID
- vNext now: `src/db/schema/projects.ts:406-419` sprint linked UUID, no dueLabel or sprintLabel columns
- Fix: Preserve custom due labels and existing sprint label snapshots where UI relies on them

## G2-13-017-009  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:35-39` taskStatus varchar40 TO_DO and priority MEDIUM
- vNext now: `src/db/schema/projects.ts:422-427` priority MEDIUM, status TODO CHECK 5 values
- Fix: Map legacy status aliases and invalid historic priorities in migration with diagnostics

## G2-13-017-012  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:65-67` carriedOverFromSprintKey free text
- vNext now: `src/db/schema/projects.ts:410-414` FK carriedFromSprintId and carriedOverAt
- Fix: Resolve old carry-origin string keys to UUID sprint rows; retain orphan-key text in migration diagnostics

## G2-13-017-017  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:106-112` @Version optimistic lock
- vNext now: `src/db/schema/projects.ts:444-448` updatedAt used as optimistic token in `src/modules/projects/mentor-backlog-service.ts:59-68`
- Fix: Document version-long vs millisecond updatedAt CAS; expose stale-edits consistently

## G2-13-017-018  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectTaskRepository.java:15-16` order by sortOrder ASC,id ASC for active project tasks
- vNext now: `src/db/schema/projects.ts:428` sequence required and `src/db/schema/projects.ts:459-462` unique sprint/sequence; `src/modules/projects/mentor-backlog-service.ts:55-68` appends sequence at sprint/backlog tail
- Fix: Map old sortOrder to sprint-local sequence, resolve collisions and preserve relative order

## G2-13-017-020  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:26` taskKey maxlength120, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:29` title maxlength200, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:45` dueLabel maxlength80
- vNext now: `src/modules/projects/validation.ts:12-17` template key <=64 lower-kebab, `src/modules/projects/validation.ts:19` title<=200, `src/db/schema/projects.ts:397-449` no dueLabel
- Fix: Build strict conversion for legacy arbitrary task keys/due labels; do not truncate unique keys

## G2-13-017-021  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:53` estimatePoints nullable Integer, no range in entity
- vNext now: `src/db/schema/projects.ts:486-488` DB CHECK 0..1000; `src/modules/projects/validation.ts:64` template estimate 1..13
- Fix: Reconcile template estimation max13 vs live project task max1000; disclose converted outliers

## G2-13-017-039  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:35-39` default TO_DO/MEDIUM, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:57` STORY
- vNext now: `src/db/schema/projects.ts:422-427` default TODO/MEDIUM and taskType null; `src/modules/projects/constants.ts:39-45` enums
- Fix: Import status alias and default taskType STORY for legacy rows unless explicitly other type

## G2-13-017-048  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:35` default status `TO_DO`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:55` default type STORY
- vNext now: `src/modules/projects/constants.ts:39-45` `TODO`, `src/db/schema/projects.ts:438` taskType null
- Fix: Set display label 'To do' while translating stored legacy TO_DO, preserve STORY badge

## G2-13-017-049  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:44` dueLabel and `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:48` sprintLabel stored custom text
- vNext now: `src/db/schema/projects.ts:436` dueDate + `src/db/schema/projects.ts:406-413` sprint FK, no label strings
- Fix: Preserve exact historical due/sprint label copy for board details and export

## G2-13-017-055  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:14-18` JPA table project_task and V75 schema `docs/legacy-source/backend/src/main/resources/db/migration/V75__project_tasks.sql:1-26`
- vNext now: `src/db/schema/projects.ts:397-498` Drizzle project_tasks, note modern mutation migration 0110 for backlog
- Fix: Write schema/ID crosswalk between project_workspace and project_instances and task keys

## G2-13-017-058  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/resources/db/migration/V75__project_tasks.sql:1-26` legacy unique project_id+task_key and index project,is_deleted,sort_order
- vNext now: `src/db/schema/projects.ts:455-472` unique project/templateKey and sprint sequence/backlog indexes
- Fix: Detect duplicate keys and ordering collisions; recreate expected list behavior with filtered indexes

## G2-13-017-059  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:106-112` optimistic version starts null then auto increments
- vNext now: `src/db/schema/projects.ts:444-448` updatedAt CAS with no numeric version
- Fix: Translate legacy version tokens to updatedAt on first edit, avoid stale edit accept due to millisecond rounding

## G2-14-017-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy sprint keyed by projectId and sprintKey in URLs `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:38-45` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ProjectWorkspaceService.java:94-111`
- vNext now: New IDs are UUID sprintId and projectId `src/db/schema/projects.ts:331-345` `src/modules/projects/lifecycle-service.ts:134-145`
- Fix: Provide deep-link mapper from project/sprintKey to UUID

## G2-14-017-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy sprint number, release label and due label available to UI `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:62-88`
- vNext now: New sequence and releaseId, no dueLabel or releaseLabel columns `src/db/schema/projects.ts:337-353`
- Fix: Restore display adapters for due label and release label

## G2-14-017-010  [P2] GAP  facet F04  effort M
- Legacy: Legacy sprintNumber separate from sortOrder `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:47-48` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:79-80`
- vNext now: New sequence integer only `src/db/schema/projects.ts:352-353`
- Fix: Map numbering and sort to stable sequence

## G2-14-017-011  [P2] GAP  facet F04  effort M
- Legacy: Legacy releaseLabel fallback and mandatory releaseId `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:85-100`
- vNext now: New releaseId required, no releaseLabel `src/db/schema/projects.ts:337-341`
- Fix: Expose release title/label via join for archived snapshots

## G2-14-017-013  [P2] GAP  facet F05  effort M
- Legacy: Legacy repository defaults sortOrder asc then ID asc `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectSprintRepository.java:16-17`
- vNext now: New sequence indexed unique within release `src/db/schema/projects.ts:372-375`
- Fix: Sort by mapped global sortOrder then UUID and release

## G2-14-017-017  [P2] GAP  facet F06  effort S
- Legacy: Legacy sprintState default PLANNED, sprintStatus default UPCOMING `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:56-57` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:76-77`
- vNext now: New status default PLANNED, no derived field `src/db/schema/projects.ts:353-355`
- Fix: Preserve computed UPCOMING on first creation

## G2-14-017-020  [P2] GAP  facet F06  effort M
- Legacy: Legacy dueLabel varchar80 and releaseLabel varchar160 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:62-63` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:87-88`
- vNext now: New fields absent `src/db/schema/projects.ts:342-353`
- Fix: Add display compatibility mapping and max lengths

## G2-14-017-039  [P2] GAP  facet F12  effort M
- Legacy: Legacy mandatory release link, prior fallback label when migrating old data `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:85-100`
- vNext now: New FK releaseId mandatory and no fallback `src/db/schema/projects.ts:337-341`
- Fix: Map release labels and migration orphan handling

## G2-14-017-045  [P2] GAP  facet F14  effort M
- Legacy: Legacy template JSON storage renamed milestone keys in migrations V141–143 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:13-29`
- vNext now: New stores templateKey and releaseId relationships `src/db/schema/projects.ts:337-345`
- Fix: Reconcile imported legacy sprint JSON key names and lengths

## G2-14-017-051  [P2] GAP  facet F18  effort S
- Legacy: Legacy dueLabel and releaseLabel readable labels `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:62-63` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:87-88`
- vNext now: New no equivalent columns `src/db/schema/projects.ts:337-353`
- Fix: Restore labels via projected release/period UI

## G2-14-017-052  [P2] GAP  facet F18  effort S
- Legacy: Legacy task-derived sprintStatus can display OVERDUE `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:71-75`
- vNext now: New status enum excludes OVERDUE `src/db/schema/projects.ts:390-393`
- Fix: Add derived overdue badge without changing persisted lifecycle

## G2-14-017-054  [P2] GAP  facet F19  effort S
- Legacy: Legacy fixed sortOrder/id order `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectSprintRepository.java:16-17`
- vNext now: New sequence and active uniqueness per project `src/db/schema/projects.ts:352-381`
- Fix: Define deterministic ordering under multiple releases

## G2-16-028-011  [P2] MISSING  facet F04  effort M
- Legacy: ProjectResource.java:24-29 resourceKey and resourceOrder are first-class persistence values.
- vNext now: projects.ts:558-626 uses templateKey and sequence; project-resource-list.tsx:163-221 does not show key editor.
- Fix: Expose stable resource key and map legacy resource_order to sequence, preserving imported keys.

## G2-16-028-016  [P2] MISSING  facet F06  effort M
- Legacy: projectSectionFieldConfigs.js:147-165 Key optional, with preview if blank (`Auto-generated from title if left blank`).
- vNext now: project-resource-controls.tsx:74-173 has no editable key or slug preview; projects.ts:559-606 templateKey only.
- Fix: Add Key (optional), preview, unique-key persistence and safe key generation.

## G2-16-028-047  [P2] GAP  facet F20  effort M
- Legacy: projectSectionFieldConfigs.js:348-353 generates unique keys for repeated names; RepeatingItemEditor.jsx:87-95 handles adjacent reorder.
- vNext now: projects.ts:602-608 has unique template key + sequence constraints; resource-service.ts:147-169 uses max+1.
- Fix: Handle concurrent sequence insertion conflicts and repeated slug names predictably.

## G2-17-017-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectRelease.java:13-22 — Real release groups sprints under project; unique project/release key.
- vNext now: src/db/schema/projects.ts:276-309 — Normalized project_releases grouped by project and templateKey.
- Fix: Preserve project/release deep links and key alias mapping.

## G2-17-017-007  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectRelease.java:41-42 — Explicit sortOrder default zero.
- vNext now: src/db/schema/projects.ts:290-312 — sequence required with per-project uniqueness.
- Fix: Expose sort/reorder controls and preserve imported order.
