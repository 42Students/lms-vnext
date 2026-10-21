# Work packet (wave 3): edit src/components/admin/super-admin-faculty-assignment-create.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-sections-faculty-assignment.md

## G2-4-011-036  [P1] MISSING  facet F06  effort L
- Legacy: Edit modal contains faculty, course, program, batch, semester, class, academic year, role and Active Switch. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-593`)
- vNext now: Edit role only, inline with no other mutable fields. (`src/components/admin/super-admin-faculty-assignment-create.tsx:123-171`)
- Fix: Implement full edit modal and payload.
