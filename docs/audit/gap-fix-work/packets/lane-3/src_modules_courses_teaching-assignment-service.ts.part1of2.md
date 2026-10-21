# Work packet: edit src/modules/courses/teaching-assignment-service.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md, docs/audit/gap2/lane-19/faculty-teaching-assignment-entity.md, docs/audit/gap2/lane-3/faculty-course-association.md, docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md, docs/audit/gap2/lane-8/l14-u031-academic-structure-cross-cutting.md

## G2-19-019-015  [P1] GAP  facet F05  effort M
- Legacy: FacultyTeachingAssignmentRepository.java:83-119 exists variants for faculty+course+class and subsets
- vNext now: src/modules/courses/teaching-assignment-service.ts:57-137 grants by delivery and current role
- Fix: Ensure lesson/quiz/assignment guards use per-delivery authorization, not broad section or course association only

## G2-19-019-017  [P1] GAP  facet F06  effort M
- Legacy: FacultyTeachingAssignmentDTO.java:13-34 create requires facultyId/classId/courseId/semesterNumber, optional year, role, isActive/date
- vNext now: src/modules/courses/teaching-assignment-service.ts:139-176 parses deliveryId/membershipId/role and checks active faculty membership
- Fix: Provide legacy field selection mapped to delivery and period, prevent silent semester/year mismatch

## G2-19-019-020  [P1] GAP  facet F06  effort L
- Legacy: FacultyTeachingAssignmentServiceImpl.java:111-125 updates arbitrary selected faculty/course/class/batch/semester/year/role/active/dates
- vNext now: src/modules/courses/teaching-assignment-service.ts:393-497 supports role in-place only; end/recreate for transfer
- Fix: Support reassignment with explicit history and active grant, keep old start/end dates and role changes atomic

## G2-19-019-028  [P1] GAP  facet F10  effort M
- Legacy: FacultyTeachingAssignmentServiceImpl.java:53-80 one row in faculty_teaching_assignment
- vNext now: src/modules/courses/teaching-assignment-service.ts:139-275 transaction, course_teaching_assignments insert+audit
- Fix: Ensure course teacher grant creation also reflects section role only when intended; no shadow duplicate records

## G2-19-019-030  [P1] GAP  facet F10  effort M
- Legacy: FacultyTeachingAssignmentServiceImpl.java:130-140 delete physically and deactivate flag
- vNext now: src/modules/courses/teaching-assignment-service.ts:280-390 ends with endedAt, retains row/history
- Fix: Map hard-delete/admin cleanup as separate privileged action or explicitly de-scope for audit retention

## G2-19-019-055  [P1] GAP  facet F23  effort L
- Legacy: FacultyTeachingAssignmentServiceImpl.java:130-140 hard-delete/deactivate and :189-196 reversible semester activation
- vNext now: src/modules/courses/teaching-assignment-service.ts:280-390 end grant; role change and audit but no hard-delete/reactivation directly
- Fix: Document historical immutability as intentional; provide correction mechanism for mistaken end and cohort rollback

## G2-19-019-065  [P1] GAP  facet F21  effort L
- Legacy: Legacy class/lesson/quiz/attendance consumers query facultyId+courseId+classId active/undeleted predicates. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyTeachingAssignmentRepository.java:101-121` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyTeachingAssignmentRepository.java:145-152`
- vNext now: vNext scopes teaching against delivery ID, membership and endedAt. `src/modules/courses/teaching-assignment-service.ts:77-87` `src/modules/courses/teaching-assignment-service.ts:123-136`
- Fix: Verify all authorization consumers map faculty/course/class checks to persisted delivery without privilege escalation.

## G2-3-020-022  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:37-49`, `77-96`
- vNext now: `src/modules/courses/teaching-assignment-service.ts:181-275`
- Fix: Legacy create loops and saves a row for every (faculty, course) without duplicate guard; vNext per-delivery assignment enforces active unique membership/role and at-most-one PRIMARY. Map duplicate behavior and bulk atomicity, avoid silently skipping.

## G2-3-020-023  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:104-111`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseAssociationRepository.java:21-23`
- vNext now: `src/modules/courses/teaching-assignment-service.ts:280-391`
- Fix: Legacy deactivate sets active=0 on mapping ID and can leave duplicate row history; vNext sets endedAt with audit event and rejects already ended. Preserve historical association state for migration and correct reactivation policy.

## G2-3-020-027  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyCourseAssociation.java:22-23`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:42-47`
- vNext now: `src/db/schema/faculty-course-associations.ts:10-17`, `src/modules/courses/teaching-assignment-service.ts:139-177`
- Fix: Legacy new association active=1 and deactivation sets 0; vNext active is endedAt null but requires faculty active membership+role and live delivery. Convert historical statuses with proper role constraints.

## G2-3-020-040  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseAssociationRepository.java:32-32`
- vNext now: `src/db/schema/faculty-course-associations.ts:15-17`, `src/modules/courses/teaching-assignment-service.ts:238-245`
- Fix: Legacy findByFacultyIdAndCourseId assumes single row but DB has no unique constraint; can become ambiguous when reassigning. VNext partial unique active index avoids duplicates. On migration deduplicate preserving history.

## G2-14-027-008  [P1] GAP  facet F05  effort M
- Legacy: GET /fetchAllCoursesByFacultyId returns all mappings even inactive via repository `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:66-72`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseAssociationRepository.java:14-15`
- vNext now: New listCourseTeachingAssignments defaults includeEnded=false `src/modules/courses/teaching-assignment-service.ts:57-86`
- Fix: Offer includeEnded mode for legacy fetchAll vs active-only endpoint.

## G2-14-027-010  [P1] MISSING  facet F05  effort M
- Legacy: GET active faculty IDs and FacultyInfo by courseSlug or courseId `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:103-125`
- vNext now: New list keyed by deliveryId rather than course slug `src/modules/courses/teaching-assignment-service.ts:57-74`
- Fix: Implement course-wide active faculty lookup aggregated across eligible deliveries.

## G2-14-027-024  [P1] GAP  facet F10  effort M
- Legacy: POST /create loops courseIds and saves one active mapping each `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:53-64`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:38-48`
- vNext now: New createCourseTeachingAssignment requires scoped delivery + membership and permission `src/modules/courses/teaching-assignment-service.ts:139-175`
- Fix: Map old course-wide creation to exact offerings/deliveries, never cross college.

## G2-14-027-027  [P1] GAP  facet F10  effort M
- Legacy: GET courseSlug ID resolution resolves to int courseId `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:103-124`
- vNext now: New list requires courseSectionDelivery UUID and role scope `src/modules/courses/teaching-assignment-service.ts:57-74`
- Fix: Expose safe courseSlug compatibility lookup for active faculty selectors.

## G2-14-027-028  [P1] GAP  facet F11  effort M
- Legacy: Legacy mutations allow superadmin, ADMIN or admin faculty type `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:40-50`
- vNext now: New create checks courses.manage scoped college; SA requires selected college `src/modules/courses/teaching-assignment-service.ts:155-161`; `src/modules/courses/teaching-assignment-batch-service.ts:23-35`
- Fix: Map admin faculty roles to explicit permissions rather than broad global mutation.

## G2-14-027-030  [P1] GAP  facet F11  effort M
- Legacy: Legacy active course reads authorize courseSlug/courseId `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:103-124`
- vNext now: New list delivery permission courses.read `src/modules/courses/teaching-assignment-service.ts:57-75`
- Fix: Retain faculty read scope with same-course aggregated view.

## G2-14-031-052  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SemesterController.java:283-470 semester course mappings feed teaching assignments
- vNext now: src/modules/courses/delivery-service.ts:107-212 offering→section delivery and src/modules/courses/teaching-assignment-service.ts:139-278 assignments
- Fix: Maintain consistent course mapping→offering→delivery→faculty chain

## G2-19-019-021  [P2] GAP  facet F07  effort S
- Legacy: FacultyTeachingAssignmentServiceImpl.java:53-57 `Faculty ID is required`, `Semester number is required`
- vNext now: src/modules/courses/teaching-assignment-service.ts:139-176 error FACULTY_ROLE_REQUIRED/MEMBERSHIP_COLLEGE_MISMATCH
- Fix: Map validation to field-specific legacy messages and explain missing delivery/semester selection

## G2-19-019-023  [P2] GAP  facet F07  effort S
- Legacy: FacultyTeachingAssignmentServiceImpl.java:67-72 unknown enum on creation defaults PRIMARY
- vNext now: src/modules/courses/teaching-assignment-service.ts:139-146 Zod enum rejects unknown role
- Fix: Document stricter invalid-role handling and present exact user-facing supported roles
