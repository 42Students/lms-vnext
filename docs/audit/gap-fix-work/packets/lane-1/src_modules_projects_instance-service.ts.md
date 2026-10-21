# Work packet: edit src/modules/projects/instance-service.ts

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-controller.md, docs/audit/gap2/lane-4/project-workspace-model.md, docs/audit/gap2/lane-5/u028-superadmin-projects-section.md, docs/audit/gap2/lane-8/super-admin-project-workspace-new.md

## G2-2-020-039  [P1] GAP  facet F10  effort M
- Legacy: AdminProjectController.java:499-525 attach template to existing workspace
- vNext now: src/modules/projects/instance-service.ts:148-171 requires template at create
- Fix: Offer attach for unbound historical workspaces or explicit migration exception.

## G2-2-020-044  [P1] GAP  facet F12  effort M
- Legacy: AdminProjectController.java:555-631 archive/delete/restore distinct lifecycle operations
- vNext now: src/modules/projects/instance-service.ts:496-619 ARCHIVED and restore-service.ts:31-54 previous status
- Fix: Model deleted state distinctly from archived and preserve recoverable content.

## G2-4-017-003  [P1] GAP  facet F01  effort M
- Legacy: Legacy controller handles direct /api/v1/projects/me/page and /id routes. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ProjectWorkspaceController.java:81-109`)
- vNext now: New project instance APIs use UUIDs and app routes; legacy numeric paths unsupported. (`src/modules/projects/instance-service.ts:130-155`)
- Fix: Map numeric legacy deep links or document intentional migration break.

## G2-4-017-017  [P1] GAP  facet F04  effort L
- Legacy: Legacy templateId nullable and templateSnapshot JSON nullable. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:79-91`)
- vNext now: New project requires templateId AND templateVersionId and stores materialized related rows. (`src/db/schema/projects.ts:181-190`; `src/modules/projects/instance-service.ts:259-275`)
- Fix: Support historical manual template-less projects if parity required; pin snapshot.

## G2-4-017-041  [P1] GAP  facet F10  effort L
- Legacy: Legacy workspace create can create manual or bulk one-per-learner projects. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectWorkspace.java:96-101`)
- vNext now: New project instance creation requires published assigned template, creates members and releases. (`src/modules/projects/instance-service.ts:148-166`; `src/modules/projects/instance-service.ts:259-319`)
- Fix: Map class bulk creation and uniqueness with template-version materialization.

## G2-5-028-043  [P1] GAP  facet F10  effort M
- Legacy: Legacy create POST with class/mentor/learners and full project metadata. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:467-521`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:173-195`
- vNext now: vNext POST requires assigned template and slug, materializes blueprint. `src/app/api/projects/route.ts:30-53`, `src/modules/projects/instance-service.ts:148-167`
- Fix: Provide migration path for ad-hoc workspace creation or seed assigned templates.

## G2-5-028-046  [P1] GAP  facet F10  effort M
- Legacy: Legacy archive and soft-delete POST, restore supported. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:399-465`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:555-630`
- vNext now: vNext project status + archive, delete lifecycle not exposed in admin listing. `src/components/projects/project-admin-workspace-list.tsx:101-107`, `src/modules/projects/instance-service.ts:148-167`
- Fix: Preserve soft delete/restore semantics and historical visibility.

## G2-5-028-047  [P1] GAP  facet F11  effort M
- Legacy: Legacy collegeId required selected scope, backend requires admin action and module.projects.enabled. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:55-62`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:173-185`
- vNext now: vNext requires projects.manage scoped to college plus published assigned template. `src/modules/projects/instance-service.ts:154-166`
- Fix: Ensure module gate and active college selection match legacy.

## G2-5-028-072  [P1] GAP  facet F21  effort M
- Legacy: Legacy AdminService invokes Spring project/people endpoints. `docs/legacy-source/frontend/src/pages/superadmin/sections/Projects.js:5-18`
- vNext now: vNext Next.js handlers and scoped services; template materialization creates related release/sprints. `src/app/api/projects/route.ts:12-52`, `src/modules/projects/instance-service.ts:148-167`
- Fix: Document integration migration and background notifications.

## G2-5-028-073  [P1] GAP  facet F22  effort M
- Legacy: Legacy ProjectWorkspace fields include courseLabel, phase, progress, blocker,nextAction,dueLabel, classId. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/AdminProjectCreateDTO.java:14-37`
- vNext now: vNext instance stores template-version reference, title, slug, summary, sectionId/status; phase/due/blocker not core create fields. `src/modules/projects/instance-service.ts:259-305`, `src/db/schema/projects.ts:1-110`
- Fix: Record schema field migration and where phase/blockers now live.

## G2-8-028-062  [P1] GAP  facet F22  effort M
- Legacy: Old workspace payload project template numericId, classId and mentorId plus learnerIds docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/new.js:298-307.
- vNext now: New projectInstances UUID template/version/section and projectMembers membership UUID src/modules/projects/instance-service.ts:148-171,261-270.
- Fix: Map numeric legacy IDs to scoped memberships and template version on import.
