# Work packet (wave 2): edit src/app/api/projects/templates/[templateId]/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l12-u029-superadmin-project-template-resources.md, docs/audit/gap2/lane-2/admin-project-template-controller.md

## G2-12-029-031  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/api/Services/AdminService.js:399-400,421-422 and docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:69-80 — GET then PUT template with scalars/resources only.
- vNext now: src/app/api/projects/templates/[templateId]/route.ts:16-41 and src/components/projects/super-admin-template-resource-editor.tsx:29-42 — PATCH whole blueprint with expectedVersion and changeNote.
- Fix: Preserve resource-only update semantics and CAS version tracking.

## G2-12-029-051  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/templates/[templateId]/resources.js:73-77 — resource-only upsert and scalar template fields.
- vNext now: src/app/api/projects/templates/[templateId]/route.ts:16-41 — immutable version JSONB full blueprint; no resource-only patch.
- Fix: Implement migration mapping preserving all other sections.

## G2-2-021-002  [P2] GAP  facet F01  effort M
- Legacy: AdminProjectTemplateController.java:95-130 GET /{id} and alias /{id}/preview
- vNext now: src/app/api/projects/templates/[templateId]/route.ts:16-67 PATCH and DELETE only; detail served through service/subviews
- Fix: Expose read/preview equivalence and alias if required by links.
