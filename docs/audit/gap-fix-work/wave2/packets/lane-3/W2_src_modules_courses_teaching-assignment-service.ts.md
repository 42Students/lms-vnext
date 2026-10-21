# Work packet (wave 2): edit src/modules/courses/teaching-assignment-service.ts

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md, docs/audit/gap2/lane-19/faculty-teaching-assignment-entity.md, docs/audit/gap2/lane-3/faculty-course-association.md, docs/audit/gap2/lane-4/l14-u027-faculty-course-association-controller.md

## G2-19-019-001  [P2] GAP  facet F01  effort M
- Legacy: FacultyTeachingAssignmentController.java:73-308 /api/v1/teaching-assignment/get/create/createBulk/update/delete/deactivate/byFaculty/byClass/byBatch/page
- vNext now: src/app/(authenticated)/college/faculty-assignment/page.tsx:30-189 College Faculty Assignment list, src/modules/courses/teaching-assignment-service.ts:57-498 CRUD by delivery
- Fix: Reconcile old direct URL/API integration and grouped tabs; provide alias/deprecation mapping for faculty/class/batch filter entry points

## G2-19-019-016  [P2] GAP  facet F05  effort M
- Legacy: FacultyTeachingAssignmentRepository.java:141-153 findByIsActive active and exists by term
- vNext now: src/modules/courses/teaching-assignment-service.ts:57-137 includeEnded flag; endedAt NULL active
- Fix: Add current-term filter and deterministic assignment history view; avoid past-term grants counted as active

## G2-19-019-018  [P2] GAP  facet F06  effort M
- Legacy: FacultyTeachingAssignmentServiceImpl.java:53-79 defaults active true and role PRIMARY, derives batchId from class
- vNext now: src/modules/courses/teaching-assignment-service.ts:139-275 grant inserted via delivery+membership with exact role
- Fix: Initialize sensible PRIMARY, active and cohort context from selected delivery; display preview before save

## G2-19-019-029  [P2] GAP  facet F10  effort M
- Legacy: FacultyTeachingAssignmentServiceImpl.java:111-125 updates row in place, preserving numeric ID
- vNext now: src/modules/courses/teaching-assignment-service.ts:393-497 role changes in place, end/reassign separately
- Fix: Document identity continuity for edits, reassignments and historical activity on old grant

## G2-19-019-063  [P2] GAP  facet F20  effort M
- Legacy: Old repository first eligible course/class sorts lowest ID then page limit1 to avoid multiple co-teacher query failure. `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyTeachingAssignmentRepository.java:86-100`
- vNext now: vNext sort role/displayName and restrict single active primary per delivery. `src/modules/courses/teaching-assignment-service.ts:133-136` `src/db/schema/courses.ts:270-276`
- Fix: Document first-teacher resolution for legacy class/course-only consumers.

## G2-19-019-066  [P2] GAP  facet F21  effort M
- Legacy: Old teaching assignment schedule display used course image/slug and names enriched from related entities. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyTeachingAssignmentServiceImpl.java:199-235`
- vNext now: vNext teaching list joins display name and delivery/course parents, with no image URL in returned DTO. `src/modules/courses/teaching-assignment-service.ts:90-136`
- Fix: Restore enriched metadata for faculty dashboard and deep links.

## G2-3-020-002  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:51-70`, `147-171`
- vNext now: `src/modules/courses/faculty-course-list-service.ts:7-22`, `src/modules/courses/teaching-assignment-service.ts:57-137`
- Fix: Legacy generic faculty-to-course association controls course access by course ID, vNext faculty course page uses specific section deliveries and teaching roles. Ensure legacy assigned course appears for correct sections.

## G2-3-020-008  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseAssociationRepository.java:14-32`
- vNext now: `src/modules/courses/teaching-assignment-service.ts:57-101`
- Fix: Legacy association has no role, section or offering; vNext teaching assignment requires deliveryId and one role PRIMARY/CO_TEACHER/TA. Define default and one-to-many fanout across active deliveries.

## G2-3-020-009  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseAssociationRepository.java:14-19`, `25-29`
- vNext now: `src/modules/courses/teaching-assignment-service.ts:57-137`, `src/modules/courses/faculty-course-list-service.ts:7-22`
- Fix: Legacy queries facultyId→all courses and courseId→all faculty plus active-only forms; vNext listTeachingAssignments keyed one delivery. Add course-aggregate and faculty-aggregate projections.

## G2-3-020-013  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/BulkFacultyCourseAssociationCreateRequestDTO.java:6-8`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:77-95`
- vNext now: `src/components/college/college-faculty-assignment-actions.tsx:151-168`, `src/modules/courses/teaching-assignment-service.ts:139-277`
- Fix: Legacy createBulk allows many faculty each with list courseIds in one bulk request; vNext UI assign-many courses to one faculty and service creates individual delivery assignment. Add multiple-faculty batch import with partial diagnostics.

## G2-3-020-014  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:103-124`
- vNext now: `src/modules/courses/teaching-assignment-service.ts:57-101`
- Fix: Legacy accepts either courseSlug or numeric courseId via resolver for fetchActiveFaculty and info; vNext UUID deliveryId route. Add slug/ID mapping at read boundary.

## G2-3-020-026  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:66-71`, `103-132`
- vNext now: `src/modules/courses/teaching-assignment-service.ts:72-137`
- Fix: Legacy caller with faculty-schedule or course access can read mapped course/faculty lists, vNext listTeachingAssignments requires courses.read on delivery; no direct courseId API. Provide authorized equivalent.

## G2-3-020-028  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseAssociationRepository.java:14-19`
- vNext now: `src/modules/courses/teaching-assignment-service.ts:57-137`
- Fix: Legacy non-active associations remain in unfiltered `fetchCoursesByFaculty`, vNext excludes ended teaching assignments by default. Surface historical mapping when requested without granting access.

## G2-3-020-029  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:115-143`
- vNext now: `src/modules/courses/teaching-assignment-service.ts:91-137`
- Fix: Legacy active faculty info DTO uses firstName only plus deptId and mappingId; vNext teaching roster uses full displayName and role. Add correct fields and exact old labels where required.

## G2-3-020-038  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:51-70`, `122-143`, `147-170`
- vNext now: `src/modules/courses/teaching-assignment-service.ts:57-137`
- Fix: Legacy faculty/course N+1 fetches course/faculty detail for every association, vNext joined teaching roster query. Keep performance improvement while matching result order and missing course handling.

## G2-14-027-007  [P2] GAP  facet F04  effort M
- Legacy: findCoursesByFaculty uses slug/courseName/deptId + mapping ID `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/FacultyCourseAssociationServiceImpl.java:52-69`
- vNext now: New list assignments returns delivery/member/role and course identities `src/modules/courses/teaching-assignment-service.ts:57-103`
- Fix: Return legacy shape for page consuming active course selector where needed.

## G2-14-027-011  [P2] GAP  facet F05  effort M
- Legacy: Legacy repository has no sort/order, returns provider row order `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/FacultyCourseAssociationRepository.java:14-32`
- vNext now: New orderBy assignment role `src/modules/courses/teaching-assignment-service.ts:123-134`
- Fix: Define legacy ordering for callers and preserve deterministic vNext ordering for new views.

## G2-14-027-046  [P2] GAP  facet F21  effort M
- Legacy: Legacy has CourseSlugResolver for either courseSlug or ID `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:24-25`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyCourseAssociationController.java:103-110`
- vNext now: New service uses scoped delivery UUID only `src/modules/courses/teaching-assignment-service.ts:57-74`
- Fix: Provide safe resolver for old links without introducing external third parties.
