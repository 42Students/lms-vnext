# Work packet: edit src/components/projects/project-template-controls.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u033-superadmin-template-colleges.md, docs/audit/gap2/lane-7/u035-superadmin-template-overview.md, docs/audit/gap2/lane-5/u029-superadmin-project-template-create.md

## G2-7-033-035  [P1] GAP  facet F10  effort L
- Legacy: AdminService.js:template assignment endpoints assign/unassign and bulkSet uses numeric templateId
- vNext now: project-template-controls.tsx:458-460 POST/DELETE /api/projects/templates/{UUID}/assignments
- Fix: Map numeric IDs/endpoint shape; preserve reassignment semantics and scope checks

## G2-7-035-013  [P1] GAP  facet F03  effort M
- Legacy: overview.js:451-456 disabled Publish with tooltip links to missing Deliverables/Sprints
- vNext now: project-template-controls.tsx:294-477 Publish action relies on server error; no tab-targeted blocker tooltip
- Fix: Show publish prerequisite tooltip and navigation links before disabled button

## G2-7-035-030  [P1] GAP  facet F07  effort L
- Legacy: overview.js:315-327 Save your overview changes before publishing
- vNext now: project-template-controls.tsx:294-476 Publish outside metadata editor, dirty flags not shared
- Fix: Block publish while unsaved Overview editor changes

## G2-7-035-071  [P1] GAP  facet F20  effort M
- Legacy: overview.js:316-319 dirty form blocks publish
- vNext now: project-template-controls.tsx:294-477 publish action separate from metadata modal
- Fix: Prevent status changes while unsaved field edits pending

## G2-5-029-032  [P2] GAP  facet F08  effort M
- Legacy: Legacy create settles into first template section; no secondary action needed. `docs/legacy-source/frontend/src/pages/superadmin/projects/templates/new.js:135-140`
- vNext now: vNext quick-create control does toast with `Draft version 1 is ready...`, then detail. `src/components/projects/project-template-controls.tsx:101-113`
- Fix: Unify two create entrances' toast/navigation semantics.

## G2-7-033-027  [P2] GAP  facet F07  effort S
- Legacy: colleges.js:134-136 Failed to update this college's template assignment fallback
- vNext now: project-template-controls.tsx:340-348 generic failed mutation toast
- Fix: Match safe error cause and exact fallback

## G2-7-033-030  [P2] GAP  facet F08  effort S
- Legacy: colleges.js:128 Assigned to {college}; :132 Removed from {college}
- vNext now: project-template-controls.tsx:333-339 generic success toast
- Fix: Show college name in per-row success toast
