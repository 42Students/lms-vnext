# Work packet (wave 3): edit src/components/courses/super-admin-content-actions.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-admin-resources.md

## G2-9-025-026  [P1] MISSING  facet F06  effort L
- Legacy: Editor loads saved resource materials, notes and html `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:179-208`
- vNext now: Edit explicitly does not expose private files; metadata/link/notes only `src/components/courses/super-admin-content-actions.tsx:119-145`
- Fix: Permit authorized editing of existing file/link materials without losing saved files.

## G2-9-025-072  [P1] MISSING  facet F23  effort L
- Legacy: Old composer supports multiple files/links with notes in one resource `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:324-416`
- vNext now: New authoring supports a single URL + notes and metadata-only edit `src/components/courses/faculty-lesson-authoring.tsx:274-299` `src/components/courses/super-admin-content-actions.tsx:129-145`
- Fix: Restore multi-material authoring and editing as high priority parity prerequisite.
