# Work packet (wave 2): edit src/app/api/academics/semester-course-mappings/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u025-semester-controller.md

## G2-5-025-003  [P2] GAP  facet F01  effort M
- Legacy: Legacy semester-course add, bulk add, unmap, read, reorder, update via five endpoint shapes. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:334-482,553-651`
- vNext now: vNext POST single/bulk, PATCH/DELETE mapping ID; reorder as position PATCH; GET via page service. `src/app/api/academics/semester-course-mappings/route.ts:9-25`, `src/app/api/academics/semester-course-mappings/[mappingId]/route.ts:8-41`
- Fix: Document action mappings including reorder and per-semester read.

## G2-5-025-035  [P2] GAP  facet F10  effort M
- Legacy: Legacy single and bulk add and audit SEMESTER_COURSE_ADD/BULK_ADD. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:336-432`
- vNext now: vNext single/bulk add transaction logs ACADEMICS_SEMESTER_UPDATED. `src/modules/academics/college-term-mapping-service.ts:138-169,286-331`, `src/app/api/academics/semester-course-mappings/route.ts:9-25`
- Fix: Preserve action distinctions and count in audit display.
