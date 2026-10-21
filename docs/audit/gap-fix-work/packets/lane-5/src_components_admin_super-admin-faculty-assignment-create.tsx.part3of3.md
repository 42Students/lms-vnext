# Work packet: edit src/components/admin/super-admin-faculty-assignment-create.tsx (part 3 of 3)

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-sections-faculty-assignment.md

## G2-4-011-046  [P2] GAP  facet F08  effort S
- Legacy: Edit and Delete toasts include assignment #ID. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:279-286`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:324-328`)
- vNext now: Edit role and shared action notifications omit numeric legacy ID. (`src/components/admin/super-admin-faculty-assignment-create.tsx:136-171`; `src/app/(authenticated)/admin/faculty-assignment/page.tsx:37-43`)
- Fix: Restore ID-specific edit/delete outcome copy.
