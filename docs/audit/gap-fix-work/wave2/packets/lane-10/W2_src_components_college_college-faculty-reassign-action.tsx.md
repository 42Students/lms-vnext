# Work packet (wave 2): edit src/components/college/college-faculty-reassign-action.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-faculty-assignment.md

## G2-4-005-029  [P2] GAP  facet F09  effort M
- Legacy: Dirty edit Cancel prompts Discard assignment changes? (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:305-317`)
- vNext now: Reassign Cancel simply closes. (`src/components/college/college-faculty-reassign-action.tsx:46-53`)
- Fix: Restore exact legacy value and interaction unless explicitly approved.

## G2-4-005-047  [P2] GAP  facet F17  effort M
- Legacy: Legacy row buttons aria-label include assignment ID. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379`)
- vNext now: End/Reassign buttons repeated accessible name. (`src/components/college/college-faculty-assignment-actions.tsx:205-208;src/components/college/college-faculty-reassign-action.tsx:41-45`)
- Fix: Include row-specific faculty/class/id in accessible name.

## G2-4-005-058  [P2] GAP  facet F21  effort M
- Legacy: Legacy separate create/update/delete/deactivate controllers. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:98-190`)
- vNext now: vNext exposes bulk/reassign/end from UI. (`src/components/college/college-faculty-assignment-actions.tsx:79-82;src/components/college/college-faculty-reassign-action.tsx:28-33`)
- Fix: Map each supported mutation.
