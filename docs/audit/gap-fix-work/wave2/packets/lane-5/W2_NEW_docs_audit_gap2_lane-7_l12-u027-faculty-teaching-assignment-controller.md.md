# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/l12-u027-faculty-teaching-assignment-controller.md

16 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l12-u027-faculty-teaching-assignment-controller.md

## G2-12-027-004  [P2] GAP  facet F01  effort M
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:246-315: admin paginated and fetchAll/fetchActive read routes.
- vNext now: V/app/(authenticated)/admin/faculty-assignment/page.tsx:13-46 superadmin selected-college directory; V/modules/admin-ui/super-admin-faculty-assignments-service.ts:1-89 paged.
- Fix: Document route relocation, preserve admin-level list and access for college-admin callers.

## G2-12-027-006  [P2] GAP  facet F02  effort M
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:98-132: create and bulk are separate JSON API entry points.
- vNext now: V/components/admin/super-admin-faculty-assignment-create.tsx:58-119: one collapsible create panel plus same-class multi-course selector.
- Fix: Keep single vs bulk affordance and same-semester context clear, match old screen composition where used.

## G2-12-027-007  [P2] GAP  facet F03  effort M
- Legacy: LBE/dto/response/FacultyTeachingAssignmentResponseDTO.java:11-27: assignment lists expose faculty, course, class and batch names, role, active, image, metadataIncomplete.
- vNext now: V/modules/admin-ui/super-admin-faculty-assignments-service.ts:63-78: row detail chips for class/semester/year/role/active/started, no course image or metadataIncomplete.
- Fix: Render legacy course image, batch and orphan metadata indicator where applicable.

## G2-12-027-008  [P2] GAP  facet F03  effort M
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:159-191: distinct Delete and Deactivate actions exposed.
- vNext now: V/app/(authenticated)/admin/faculty-assignment/page.tsx:33-43 Manage assignment disclosure and TeachingAssignmentActions, role edit.
- Fix: Label physical delete vs ending separately if both supported, else mark hard delete retired.

## G2-12-027-012  [P2] GAP  facet F04  effort M
- Legacy: LBE/dto/response/FacultyTeachingAssignmentResponseDTO.java:39-41: null role returns PRIMARY, isActive stored Boolean.
- vNext now: V/db/schema/courses.ts:230-245: required enum role, endedAt null denotes ACTIVE; UI status derives assignment or delivery end.
- Fix: Map null/false legacy isActive separately from ended delivery and default role.

## G2-12-027-013  [P2] GAP  facet F05  effort S
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:246-273: page=0 size=25 by default; size bounded 1..200.
- vNext now: V/modules/admin-ui/super-admin-faculty-assignments-service.ts:60-64 uses 1-based page and model-configured pageSize.
- Fix: Retain zero-based API adapter or ensure client defaults/page-size match old admin endpoint.

## G2-12-027-014  [P2] GAP  facet F05  effort S
- Legacy: LBE/repository/FacultyTeachingAssignmentRepository.java:15-34: admin list sorted assignment id DESC.
- vNext now: V/modules/admin-ui/super-admin-faculty-assignments-service.ts:65-68 sorts teacherName/courseName/id ASC.
- Fix: Restore most-recent assignment sort where legacy parity required.

## G2-12-027-015  [P2] GAP  facet F05  effort S
- Legacy: LBE/repository/FacultyTeachingAssignmentRepository.java:43-75: active faculty/class/batch lists sorted courseId then classId then id.
- vNext now: V/modules/courses/teaching-assignment-service.ts:133-136 sorts role then faculty name.
- Fix: Preserve lookup-specific course/class/id ordering in faculty/class/batch projections.

## G2-12-027-018  [P2] GAP  facet F06  effort M
- Legacy: LBE/model/FacultyTeachingAssignment.java:39-53: startDate/endDate nullable ISO SQL DATE, role default PRIMARY, active default true.
- vNext now: V/components/admin/super-admin-faculty-assignment-create.tsx:25-42: role default PRIMARY; selected live delivery derives term; no start/end date input.
- Fix: Document whether date fields intentionally retired; if parity required expose date-only controls.

## G2-12-027-020  [P2] GAP  facet F06  effort M
- Legacy: LBE/access/TeachingAssignmentScopeValidator.java:106-117: bulk accepts nonempty unique positive courseIds without 10-course cap.
- vNext now: V/modules/courses/validation.ts:143-149: batch caps at 10 UUID deliveries; college bulk caps at 50 V/app/api/college/teaching-assignments/bulk/route.ts:9-13.
- Fix: Align domain-appropriate bulk caps with documented legacy unlimited count or show exact cap notice.

## G2-12-027-032  [P2] GAP  facet F10  effort M
- Legacy: LBE/service/impl/FacultyTeachingAssignmentServiceImpl.java:131-139: deactivate toggles isActive=false and preserves assignment.
- vNext now: V/modules/courses/teaching-assignment-service.ts:338-375: ending records endedAt timestamp and audit log.
- Fix: Map isActive=false to endedAt or separate inactive flag for historical parity.

## G2-12-027-041  [P2] GAP  facet F13  effort M
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:76-80,141-144: explicit 404 payload on absent assignment.
- vNext now: V/modules/courses/teaching-assignment-service.ts:294-313: service code for ended/missing grant; UI role editor handles 409 separately.
- Fix: Add page-level absent/ended states and fetch Retry vs expired session handling.

## G2-12-027-044  [P2] GAP  facet F14  effort M
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:116-132: bulk creation JSON array of course IDs, not spreadsheet upload.
- vNext now: V/app/api/college/teaching-assignments/bulk/route.ts:9-38: JSON UUID delivery array and partial failures.
- Fix: Align structured bulk validation/error report semantics, keep no file-upload expectation.

## G2-12-027-048  [P2] GAP  facet F18  effort S
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:104-109,122-126,148-150,169-187: exact success strings created/updated/deleted/deactivated.
- vNext now: V/components/admin/super-admin-faculty-assignment-create.tsx:50-56: alternative `Teaching assignment created.` and `Created N teaching assignments for this class.`.
- Fix: Restore copy catalogue strings individually for all four transitions.

## G2-12-027-049  [P2] GAP  facet F18  effort S
- Legacy: LBE/access/TeachingAssignmentScopeValidator.java:44-46,65-66,87-89: exact graph/date error messages.
- vNext now: V/components/admin/super-admin-faculty-assignment-create.tsx:42-56: single generic invalid-selection error.
- Fix: Expose actionable validator errors at associated inputs rather than generic banner.

## G2-12-027-058  [P2] GAP  facet F22  effort M
- Legacy: LBE/repository/FacultyTeachingAssignmentRepository.java:15-34: college-page join class/program/department and id DESC; historical isDeleted filter.
- vNext now: V/db/schema/courses.ts:246-267: active unique indexes and membership/delivery indexes; no `is_deleted` column.
- Fix: Map soft-delete flag to endedAt plus separate deletion provenance for reporting.
