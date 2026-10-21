# Work packet: edit src/app/api/projects/templates/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-template-controller.md

## G2-2-021-023  [P2] GAP  facet F07  effort M
- Legacy: AdminProjectTemplateController.java:204-206 exact Template payload is required
- vNext now: src/app/api/projects/templates/route.ts:42-53 JSON parse and apiErrorResponse
- Fix: Return field-level exact empty request feedback.

## G2-2-021-027  [P2] GAP  facet F08  effort M
- Legacy: AdminProjectTemplateController.java:212 Project template created,235 updated,258 duplicated
- vNext now: src/app/api/projects/templates/route.ts:48-50 bare result; duplicate/route.ts:37-40 bare result
- Fix: Ensure UI toasts distinguish created, updated and duplicated.
