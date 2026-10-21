# Work packet: edit src/app/api/academics/semester-course-mappings/[mappingId]/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/semester-courses.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md

## G2-12-002-042  [P1] GAP  facet F10  effort S
- Legacy: PUT mapping `{credits,is_mandatory,course_order}` `docs/legacy-source/frontend/src/api/Services/SemesterService.js:44-45`
- vNext now: PATCH mapping `{credits,position}` `src/app/api/academics/semester-course-mappings/[mappingId]/route.ts:25-38`
- Fix: Preserve isMandatory transition or document enum type parity

## G2-17-002-047  [P1] GAP  facet F10  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:253-258 DELETE invokes docs/legacy-source/frontend/src/api/Services/SemesterService.js:31-32 by semesterId/courseId, hard delete docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:112-114.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:41-48 DELETE src/app/api/academics/semester-course-mappings/[mappingId]/route.ts:8-17 by mapping UUID with explicit confirm body and src/modules/academics/college-term-mapping-service.ts:262-272 in-use blocker.
- Fix: Explicitly describe newly blocked current-term deletions before confirm.
