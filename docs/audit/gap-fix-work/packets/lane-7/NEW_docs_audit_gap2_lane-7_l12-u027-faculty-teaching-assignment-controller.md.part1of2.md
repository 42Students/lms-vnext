# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/l12-u027-faculty-teaching-assignment-controller.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l12-u027-faculty-teaching-assignment-controller.md

## G2-12-027-001  [P1] MISSING  facet F01  effort M
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:29-32,73-86: `/api/v1/teaching-assignment/get/{id}` returns one assignment by numeric ID.
- vNext now: V/app/api/courses/teaching-assignments/route.ts:12-24 lists by deliveryId; V/app/api/courses/teaching-assignments/[assignmentId]/route.ts:17-55 exposes DELETE/PATCH only, no GET item.
- Fix: Implement owner-scoped assignment detail GET or provide verified equivalent link/projection with legacy metadata.

## G2-12-027-002  [P1] GAP  facet F01  effort L
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:98-113,134-157: create POST `/create` and update PUT `/update/{id}`.
- vNext now: V/app/api/courses/teaching-assignments/route.ts:30-50 POST collection; V/app/api/courses/teaching-assignments/[assignmentId]/route.ts:43-54 PATCH role only.
- Fix: Map full update semantics to scoped edit surface or explicitly document retained-field restrictions.

## G2-12-027-003  [P1] GAP  facet F01  effort M
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:193-244: independent faculty, active-faculty, class, class+semester and batch read routes.
- vNext now: V/app/api/courses/teaching-assignments/route.ts:12-24 only deliveryId; V/modules/academics/faculty-assignment-service.ts:45-103 lists section-level grants separately.
- Fix: Expose equivalent faculty/class/batch query projections without conflating section-grants and course-grants.

## G2-12-027-009  [P1] GAP  facet F04  effort M
- Legacy: LBE/dto/response/FacultyTeachingAssignmentResponseDTO.java:11-27: returns id, facultyId/name, courseId/slug/name/imageUrl, classId/name, batchId/name, semesterNumber, academicYear, role, isActive and incomplete flag.
- vNext now: V/modules/courses/teaching-assignment-service.ts:90-102: returns id, deliveryId, membershipId, displayName, role, startedAt, endedAt only.
- Fix: Build equivalent projection joining delivery/section/cohort/course/period and include missing fields or explicit absence mapping.

## G2-12-027-010  [P1] GAP  facet F04  effort L
- Legacy: LBE/service/impl/FacultyTeachingAssignmentServiceImpl.java:199-265: missing faculty/course/class/batch metadata remains visible and `metadataIncomplete=true`.
- vNext now: V/modules/admin-ui/super-admin-faculty-assignments-service.ts:21-52: inner joins discard records with missing faculty/course/section parents.
- Fix: Surface orphan references as degraded records with explicit error indicator, not silently drop from results.

## G2-12-027-011  [P1] GAP  facet F04  effort L
- Legacy: LBE/model/FacultyTeachingAssignment.java:33-53: raw batchId, semesterNumber, academicYear and SQL DATE start/end separately persisted.
- vNext now: V/db/schema/courses.ts:218-245: delivery/period relationship and timestamptz start/end lifecycle only.
- Fix: Document migration projections and historical start/end date conversion; preserve year and batch semantics.

## G2-12-027-017  [P1] GAP  facet F06  effort L
- Legacy: LBE/dto/request/FacultyTeachingAssignmentDTO.java:14-35: numeric faculty/course/class/batch/semester @Min(1), academicYear/role max255, isActive, startDate, endDate, courseIds.
- vNext now: V/modules/courses/validation.ts:129-152: strict UUID delivery/membership, role, and UUID deliveryIds[1..10], no academicYear/isActive/date fields.
- Fix: Restore editable academic-year/lifecycle details or explicitly preserve through linked period and migration strategy.

## G2-12-027-019  [P1] GAP  facet F06  effort M
- Legacy: LBE/access/TeachingAssignmentScopeValidator.java:35-46: updates may omit faculty/course/class/semester and retain originals.
- vNext now: V/modules/courses/validation.ts:137-142: PATCH only role plus required `expectedUpdatedAt`; other fields cannot update.
- Fix: Provide validated full reassignment/edit or formally deprecate partial-edit capabilities.

## G2-12-027-022  [P1] MISSING  facet F07  effort S
- Legacy: LBE/access/TeachingAssignmentScopeValidator.java:63-67: rejects startDate after endDate with exact message.
- vNext now: V/modules/courses/validation.ts:129-152: no date fields to validate.
- Fix: Retain start/end ordering check if dates are migrated/editable; otherwise document retired date rule.

## G2-12-027-030  [P1] GAP  facet F10  effort M
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:116-130 and LBE/service/impl/FacultyTeachingAssignmentServiceImpl.java:87-114: bulk loops under @Transactional; one failure rolls back all writes.
- vNext now: V/app/api/college/teaching-assignments/bulk/route.ts:25-39: per-delivery loop catches errors and returns partial success.
- Fix: Preserve atomic bulk contract or explicitly label partial success and provide rollback action.

## G2-12-027-031  [P1] GAP  facet F10  effort M
- Legacy: LBE/service/impl/FacultyTeachingAssignmentServiceImpl.java:121-129: DELETE physically removes assignment via repository.deleteById.
- vNext now: V/modules/courses/teaching-assignment-service.ts:279-376: DELETE marks endedAt and emits activity event.
- Fix: Define explicit hard-delete vs end/deactivate policy and data retention; avoid calling end an exact delete match.

## G2-12-027-034  [P1] GAP  facet F10  effort L
- Legacy: LBE/service/impl/FacultyTeachingAssignmentServiceImpl.java:112-119: update overwrites supplied faculty/course/class/semester/year/role/active/dates.
- vNext now: V/modules/courses/teaching-assignment-service.ts:385-495: role-only PATCH with CAS updatedAt.
- Fix: Expose controlled changes for necessary legacy fields or document replacement assignment flow.

## G2-12-027-035  [P1] GAP  facet F11  effort M
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:45-50: only platform admin, college ADMIN or faculty with `facultyType=ADMIN` can manage.
- vNext now: V/modules/courses/teaching-assignment-service.ts:151-155: checks `courses.manage` for delivery college; V/modules/courses/teaching-assignment-batch-service.ts:23-35 superadmin selected college only.
- Fix: Ensure faculty department-admin analog retains manage access or document role-policy removal.

## G2-12-027-038  [P1] GAP  facet F12  effort M
- Legacy: LBE/access/TeachingAssignmentScopeValidator.java:77-120: validates college graph and semester, but electives/retakes need not have SemesterCourse mapping.
- vNext now: V/modules/courses/teaching-assignment-batch-service.ts:36-42,71-92: batch deliveries must share section/cohort/academicPeriod and active offering.
- Fix: Check elective/retake deliveries are assignable even without strict term-course mapping; add coverage.

## G2-12-027-042  [P1] GAP  facet F13  effort M
- Legacy: LBE/service/impl/FacultyTeachingAssignmentServiceImpl.java:245-265: orphan data remains with metadataIncomplete=true and warning log.
- vNext now: V/modules/admin-ui/super-admin-faculty-assignments-service.ts:21-52 inner joins hide orphan rows.
- Fix: Display degraded data with icon/helper instead of dropping records silently.

## G2-12-027-052  [P1] GAP  facet F20  effort M
- Legacy: LBE/access/TeachingAssignmentScopeValidator.java:55-67: update merges omitted start/end, enforces start<=end.
- vNext now: V/modules/courses/validation.ts:129-152: no mutable start/end dates; vNext role CAS via expectedUpdatedAt.
- Fix: Reconcile date-only legacy records into effective delivery period with timezone-safe conversion.

## G2-12-027-053  [P1] GAP  facet F20  effort M
- Legacy: LBE/service/impl/FacultyTeachingAssignmentServiceImpl.java:87-114: bulk @Transactional creates all requested course IDs or rolls back.
- vNext now: V/modules/courses/teaching-assignment-batch-service.ts:46-148: atomic SA batch locks deliveries; V/app/api/college/teaching-assignments/bulk/route.ts:25-38 partial failure.
- Fix: Unify batch semantics across SA and college callers or explicitly distinguish atomic vs partial.

## G2-12-027-057  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/FacultyTeachingAssignment.java:17-60: int faculty/course/class/batch/semester, academicYear, role, Boolean active, date-only start/end, BaseModel lifecycle.
- vNext now: V/db/schema/courses.ts:218-267: UUID delivery/membership, enum role, timestamptz startedAt/endedAt, audit times, indexes.
- Fix: Provide column-by-column migration mapping with explicit year, role, archived/inactive, and date-only semantics.

## G2-12-027-021  [P2] GAP  facet F07  effort S
- Legacy: LBE/access/TeachingAssignmentScopeValidator.java:44-53: exact errors `Faculty, course, class and semester are required`, `Invalid teaching role`.
- vNext now: V/components/admin/super-admin-faculty-assignment-create.tsx:42-47: `Choose an active class delivery and faculty member.`
- Fix: Map validation to specific missing field/role errors rather than generic combined notice.

## G2-12-027-023  [P2] GAP  facet F07  effort S
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:67-70: 400 fallback `Failed to <action> assignment. Please check the supplied details.`
- vNext now: V/components/admin/super-admin-faculty-assignment-create.tsx:52-56: `Could not assign this faculty member. Check the teaching role and active class.`
- Fix: Keep distinct backend error codes and exact legacy fallback wording per action if parity.
