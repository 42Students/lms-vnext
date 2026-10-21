# Work packet (wave 2): edit src/app/api/academics/semester-course-mappings/[mappingId]/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/semester-courses.md, docs/audit/gap2/lane-17/superadmin-semester-course-mapping.md, docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-12-002-044  [P2] GAP  facet F10  effort S
- Legacy: DELETE by semesterId/courseId `docs/legacy-source/frontend/src/api/Services/SemesterService.js:31-32`
- vNext now: DELETE by mapping UUID with `{confirm:true}` `src/app/api/academics/semester-course-mappings/[mappingId]/route.ts:8-21`
- Fix: Document API identifier/contract difference

## G2-17-002-048  [P2] GAP  facet F10  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:221-231 edit PUT mapping ID {credits,is_mandatory,course_order}.
- vNext now: src/components/academics/college-term-mapping-manager.tsx:90-112 PATCH src/app/api/academics/semester-course-mappings/[mappingId]/route.ts:25-34 credits,position and src/modules/academics/college-term-mapping-service.ts:176-235 atomically resequences peers.
- Fix: Document removed mandatory field and changed global ordering side effects.

## G2-5-025-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy semester-course add, bulk add, unmap, read, reorder, update via five endpoint shapes. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:334-482,553-651`
- vNext now: vNext POST single/bulk, PATCH/DELETE mapping ID; reorder as position PATCH; GET via page service. `src/app/api/academics/semester-course-mappings/route.ts:9-25`, `src/app/api/academics/semester-course-mappings/[mappingId]/route.ts:8-41`
- Fix: Document action mappings including reorder and per-semester read.
