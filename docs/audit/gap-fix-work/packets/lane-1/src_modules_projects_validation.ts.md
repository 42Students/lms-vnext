# Work packet: edit src/modules/projects/validation.ts

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l12-u029-superadmin-project-template-resources.md, docs/audit/gap2/lane-10/superadmin-projects-template-tasks.md, docs/audit/gap2/lane-13/project-task.md, docs/audit/gap2/lane-5/u029-superadmin-project-template-create.md, docs/audit/gap2/lane-2/admin-project-controller.md

## G2-12-029-050  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:144-166 — legacy type names Link/DOC/PPT/Video and isPinned/isRequired, optional key.
- vNext now: src/modules/projects/validation.ts:69-96 — enum LINK/PDF/DOCUMENT/SLIDES/VIDEO/FILE with pinned/required boolean; strict schema.
- Fix: Normalize persisted legacy names/flags to vNext blueprint.

## G2-10-029-014  [P1] GAP  facet F04  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:97-104 — sprint may be empty (backlog) with saved-sprint options.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:225-230 and src/modules/projects/validation.ts:49-67 — sprintKey required.
- Fix: Support null/omitted sprint in schema and UI to restore backlog.

## G2-10-029-024  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:117-125 — Type STORY/BUG/CHORE/SPIKE.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:251-260 — no Type editor; strict schema src/modules/projects/validation.ts:49-67 excludes taskType.
- Fix: Add persisted type field and select.

## G2-10-029-053  [P1] GAP  facet F20  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:323-345 — dangling sprint links become null in backlog when save.
- vNext now: src/modules/projects/validation.ts:49-67,167-185 — sprintKey required and reference checked.
- Fix: Provide explicit backlog recovery for deleted sprints.

## G2-10-029-056  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:90-142 — legacy taskType,dueLabel,approach and optional sprint/key.
- vNext now: src/modules/projects/validation.ts:49-67 — strict task excludes extras, sprint/key mandatory.
- Fix: Extend validation, DB JSONB version parser and migration to preserve data.

## G2-13-017-052  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:26` taskKey varchar120, template key may be user-defined
- vNext now: `src/modules/projects/validation.ts:12-17` key 64 lower-kebab, `src/db/schema/projects.ts:415-417` varchar64
- Fix: Safely re-key invalid keys and preserve original as migration metadata/reference for copied tasks

## G2-5-029-028  [P1] GAP  facet F07  effort M
- Legacy: Legacy validateRepeatingItems applies per-field/row required checks. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:285-306`
- vNext now: vNext blueprint parser validates seeded plan, but no multi-row UI. `src/modules/projects/validation.ts:98-132`
- Fix: Show per-row errors for each sprint/task/resource.

## G2-12-029-024  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:259-275 — max500 and Item N: Title required.
- vNext now: src/modules/projects/validation.ts:126-129 and src/components/projects/super-admin-template-resource-editor.tsx:31-32 — max200 and first Zod issue only.
- Fix: Match cap/row-specific error or clarify intentional smaller cap.

## G2-10-029-027  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:229-237,262-275 — inline '<label> is required' and Item N: Title required validation.
- vNext now: src/components/projects/super-admin-template-plan-editor.tsx:93-98 and src/modules/projects/validation.ts:12-67 — Zod first issue only in generic Banner.
- Fix: Show per-row exact field validation and original error copy.

## G2-10-029-028  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/RepeatingItemEditor.jsx:259-268 — max 500 rows with precise Remove N before saving error.
- vNext now: src/modules/projects/validation.ts:123-126 and src/components/projects/super-admin-template-plan-editor.tsx:272-275 — schema max2000; Add disabled at 2000.
- Fix: Confirm desired cap and show equivalent error guidance.

## G2-2-020-024  [P2] GAP  facet F07  effort M
- Legacy: AdminProjectController.java:180-183 exact collegeId must be a positive integer
- vNext now: src/modules/projects/validation.ts:330 college UUID Zod
- Fix: Return selected college validation with user-facing context.

## G2-2-020-025  [P2] GAP  facet F07  effort M
- Legacy: AdminProjectCreateDTO.java:13-16 exact title required and max160 messages
- vNext now: src/modules/projects/validation.ts:19 title max200
- Fix: Match title error wording and max length.

## G2-5-029-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy exact `Title is required`,`Title must be 200 characters or fewer`,`Template slug is required`,`Slug must be 80...`. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:175-196`
- vNext now: vNext native required and maxLength64 without legacy messages. `src/components/projects/super-admin-template-create-form.tsx:41-45`, `src/modules/projects/validation.ts:12-19`
- Fix: Match field-level exact error copy.
