# Work packet: edit src/modules/projects/super-admin-template-create-model.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u029-superadmin-project-template-create.md

## G2-5-029-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy summary derived from first line of goal or title and truncated to 160. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:37-44,118-128`
- vNext now: vNext Summary is separately typed optional max2000; not auto-derived. `src/modules/projects/super-admin-template-create-model.ts:9-15`, `src/components/projects/super-admin-template-create-form.tsx:48-54`
- Fix: Derive initial summary exactly or migrate existing summary precedence.

## G2-5-029-013  [P1] GAP  facet F04  effort M
- Legacy: Legacy repeating sprints/tasks/resources arrays preserve multiple entries and relationship IDs. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:96-128`
- vNext now: vNext initializes exactly one release, one sprint, one task, at most one URL resource. `src/modules/projects/super-admin-template-create-model.ts:18-22`
- Fix: Preserve arbitrary repeated arrays and task-to-sprint link semantics.

## G2-5-029-016  [P1] GAP  facet F05  effort M
- Legacy: Legacy tasks depend on sprint options, dynamic lookup from all sprints. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:51-53,285-303`
- vNext now: vNext only one hardcoded sprint key; task always in sprint-1. `src/modules/projects/super-admin-template-create-model.ts:18-20`
- Fix: Render sprint selector per task and validate references as rows change.

## G2-5-029-023  [P1] GAP  facet F06  effort M
- Legacy: Legacy arrays can have zero sprints, tasks or resources at creation. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:285-306`
- vNext now: vNext demands at least first release/sprint/task with required titles. `src/modules/projects/super-admin-template-create-model.ts:18-22`
- Fix: Separate draft create from publish readiness, permit zero work items.

## G2-5-029-027  [P1] GAP  facet F07  effort M
- Legacy: Legacy deliverables must have at least one nonblank line `Add at least one deliverable.` `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:253-265`
- vNext now: vNext deliverables optional; empty array passes draft parser. `src/modules/projects/super-admin-template-create-model.ts:12-15`, `src/components/projects/super-admin-template-create-form.tsx:65-74`
- Fix: Enforce one deliverable on equivalent create or identify intentional relaxed requirement.

## G2-5-029-037  [P1] GAP  facet F10  effort M
- Legacy: Legacy client makes arrays for sprints/tasks/resources and derives summary. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:96-128`
- vNext now: vNext normalizes to strict blueprint with release->sprint->task, singleton arrays. `src/modules/projects/super-admin-template-create-model.ts:9-23`
- Fix: Convert legacy linked sprint/task keys without dropping multiples.

## G2-5-029-045  [P1] GAP  facet F12  effort M
- Legacy: Legacy stamps persistent client IDs on sprint rows before task linkage. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:55-60`
- vNext now: vNext fixed keys release-1/sprint-1/task-1; no dynamic IDs. `src/modules/projects/super-admin-template-create-model.ts:18-20`
- Fix: Stable client keys across reorder and dependent task selection.

## G2-5-029-060  [P1] GAP  facet F19  effort M
- Legacy: Legacy renders dynamic unbounded (frontend) list of sprints/tasks/resources, validated on submit. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:51-60,285-306`
- vNext now: vNext fixed one of each, reducing serialized payload. `src/modules/projects/super-admin-template-create-model.ts:18-22`
- Fix: Support bounded multiple records with lazy repeating inputs.

## G2-5-029-064  [P1] GAP  facet F20  effort M
- Legacy: Legacy stable sprint client IDs prevent task link break when reordering. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:55-60`
- vNext now: vNext fixed sprint key can't link dynamic tasks. `src/modules/projects/super-admin-template-create-model.ts:18-20`
- Fix: Add temp IDs/keys and reference validation before POST.

## G2-5-029-067  [P1] GAP  facet F22  effort M
- Legacy: Legacy DTO fields slug,title,summary,courseLabel,status,lifecycleStatus,phase,overview,sprints,tasks,resources, etc. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/AdminProjectTemplateUpsertDTO.java:6-29`
- vNext now: vNext projectTemplates + version JSON blueprint fields; no template initial status/phase standalone. `src/db/schema/projects.ts:26-120`, `src/modules/projects/super-admin-template-create-model.ts:9-23`
- Fix: Map all legacy fields to blueprint and version rows, avoid dropped status.
