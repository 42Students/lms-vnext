# Work packet (wave 2): edit src/components/academics/college-semester-management.tsx (part 2 of 2)

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-semesters.md

## G2-9-019-045  [P3] GAP  facet F10  effort S
- Legacy: Legacy DELETE /api/v1/semester/delete/{id} `docs/legacy-source/frontend/src/api/Services/SemesterService.js:11-12`
- vNext now: DELETE /api/academics/semesters/{id} with confirm:true `src/components/academics/college-semester-management.tsx:165-175` `src/app/api/academics/semesters/[semesterId]/route.ts:35-48`
- Fix: Document new confirmation payload; keep deletion protection.

## G2-9-019-060  [P3] GAP  facet F17  effort M
- Legacy: Icon buttons title Edit/Delete, controlled modal keyboard flag `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterManagement.js:371-389,551-560`
- vNext now: Action buttons labelled Edit/More, dialog focus semantics `src/components/academics/college-semester-management.tsx:175-231`
- Fix: Verify icon accessible name, focus restore, disabled pending.
