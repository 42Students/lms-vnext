# Work packet: edit src/components/projects/project-resource-controls.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u028-superadmin-workspace-resources.md

## G2-16-028-015  [P1] GAP  facet F06  effort M
- Legacy: projectSectionFieldConfigs.js:144-165 Type picker values Link, PDF, DOC, PPT, Video, File.
- vNext now: project-resource-controls.tsx:18-25,114-121 choices FILE, LINK, DOCUMENT, CODE, NOTE, ENVIRONMENT.
- Fix: Map legacy PDF/DOC/PPT/Video values to explicit supported types and preserve value during edits.

## G2-16-028-046  [P1] GAP  facet F20  effort M
- Legacy: resources.js:40-58 guards untouched saves, echoes resourcesToken and reseeds after reload, preventing blind array clobber.
- vNext now: project-resource-controls.tsx:200-253 guards dirty modal; resource-service.ts:149-169 inserts sequential next sequence.
- Fix: Use optimistic section version and idempotent Save for multi-tab replay.

## G2-16-028-022  [P2] GAP  facet F07  effort M
- Legacy: resources.js:60-64 `Failed to update resources` fallback through showProjectError.
- vNext now: project-resource-controls.tsx:202-280 tracks modal error with per-item form; no section-level failure.
- Fix: Map stale conflicts and API errors to same page-level resource error message/modal.

## G2-16-028-023  [P2] MISSING  facet F08  effort S
- Legacy: resources.js:42-46 untouched form yields exact info toast `No changes to save`.
- vNext now: project-resource-controls.tsx:201-284 create-only dirty guard; no full-section untouched-save toast.
- Fix: On section Save with no dirty resources, display `No changes to save` and avoid API call.

## G2-16-028-024  [P3] GAP  facet F08  effort S
- Legacy: resources.js:48-56 success toast `Resources updated` then reload, editor remains seeded.
- vNext now: project-resource-controls.tsx:228-253 creates one item and shows a different toast.
- Fix: Reproduce old toast copy, refresh state without blank flicker and reset dirty state.
