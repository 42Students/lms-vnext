# Work packet (wave 2): edit src/modules/admin-ui/super-admin-faculty-assignments-service.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/superadmin-faculty-assignment.md, docs/audit/gap2/lane-4/superadmin-sections-faculty-assignment.md, docs/audit/gap2/lane-9/l19-u019-faculty-teaching-assignment.md

## G2-4-008-010  [P2] GAP  facet F03  effort M
- Legacy: Role rendered green PRIMARY, blue CO_TEACHER, orange TA tags; Active Yes green/No red. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:366-370`)
- vNext now: New role inside detail text and ACTIVE/ENDED StatusBadge on item article. (`src/modules/admin-ui/super-admin-faculty-assignments-service.ts:67-73;src/components/admin/admin-scoped-read-page.tsx:247-254`)
- Fix: Restore role and active chips/colors/labels in row.

## G2-4-008-014  [P2] GAP  facet F04  effort M
- Legacy: Legacy semester cell `Sem N` blue Tag and year raw `academic_year` or dash. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:366-368`)
- vNext now: New details `Semester: periodName`, `Year: periodYear.slice(0,4)`. (`src/modules/admin-ui/super-admin-faculty-assignments-service.ts:66-73`)
- Fix: Display Sem N and original YYYY-YY academicYear contract.

## G2-4-008-015  [P2] GAP  facet F04  effort M
- Legacy: Legacy missing faculty/course/class name fallback includes IDs. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:26;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:353-365`)
- vNext now: New teacher fallback `Unnamed faculty`, joined course and section names. (`src/modules/admin-ui/super-admin-faculty-assignments-service.ts:67-72`)
- Fix: Restore `Faculty/Course/Class ID N` degraded-name fallbacks without cross-tenant PII.

## G2-4-008-016  [P2] GAP  facet F04  effort M
- Legacy: Legacy `is_active` is boolean and editable, default true. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:259-284;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:369`)
- vNext now: New ACTIVE if neither teachingEnded nor deliveryEnded; archived rows ENDED. (`src/modules/admin-ui/super-admin-faculty-assignments-service.ts:51-73`)
- Fix: Define explicit reactivation behavior and prevent conflating delivery closure with teacher deactivation.

## G2-4-008-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy fetches all assignments across college then client page 10/25/50/100, localStorage persists choice. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:95-101;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:504-510;docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:47-61`)
- vNext now: New DB server page-size 10/25/50/100 with query param, no persisted page-size preference. (`src/components/admin/admin-scoped-read-page.tsx:184-199;src/modules/admin-ui/super-admin-faculty-assignments-service.ts:57-65`)
- Fix: Persist page-size preference and show AntD total range.

## G2-4-008-071  [P2] GAP  facet F22  effort M
- Legacy: Legacy stores faculty/course/class/batch/semester/year/role/isActive; updates existing row. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:206-216;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:270-284`)
- vNext now: New `courseTeachingAssignments` holds membershipId, deliveryId, role, startedAt, endedAt, updatedAt. (`src/modules/admin-ui/super-admin-faculty-assignments-service.ts:15-29;src/modules/admin-ui/super-admin-faculty-assignments-service.ts:67-73`)
- Fix: Document field-by-field mapping through offering+period, including arbitrary historical year.

## G2-4-011-012  [P2] GAP  facet F03  effort M
- Legacy: Semester blue Sem N, role green/blue/orange and active Yes/No green/red tags. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:366-369`)
- vNext now: StatusBadge ACTIVE/ENDED plus plain text detail lines. (`src/components/admin/admin-scoped-read-page.tsx:249-255`; `src/modules/admin-ui/super-admin-faculty-assignments-service.ts:70-72`)
- Fix: Use three legacy tag columns and palette.

## G2-4-011-015  [P2] GAP  facet F04  effort S
- Legacy: Faculty missing name prints Faculty name unavailable (ID N). (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:26-26`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:353-357`)
- vNext now: Fallback Unnamed faculty drops ID. (`src/modules/admin-ui/super-admin-faculty-assignments-service.ts:67-68`)
- Fix: Use legacy ID-aware faculty fallback.

## G2-4-011-016  [P2] GAP  facet F04  effort S
- Legacy: Course name fallback includes course ID. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:26-26`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:358-360`)
- vNext now: Course subtitle is name plus code, without unavailable fallback. (`src/modules/admin-ui/super-admin-faculty-assignments-service.ts:67-68`)
- Fix: Add course ID fallback.

## G2-4-011-017  [P2] GAP  facet F04  effort S
- Legacy: Class name fallback includes class ID. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:26-26`; `docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:362-364`)
- vNext now: Class text displays section name only. (`src/modules/admin-ui/super-admin-faculty-assignments-service.ts:71-72`)
- Fix: Include class ID when name unavailable.

## G2-4-011-054  [P2] GAP  facet F10  effort M
- Legacy: Five initial lookup requests, assignments lookup, semesters by program. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:103-175`)
- vNext now: Server loads course workspace, scoped classes and SQL directory. (`src/app/(authenticated)/admin/faculty-assignment/page.tsx:19-22`; `src/modules/admin-ui/super-admin-faculty-assignments-service.ts:12-29`)
- Fix: Restore equivalent scoped lookup choices and error handling.

## G2-19-019-073  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/response/FacultyTeachingAssignmentResponseDTO.java:13-27 response projects course image, class/batch and metadataIncomplete
- vNext now: src/modules/admin-ui/super-admin-faculty-assignments-service.ts:15-73 joins membership,course,section/period and no incomplete flag
- Fix: Implement compatibility projection and orphan visibility instead of silently dropping joins.
