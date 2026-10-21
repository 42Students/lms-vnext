# Work packet: NEW / MISSING items from docs/audit/gap2/lane-8/project-template.md

16 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-8/project-template.md

## G2-8-017-010  [P1] GAP  facet F04  effort L
- Legacy: LBE/dto/projects/ProjectTemplateDTO.java:7-20 numeric id, slug, title, summary, courseLabel, status, version, lifecycle, timestamps, phase, org/college/creator
- vNext now: V/db/schema/projects.ts:26-58 UUID, slug/title/summary, status, current/published version, creator UUID, archivedAt, timestamps
- Fix: Write field-by-field DTO adapter for courseLabel, phase, creation scope, lifecycle and published timestamp, or explicitly deprecate each.

## G2-8-017-011  [P1] GAP  facet F04  effort L
- Legacy: LBE/dto/projects/ProjectTemplateDTO.java:21-27 seven independent JSON sections including delivery/meetings/activity
- vNext now: V/db/schema/projects.ts:81-107; V/modules/projects/validation.ts:98-130 versioned blueprint has overview/releases/sprints/tasks/resources only
- Fix: Map delivery, meetings and activity into versioned blueprint or document intentional non-migration with a verified replacement.

## G2-8-017-022  [P1] GAP  facet F06  effort L
- Legacy: LBE/dto/projects/AdminProjectTemplateUpsertDTO.java:7-22 optional courseLabel, phase, status, lifecycleStatus, seven JSON sections
- vNext now: V/modules/projects/validation.ts:247-254,290-303 create/revise inputs exclude metadata and use single blueprint
- Fix: Add editable metadata equivalents or deprecation decisions with UI controls and migration mapping.

## G2-8-017-023  [P1] GAP  facet F06  effort M
- Legacy: LBE/dto/projects/AdminProjectTemplateUpsertDTO.java:23-28 expectedTemplateVersion optional for section-only updates, omitted title preserves metadata
- vNext now: V/modules/projects/validation.ts:290-303 expectedVersion mandatory and title required for revision
- Fix: Support legacy section-only writes without title and equivalent CAS; keep newer optimistic guard.

## G2-8-017-037  [P1] GAP  facet F10  effort M
- Legacy: LBE/controller/AdminProjectTemplateController.java:304-323,392-433 DELETE archive, POST publish/unpublish
- vNext now: V/modules/projects/template-service.ts:380-535,636-670 mutation states + activity log with archive guard
- Fix: Check archive with active college assignments; surface guard and workflow to revoke before archive.

## G2-8-017-044  [P1] GAP  facet F12  effort L
- Legacy: LBE/model/ProjectTemplate.java:22-44 slug unique global, lifecycle DRAFT / version increments, status separate IN_PROGRESS
- vNext now: V/db/schema/projects.ts:30-39,66-76 case-insensitive global slug + DRAFT/PUBLISHED/ARCHIVED single status
- Fix: Define explicit state/status migration table; avoid silently losing workflow status.

## G2-8-017-050  [P1] GAP  facet F14  effort M
- Legacy: LFE/pages/superadmin/projects/templates/index.js:270-300 project-templates.csv exports Title/Version/Lifecycle/Summary for all filtered rows
- vNext now: VFE/admin/projects/templates/page.tsx:74-75 SuperAdminTemplatePageExport receives data.items (current server page only)
- Fix: Export ALL filtered records server-side, or explicitly label current-page export; match column order and filename.

## G2-8-017-067  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/BaseModel.java:23-26 MySQL auto-increment INT PK
- vNext now: V/db/schema/projects.ts:26-30 Postgres random UUID PK
- Fix: Provide stable ID mapping/redirect support for legacy numeric bookmarks and relationships.

## G2-8-017-071  [P1] GAP  facet F22  effort M
- Legacy: LBE/model/ProjectTemplate.java:34-35 course_label VARCHAR(160) separate column
- vNext now: V/db/schema/projects.ts:26-58; V/modules/projects/validation.ts:113 absent template column, nested overview.courseLabel
- Fix: Backfill/read courseLabel from blueprint overview; preserve editing and search semantics.

## G2-8-017-072  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/ProjectTemplate.java:37-38 status VARCHAR(40) default 'IN_PROGRESS'
- vNext now: V/db/schema/projects.ts:33-35,66-69 status VARCHAR(32) default 'DRAFT' constrained lifecycle
- Fix: Introduce separate workflowStatus if legacy status is used independently of lifecycleStatus.

## G2-8-017-074  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/ProjectTemplate.java:43-44 lifecycle_status VARCHAR(20) default 'DRAFT'
- vNext now: V/db/schema/projects.ts:33-35 single status col, restricted enum
- Fix: Preserve separate lifecycle and workflow statuses in migration.

## G2-8-017-080  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/ProjectTemplate.java:70-90 seven JSON columns overview/sprints/tasks/resources/delivery/meetings/activity
- vNext now: V/db/schema/projects.ts:81-96 single JSONB blueprint of overview/releases/sprints/tasks/resources
- Fix: Define JSON transforms including delivery, meetings, activity before data migration.

## G2-8-017-083  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/ProjectTemplateVersion.java:18-41 actionType, lifecycleStatus, changedBy, changedAt, notes, full snapshotJson
- vNext now: V/db/schema/projects.ts:81-107 version/title/summary/blueprint/changeNote/createdAt/author only
- Fix: Retain action type and whole-template snapshots for forensic rollback fidelity.

## G2-8-017-026  [P2] GAP  facet F07  effort M
- Legacy: LBE/controller/AdminProjectTemplateController.java:201-219 null payload gives “Template payload is required”; exceptions become BAD_REQUEST/FORBIDDEN/500
- vNext now: V/modules/projects/validation.ts:247-254 Zod strict create; service throws typed errors
- Fix: Map null payload and Zod field issues to exact legacy client-readable messages and HTTP statuses.

## G2-8-017-027  [P2] GAP  facet F07  effort S
- Legacy: LBE/controller/AdminProjectTemplateController.java:63-91 fetch errors use “Failed to fetch project templates” at 500
- vNext now: VFE/admin/projects/templates/page.tsx:48-54 generic “Project templates unavailable” fallback
- Fix: Preserve legacy API error reason in retriable alert while keeping new friendly title.

## G2-8-017-029  [P2] GAP  facet F07  effort S
- Legacy: LFE/pages/superadmin/projects/templates/index.js:109-111,147 load/archive fallback error strings “Failed to load project templates.” / “Failed to archive template”
- vNext now: VFE/admin/projects/templates/page.tsx:52-54 page-load error fixed description; archive error inside child
- Fix: Match error copy and surface underlying cause without leaking unsafe details.
