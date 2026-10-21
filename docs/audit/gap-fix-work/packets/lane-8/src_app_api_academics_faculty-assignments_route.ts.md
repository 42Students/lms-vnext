# Work packet: edit src/app/api/academics/faculty-assignments/route.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-course-association.md, docs/audit/gap2/lane-9/l15-u027-faculty-controller.md, docs/audit/gap2/lane-20/faculty-course-mapping.md

## G2-3-020-024  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:53-99`
- vNext now: `src/app/api/academics/faculty-assignments/route.ts:12-54`
- Fix: Legacy createBulk, deactivate and read-active-by-course routes all present under one controller; new section assignment route GET/POST only while teaching assignment routes separate. Ensure every legacy workflow has an accessible API path.

## G2-15-027-003  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:480-493 getFacultyCourseMapping route accepts courseSlug or ID
- vNext now: src/app/api/academics/faculty-assignments/route.ts:12-24 assignment API based on sectionId
- Fix: Expose course-to-teacher listing/compat view with slug precedence and scoped course resolution.

## G2-15-027-023  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:233-244 create mapping requires facultyId/courseId/classId
- vNext now: src/app/api/academics/faculty-assignments/route.ts:30-49 uses sectionFacultyAssignmentInput with membership/section scope
- Fix: Translate legacy class/course pair to validated section delivery and membership IDs.

## G2-15-027-032  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyController.java:242-243,514-515,535-537 mapping create Success, deactivate Mapping deactivated
- vNext now: src/app/api/academics/faculty-assignments/route.ts:47-49 {assignment} 201 for create
- Fix: Map operation success copy to legacy toasts while retaining vNext API status codes.

## G2-20-019-015  [P3] GAP  facet F08  effort S
- Legacy: JPA create no toast in entity `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseMapping.java:9-24`
- vNext now: POST returns 201 assignment not success message `src/app/api/academics/faculty-assignments/route.ts:38-49`
- Fix: Map success toast in client
