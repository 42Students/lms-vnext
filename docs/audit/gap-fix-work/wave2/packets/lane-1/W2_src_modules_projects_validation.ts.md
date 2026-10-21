# Work packet (wave 2): edit src/modules/projects/validation.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l12-u029-superadmin-project-template-resources.md, docs/audit/gap2/lane-13/project-task.md, docs/audit/gap2/lane-2/admin-project-controller.md, docs/audit/gap2/lane-2/admin-project-template-controller.md

## G2-12-029-036  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:259-268 — max500 resources per section.
- vNext now: src/modules/projects/validation.ts:126-129 — max200 resources.
- Fix: Clarify business limit and reject gracefully.

## G2-13-017-020  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:26` taskKey maxlength120, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:29` title maxlength200, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:45` dueLabel maxlength80
- vNext now: `src/modules/projects/validation.ts:12-17` template key <=64 lower-kebab, `src/modules/projects/validation.ts:19` title<=200, `src/db/schema/projects.ts:397-449` no dueLabel
- Fix: Build strict conversion for legacy arbitrary task keys/due labels; do not truncate unique keys

## G2-13-017-021  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:53` estimatePoints nullable Integer, no range in entity
- vNext now: `src/db/schema/projects.ts:486-488` DB CHECK 0..1000; `src/modules/projects/validation.ts:64` template estimate 1..13
- Fix: Reconcile template estimation max13 vs live project task max1000; disclose converted outliers

## G2-2-020-020  [P2] GAP  facet F06  effort M
- Legacy: AdminProjectCreateDTO.java:13-28 title max160, courseLabel max160, dueLabel max80, progress0-100
- vNext now: src/modules/projects/validation.ts:19,328-347 title max200, no dueLabel/progress on create
- Fix: Align exact field lengths and create controls.

## G2-2-020-021  [P2] GAP  facet F06  effort M
- Legacy: AdminProjectCreateDTO.java:28-36 integer college/class/template/mentor IDs, learnerIds
- vNext now: src/modules/projects/validation.ts:329-338 UUID college/template/section/membership, slug required
- Fix: Provide server-assigned slug and explicit ID/role translation.

## G2-2-021-019  [P2] GAP  facet F06  effort M
- Legacy: AdminProjectTemplateUpsertDTO.java:7-28 optional slug,title,summary,courseLabel,status,phase,overview,sprints,tasks,resources,delivery,meetings,activity,expectedTemplateVersion
- vNext now: src/modules/projects/validation.ts:247-309 metadata and blueprint schemas, expectedVersion on revise
- Fix: Map all authored sections and expectedVersion precisely; section-only saves must not overwrite metadata.

## G2-2-021-022  [P2] GAP  facet F06  effort M
- Legacy: AdminProjectTemplateController.java:269-285 create from template uses AdminProjectCreateDTO
- vNext now: src/modules/projects/validation.ts:328-347 createProjectInstanceInputSchema requires slug and IDs
- Fix: Provide equivalent single-create form with server-generated slug/mentor choices.
