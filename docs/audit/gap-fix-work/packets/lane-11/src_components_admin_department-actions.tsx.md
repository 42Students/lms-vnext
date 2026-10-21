# Work packet: edit src/components/admin/department-actions.tsx

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-departments.md, docs/audit/gap2/lane-9/college-admin-departments.md

## G2-9-024-034  [P1] GAP  facet F08  effort M
- Legacy: Department deleted successfully! `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:173-175`
- vNext now: Department archived; NAME is no longer active. `src/components/admin/department-actions.tsx:136-146`
- Fix: Communicate deliberate archive rather than hard-delete and owner-approved copy

## G2-9-024-041  [P1] GAP  facet F10  effort L
- Legacy: DELETE /api/v1/department/delete/{id}, hard delete after dependency guards `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:167-185` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/DepartmentController.java:176-225`
- vNext now: DELETE /api/college/departments/{id}, confirm:true, archive `src/components/admin/department-actions.tsx:85-149`
- Fix: Document archive migration and resurrect/reuse semantics

## G2-9-006-025  [P2] GAP  facet F07  effort M
- Legacy: Update errors field-mapped, shown inline and toast (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:140-164`)
- vNext now: Generic toast title Department was not updated, name-conflict detail (`src/components/admin/department-actions.tsx:63-77`)
- Fix: Map all field validation errors to edit form and closeable alert.

## G2-9-006-029  [P2] GAP  facet F08  effort M
- Legacy: Department deleted successfully! (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:188-191`)
- vNext now: Department archived: <name> no longer active (`src/components/admin/department-actions.tsx:123-137`)
- Fix: Explain soft archival and consider legacy toast title only if product semantics align.

## G2-9-006-030  [P2] GAP  facet F08  effort M
- Legacy: Delete failure alert Department was not deleted with Retry delete (`docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:190-200`)
- vNext now: Archive blocked toast and separate warning in dialog (`src/components/admin/department-actions.tsx:115-131,225-244`)
- Fix: Keep legacy inline error/retry affordance visible after dialog closes.

## G2-9-024-030  [P2] GAP  facet F07  effort S
- Legacy: Edit server failure Department was not updated with closable alert and toast `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:155-164`
- vNext now: Toast title Department was not updated, optional conflict description `src/components/admin/department-actions.tsx:54-82`
- Fix: Show in-modal persistent closable error

## G2-9-024-031  [P2] GAP  facet F07  effort S
- Legacy: Delete failure Department was not deleted + Retry delete `docs/legacy-source/frontend/src/pages/superadmin/sections/Departments.js:395-403`
- vNext now: Archive blocked toast and modal alert; Retry delete inside archive dialog `src/components/admin/department-actions.tsx:115-135,225-245`
- Fix: Match retry copy/placement and archive terminology
