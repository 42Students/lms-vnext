# Work packet: edit src/app/(authenticated)/admin/faculty-assignment/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/faculty-teaching-assignment-entity.md, docs/audit/gap2/lane-4/superadmin-faculty-assignment.md, docs/audit/gap2/lane-4/superadmin-sections-faculty-assignment.md

## G2-19-019-071  [P1] GAP  facet F23  effort L
- Legacy: Old page offers change faculty, course, class, batch, semester, year and active in one edit modal. `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-592`
- vNext now: vNext separates assignment creation, end, reassign, role edit and scoped delivery workflows. `src/app/(authenticated)/college/faculty-assignment/page.tsx:153-166` `src/app/(authenticated)/admin/faculty-assignment/page.tsx:33-43`
- Fix: Do not mark editing parity satisfied until every old field can be changed or a supported transition is documented.

## G2-4-008-008  [P1] GAP  facet F03  effort M
- Legacy: Row buttons Edit and danger Delete with icons, ID-specific aria labels. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379`)
- vNext now: Active row has `Manage assignment` Disclosure, nested Edit role and End; no complete Edit/Delete icon. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:33-44;src/components/admin/super-admin-faculty-assignment-create.tsx:151-170;src/components/courses/admin-course-actions.tsx:548-555`)
- Fix: Expose full Edit modal with legacy icon/action placement, clarify End vs Delete.

## G2-4-011-011  [P1] GAP  facet F03  effort M
- Legacy: Edit pencil and Delete trash danger actions exist per row. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:370-379`)
- vNext now: Manage assignment disclosure and Edit role plus other actions. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:33-43`; `src/components/admin/super-admin-faculty-assignment-create.tsx:152-171`)
- Fix: Expose full Edit and Delete per row with icons.

## G2-4-011-046  [P2] GAP  facet F08  effort S
- Legacy: Edit and Delete toasts include assignment #ID. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:279-286`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:324-328`)
- vNext now: Edit role and shared action notifications omit numeric legacy ID. (`src/components/admin/super-admin-faculty-assignment-create.tsx:136-171`; `src/app/(authenticated)/admin/faculty-assignment/page.tsx:37-43`)
- Fix: Restore ID-specific edit/delete outcome copy.
