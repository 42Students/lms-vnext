# Work packet: edit src/components/college/college-faculty-reassign-action.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-faculty-assignment.md

## G2-4-005-028  [P1] GAP  facet F09  effort M
- Legacy: Edit modal width500, Save Changes, faculty/course title and all fields editable. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-598`)
- vNext now: Only Reassign Dialog selecting replacement member. (`src/components/college/college-faculty-reassign-action.tsx:41-64`)
- Fix: Build full edit modal for course/class/semester/year/role/isActive.

## G2-4-005-032  [P1] GAP  facet F10  effort M
- Legacy: Edit PUT update/id accepts complete assignment fields. (`docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:11-12;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:270-284`)
- vNext now: Only PATCH Reassign, DELETE End. (`src/components/college/college-faculty-reassign-action.tsx:28-33;src/components/college/college-faculty-assignment-actions.tsx:193-196`)
- Fix: Restore complete edit mutation.

## G2-4-005-055  [P1] GAP  facet F20  effort M
- Legacy: Legacy can simultaneously change faculty/course/class/semester/role. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:259-284`)
- vNext now: Only replace faculty in Reassign. (`src/components/college/college-faculty-reassign-action.tsx:22-39`)
- Fix: Restore full edit fields.
