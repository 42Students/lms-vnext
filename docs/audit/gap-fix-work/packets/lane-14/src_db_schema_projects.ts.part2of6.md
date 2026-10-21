# Work packet: edit src/db/schema/projects.ts (part 2 of 6)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/project-task.md, docs/audit/gap2/lane-14/u017-project-sprint.md, docs/audit/gap2/lane-16/u028-superadmin-workspace-resources.md, docs/audit/gap2/lane-17/learner-project-detail.md, docs/audit/gap2/lane-17/project-release-entity.md, docs/audit/gap2/lane-2/admin-project-controller.md

## G2-13-017-057  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:20-112` 20+ source fields incl deletion flags, due/sprint labels, assignee snapshot, actor metadata, submittedBy/At
- vNext now: `src/db/schema/projects.ts:397-449` strips many inline fields; `src/db/schema/projects.ts:721-775` adds versioned submissions
- Fix: Build complete column-by-column migration matrix and preserve user-visible snapshots/audit attributes

## G2-13-017-061  [P1] GAP  facet F23  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:23-24` deletedByWorkspace and `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:36-37` isDeleted flags
- vNext now: `src/db/schema/projects.ts:397-449` lacks tombstone; `src/modules/projects/mentor-task-delete-service.ts:54-55` deletes row
- Fix: Close template resurrection/suppression parity before shipping workspace task deletion

## G2-14-017-003  [P1] GAP  facet F02  effort M
- Legacy: Legacy sprint combines planning dates, task-derived status, explicit lifecycle, release and attribution `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:44-128`
- vNext now: New schema separates plan and one status field plus generic timestamps `src/db/schema/projects.ts:342-365`
- Fix: Preserve missing derived status and attribution in display projection

## G2-14-017-007  [P1] GAP  facet F04  effort M
- Legacy: Legacy sprintKey max120 and title max220 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:44-54`
- vNext now: New templateKey varchar64; title unrestricted text `src/db/schema/projects.ts:342-346`
- Fix: Map keys over64 and enforce legacy title max where needed

## G2-14-017-008  [P1] GAP  facet F04  effort M
- Legacy: Legacy separate sprintStatus UPCOMING IN_PROGRESS COMPLETED OVERDUE (derived) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:56-57` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:71-75`
- vNext now: New only status PLANNED ACTIVE COMPLETED `src/db/schema/projects.ts:353-355` `src/db/schema/projects.ts:390-393`
- Fix: Compute and expose progress-derived status independent of lifecycle

## G2-14-017-012  [P1] GAP  facet F04  effort L
- Legacy: Legacy startedBy/At and completedBy/At persisted `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:108-120`
- vNext now: New sprint schema has created/updatedAt, no lifecycle attribution fields `src/db/schema/projects.ts:356-366`
- Fix: Add lifecycle actor/time columns or immutable activity projection

## G2-14-017-014  [P1] GAP  facet F05  effort L
- Legacy: Legacy reads active sprints only by isDeleted false `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectSprintRepository.java:16-20`
- vNext now: New has no soft-delete column, planned delete hard-removes sprint `src/db/schema/projects.ts:328-395` `src/modules/projects/mentor-sprint-delete-service.ts:51-52`
- Fix: Preserve history/tombstones for intentionally removed legacy sprints

## G2-14-017-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy deletedByWorkspace defaults false `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:41-42`
- vNext now: New has no deletion intent flag `src/db/schema/projects.ts:328-395`
- Fix: Record deliberate workspace removals for template reconciliation

## G2-14-017-037  [P1] GAP  facet F12  effort M
- Legacy: Legacy sprintState PLANNED ACTIVE COMPLETED distinct from task progress derived status `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:71-77`
- vNext now: New single status PLANNED ACTIVE COMPLETED `src/db/schema/projects.ts:353-355`
- Fix: Avoid conflating progress badge and actionable sprint state

## G2-14-017-060  [P1] GAP  facet F22  effort L
- Legacy: Legacy project_sprint table int projectId, releaseId, created/updated actor, deleted flag `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:34-45` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:90-120`
- vNext now: New project_sprints UUID FK and timestamps but no actor/tombstone `src/db/schema/projects.ts:328-366`
- Fix: Document complete DB field disposition

## G2-14-017-061  [P1] GAP  facet F22  effort M
- Legacy: Legacy sprintKey max120, title max220, sortOrder and sprintNumber distinct `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:44-51` `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:79-80`
- vNext now: New templateKey max64, title text, sequence unique per release `src/db/schema/projects.ts:342-352` `src/db/schema/projects.ts:368-375`
- Fix: Map long key and ordering collisions before migration

## G2-14-017-062  [P1] GAP  facet F22  effort M
- Legacy: Legacy sprintStatus and sprintState separate columns `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:56-77`
- vNext now: New one status and check PLANNED ACTIVE COMPLETED `src/db/schema/projects.ts:353-355` `src/db/schema/projects.ts:390-393`
- Fix: Rebuild progress derivation and lifecycle independently

## G2-14-017-063  [P1] GAP  facet F22  effort L
- Legacy: Legacy dueLabel/releaseLabel and started/completed actor/time fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectSprint.java:59-120`
- vNext now: New dueDate/releaseId and generic updatedAt only `src/db/schema/projects.ts:337-366`
- Fix: Provide reversible migration for lost display/attribution data

## G2-16-028-049  [P1] GAP  facet F22  effort L
- Legacy: ProjectResource.java:19-56 uses numeric projectId, resourceKey 120, resourceOrder integer, title 200, type/kind, pinned and required.
- vNext now: projects.ts:558-626 UUID project, nullable templateKey 64, sequence and enum-checked type/status/visibility.
- Fix: Create explicit legacy-to-vNext field and enum mapping including both kind and type, preserving ids/order.

## G2-16-028-050  [P1] GAP  facet F22  effort L
- Legacy: ProjectResource.java:58-101 retains sprint/task key/label, resourceUrl,fileUrl,attachmentUrl,fileName,uploadedBy and downloadUrl.
- vNext now: projects.ts:558-626 retains sprintId/taskId/url but omits those file-origin and uploader columns.
- Fix: Map links and file provenance to project_resource_files and storage metadata or record unmigrated fields.

## G2-17-004-040  [P1] GAP  facet F22  effort 
- Legacy: docs/legacy-source/frontend/src/pages/learn/projects/[projectId].js:7-15 projectId path token accepted without UUID check in wrapper; original backend project instance entity not present in this unit.
- vNext now: src/db/schema/projects.ts:172-182 projectInstances uses UUID id and collegeId, src/app/(authenticated)/learn/projects/[projectId]/page.tsx:40 UUID-only route.
- Fix: Record project identifier compatibility policy and valid legacy link shape even without data migration.

## G2-17-017-023  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V119__project_releases.sql:7-24 — project_release table with direct project, key, target date, notes, status, version.
- vNext now: src/db/schema/projects.ts:276-325 — Normalized release table lacks target date, notes/version/sortOrder fields.
- Fix: Extend schema + API safely to preserve legacy fields.

## G2-17-017-045  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V119__project_releases.sql:7-24 — Legacy MySQL int PK, varchar key/title, nullable targetDate, sort_order, notes, version, is_deleted.
- vNext now: src/db/schema/projects.ts:276-325 — UUID PK, templateKey, TEXT title/description, sequence, status, timestamps.
- Fix: Create complete per-column migration including target_date, version, creators and soft-deletes.

## G2-2-020-045  [P1] GAP  facet F12  effort M
- Legacy: ProjectWorkspaceDTO.java:19-23 lifecycleStatus/templateBound/recoverableContent
- vNext now: src/db/schema/projects.ts:199-227 status PLANNED/ACTIVE/COMPLETED/ARCHIVED
- Fix: Add content recoverability and template-bound flags to read model.

## G2-2-020-071  [P1] GAP  facet F22  effort M
- Legacy: ProjectWorkspaceDTO.java:19-23 deleted/content recoverability flags
- vNext now: src/db/schema/projects.ts:199-227 archived status only
- Fix: Add deleted vs archived and recoverability metadata.
