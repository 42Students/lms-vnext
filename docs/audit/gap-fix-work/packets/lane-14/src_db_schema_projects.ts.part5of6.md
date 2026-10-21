# Work packet: edit src/db/schema/projects.ts (part 5 of 6)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u017-project-template-version.md, docs/audit/gap2/lane-5/u028-superadmin-projects-section.md, docs/audit/gap2/lane-5/u029-superadmin-project-template-create.md, docs/audit/gap2/lane-6/l12-u026-project-workspace-controller.md, docs/audit/gap2/lane-7/u019-college-admin-project-workspaces-list.md, docs/audit/gap2/lane-7/u020-college-admin-workspace-create.md

## G2-5-017-014  [P1] GAP  facet F05  effort L
- Legacy: Legacy allows multiple history events for same numeric templateVersion `docs/legacy-source/backend/src/main/resources/db/migration/V160__project_template_version_sort_index.sql:1-7`
- vNext now: New unique (templateId,version) invariant permits one row per version `src/db/schema/projects.ts:104-116`
- Fix: Preserve action event stream in separate audit table or coalesce with provenance mapping.

## G2-5-017-030  [P1] GAP  facet F12  effort M
- Legacy: Legacy lifecycleStatus varchar20 and actionType varchar40 free-text `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTemplateVersion.java:19-24`
- vNext now: New current template status constrained DRAFT/PUBLISHED/ARCHIVED, no action type `src/db/schema/projects.ts:30-62,90-103`
- Fix: Migrate action taxonomy and lifecycle interpretation explicitly.

## G2-5-017-046  [P1] GAP  facet F22  effort L
- Legacy: Legacy BaseModel integer PK, template_id integer, no explicit FK in entity, JSON snapshot `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTemplateVersion.java:12-35`
- vNext now: New UUID PK/template FK, version integer, blueprint JSONB, author FK, createdAt `src/db/schema/projects.ts:81-115`
- Fix: Map ID/author/time, snapshot key shapes and historical action metadata in migration.

## G2-5-017-047  [P1] GAP  facet F22  effort L
- Legacy: Legacy permitted multiple actions per numeric template_version `docs/legacy-source/backend/src/main/resources/db/migration/V160__project_template_version_sort_index.sql:1-7`
- vNext now: New unique `(templateId,version)` constraint `src/db/schema/projects.ts:104-108`
- Fix: Preserve or intentionally collapse action duplicates with immutable event ledger.

## G2-5-028-073  [P1] GAP  facet F22  effort M
- Legacy: Legacy ProjectWorkspace fields include courseLabel, phase, progress, blocker,nextAction,dueLabel, classId. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/AdminProjectCreateDTO.java:14-37`
- vNext now: vNext instance stores template-version reference, title, slug, summary, sectionId/status; phase/due/blocker not core create fields. `src/modules/projects/instance-service.ts:259-305`, `src/db/schema/projects.ts:1-110`
- Fix: Record schema field migration and where phase/blockers now live.

## G2-5-028-074  [P1] GAP  facet F22  effort M
- Legacy: Legacy separate archive vs soft delete/restore statuses. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectController.java:555-630`
- vNext now: vNext projectInstances ARCHIVED status and member endedAt/soft relations, legacy delete action not in mapped list. `src/db/schema/projects.ts:1-110`, `src/components/projects/project-admin-workspace-list.tsx:101-107`
- Fix: Specify deleted_at equivalent and archived/unarchived states.

## G2-5-029-014  [P1] GAP  facet F04  effort M
- Legacy: Legacy initial workspace status ACTIVE by default; options Active,In progress,Ready,Blocked. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:229-239`
- vNext now: vNext template lifecycle DRAFT and no initial-workspace-status metadata in create model. `src/db/schema/projects.ts:26-69`, `src/components/projects/super-admin-template-create-form.tsx:13-18`
- Fix: Map old initial workspace status to explicit workspace creation defaults or approved removal.

## G2-5-029-042  [P1] GAP  facet F12  effort M
- Legacy: Legacy lifecycle draft/published selectable immediately; archived disabled to prevent hidden template. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:75-85,209-237`
- vNext now: vNext always DRAFT on insert; publishing separate state transition. `src/db/schema/projects.ts:33-69`, `src/modules/projects/template-service.ts:259-293`
- Fix: Make create+publish path where authorized or document staged publication deviation.

## G2-5-029-067  [P1] GAP  facet F22  effort M
- Legacy: Legacy DTO fields slug,title,summary,courseLabel,status,lifecycleStatus,phase,overview,sprints,tasks,resources, etc. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/AdminProjectTemplateUpsertDTO.java:6-29`
- vNext now: vNext projectTemplates + version JSON blueprint fields; no template initial status/phase standalone. `src/db/schema/projects.ts:26-120`, `src/modules/projects/super-admin-template-create-model.ts:9-23`
- Fix: Map all legacy fields to blueprint and version rows, avoid dropped status.

## G2-5-029-069  [P1] GAP  facet F22  effort M
- Legacy: Legacy lifecycle may be published on create. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:75-85`
- vNext now: vNext status DRAFT default, publishedVersion nullable until publish. `src/db/schema/projects.ts:33-39`
- Fix: Clarify publish migration for legacy published templates.

## G2-12-026-037  [P1] GAP  facet F22  effort M
- Legacy: Legacy ProjectWorkspaceDTO and nested project member/task/release/delivery entities (ProjectWorkspaceController.java:3-22).
- vNext now: Drizzle projects.ts normalized project rows, members, tasks, releases, submissions (src/db/schema/projects.ts).
- Fix: Compare DTO field matrix, default/nullable values and exact constraints.

## G2-7-019-054  [P1] GAP  facet F12  effort S
- Legacy: workspaces/index.js:27-28 status filter includes READY, BLOCKED and IN_PROGRESS
- vNext now: projects.ts:249-252 status check PLANNED,ACTIVE,COMPLETED,ARCHIVED
- Fix: Document mapping of legacy readiness and blocked states to risk/status separately, with correct filters.

## G2-7-019-089  [P1] GAP  facet F22  effort S
- Legacy: ProjectWorkspace.java:19-22 global unique slug80,title160
- vNext now: projects.ts:192-194,235-239 college-scoped lowercase unique slug96,title text
- Fix: Document deliberate tenant-scoped dedupe, length validation and historical slug conflicts.

## G2-7-019-090  [P1] GAP  facet F22  effort S
- Legacy: ProjectWorkspace.java:31-38 default IN_PROGRESS and integer progress
- vNext now: projects.ts:195-198 default PLANNED progressPercent smallint 0
- Fix: Map status defaults and derived vs persisted progress during import/parity.

## G2-7-019-091  [P1] GAP  facet F22  effort S
- Legacy: ProjectWorkspace.java:67-85 numeric org/college/class/teamGroup/template IDs
- vNext now: projects.ts:175-202 UUID college/template/team group; sectionId relation
- Fix: Specify crosswalk and ownership enforcement for class/team/template mapping.

## G2-7-019-092  [P1] GAP  facet F22  effort S
- Legacy: ProjectWorkspace.java:87-105 JSON templateSnapshot and overview, recoverableContent flag
- vNext now: projects.ts:181-190 version FK,209 authoredBrief; no recoverable_content
- Fix: Document immutable snapshot/version semantics and recoverable content separately.

## G2-7-020-103  [P1] GAP  facet F22  effort M
- Legacy: AdminProjectCreateDTO.java:14-18 title VARCHAR160 and @Size160
- vNext now: validation.ts:19,333 max200; projects.ts:193 unbounded text
- Fix: Enforce legacy cap or explicitly migrate contract and document

## G2-7-020-105  [P1] GAP  facet F22  effort L
- Legacy: ProjectWorkspace.java:19-38 slug80, title160 and IN_PROGRESS default
- vNext now: projects.ts:192-198 slug96, text title, PLANNED default
- Fix: Document legacy data/default conversion and slug uniqueness

## G2-7-020-106  [P1] GAP  facet F22  effort L
- Legacy: ProjectWorkspace.java:67-91 numeric IDs and template_snapshot JSON
- vNext now: projects.ts:175-190 UUID foreign keys and template version
- Fix: Map numeric IDs and immutable template snapshot to version snapshot

## G2-7-021-091  [P1] GAP  facet F22  effort L
- Legacy: reassign-mentor.js:312-325 frontend uses userId, roleLabel and project id
- vNext now: projects.ts:638-692 projectMembers membershipId role isPrimary roleLabel endedAt indexes
- Fix: Map legacy user ID primary FACULTY to UUID membership and active-row constraints
