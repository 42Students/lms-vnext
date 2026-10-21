# Work packet: edit src/modules/people/faculty-bulk-import-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/college-admin-teachers.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md

## G2-6-001-047  [P1] GAP  facet F12  effort M
- Legacy: Old bulk faculty type permits only `LECTURER` or `MENTOR` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:659-668` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyServiceImpl.java:264-277`
- vNext now: New parser omits faculty-type column and imports FACULTY role `src/modules/people/faculty-bulk-import-model.ts:8-36` `src/modules/people/faculty-bulk-import-service.ts:34-39`
- Fix: Preserve faculty type CSV column and restricted permissible values

## G2-15-027-027  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyServiceImpl.java:191-222 separate duplicate email/mobile and role/department messages per row
- vNext now: src/modules/people/faculty-bulk-import-service.ts:27-46 broad collision and failure copy
- Fix: Return row-level duplicate reason accurately without exposing cross-tenant identities.

## G2-15-027-030  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:387-415 Faculty registered successfully! They can now login with their mobile number.
- vNext now: src/modules/people/faculty-bulk-import-service.ts:39-44 Faculty membership onboarded on import
- Fix: Show legacy exact registration toast only after confirmed person creation.
