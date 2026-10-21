# Work packet: edit src/modules/projects/template-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u029-superadmin-project-template-create.md, docs/audit/gap2/lane-7/u034-superadmin-template-index.md, docs/audit/gap2/lane-7/u035-superadmin-template-overview.md

## G2-5-029-040  [P1] GAP  facet F11  effort M
- Legacy: Legacy create requires Super Admin; no college scoped restriction explicit in create handler beyond principal. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:201-212`
- vNext now: vNext `project-template.manage` denies while scoped to org/college. `src/app/(authenticated)/admin/projects/templates/new/page.tsx:8-17`, `src/modules/projects/template-service.ts:245-257`
- Fix: Confirm policy difference and surface scope-switch action.

## G2-5-029-041  [P1] GAP  facet F11  effort M
- Legacy: Legacy module.projects.enabled check via @ModelAttribute feature guard. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:56-60`
- vNext now: vNext permission project-template.manage, no same feature gate at mapped create route. `src/app/(authenticated)/admin/projects/templates/new/page.tsx:8-17`, `src/modules/projects/template-service.ts:245-257`
- Fix: Check effective module access gate before showing create.

## G2-5-029-042  [P1] GAP  facet F12  effort M
- Legacy: Legacy lifecycle draft/published selectable immediately; archived disabled to prevent hidden template. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:75-85,209-237`
- vNext now: vNext always DRAFT on insert; publishing separate state transition. `src/db/schema/projects.ts:33-69`, `src/modules/projects/template-service.ts:259-293`
- Fix: Make create+publish path where authorized or document staged publication deviation.

## G2-5-029-066  [P1] GAP  facet F21  effort M
- Legacy: Legacy feature flag service guards projects module. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminProjectTemplateController.java:56-60,201-220`
- vNext now: vNext role permission service guards template management. `src/modules/projects/template-service.ts:245-257`
- Fix: Ensure tenant module disable blocks global template create if intended.

## G2-7-034-038  [P1] GAP  facet F22  effort L
- Legacy: templates/[templateId]/index.js:12-19 templateId dynamic numeric/slug string
- vNext now: template-service.ts:111-121 enforces UUID id and SQL records; legacy numeric ID shape
- Fix: Write historical ID/slug crosswalk and stable redirects

## G2-7-035-015  [P1] GAP  facet F04  effort M
- Legacy: overview.js:72-109 status normalization preserves unrecognized stored enums
- vNext now: template-service.ts:111-155 enum status and version, template detail schema strict
- Fix: Surface legacy unsupported statuses rather than silently choosing Draft

## G2-7-035-049  [P1] GAP  facet F12  effort M
- Legacy: overview.js:447-456 Publish requires deliverable plus sprint/task, otherwise disabled tooltip
- vNext now: template-service.ts:263-265 publishable blueprint schema required but UI no blocker navigation
- Fix: Surface publish eligibility as live disabled control with fix links

## G2-7-035-075  [P1] GAP  facet F22  effort L
- Legacy: overview.js:193-215 legacy template stores scalar courseLabel/phase/status/lifecycleStatus, overview JSON and delivery JSON
- vNext now: template-service.ts:111-155 versioned blueprint, project-template-view.tsx:3-34 only overview/release/task/resource
- Fix: Define field-to-blueprint migration including submission settings and raw enum preservation
