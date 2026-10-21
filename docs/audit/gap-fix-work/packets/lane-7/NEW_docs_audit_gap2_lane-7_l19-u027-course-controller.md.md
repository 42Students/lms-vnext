# Work packet: NEW / MISSING items from docs/audit/gap2/lane-7/l19-u027-course-controller.md

13 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/l19-u027-course-controller.md

## G2-19-027-059  [P1] GAP  facet F11  effort M
- Legacy: LBE/controller/CourseController.java:195-265 denies unknown/foreign/deleted course identically as 404 on slug and ID reads.
- vNext now: V/modules/courses/course-service.ts:129-200 requires courses.read college and excludes archived by default; no public slug GET.
- Fix: Ensure all detail aliases collapse unauthorized/unknown to same safe error and no slug oracle.

## G2-19-027-062  [P1] GAP  facet F12  effort L
- Legacy: LBE/service/impl/CourseServiceImpl.java:168-186 blocks deletion when any lesson content or active lessons remain.
- vNext now: V/modules/courses/course-service.ts:391-404 blocks archive only for ACTIVE offerings.
- Fix: Check descendant lessons and content independently, including nonactive offerings; avoid stranded child data.

## G2-19-027-064  [P1] GAP  facet F12  effort M
- Legacy: LBE/service/impl/CourseServiceImpl.java:233-267 rejects case-insensitive duplicate course_name OR short_title per department.
- vNext now: V/modules/courses/course-service.ts:51-111 blocks duplicate name OR internal code via separate partial indexes.
- Fix: Match legacy duplicate short title or preserve as uniqueness in migrated data.

## G2-19-027-066  [P1] GAP  facet F12  effort M
- Legacy: LBE/model/Course.java:42-45 stores active, enabled, allowedForDisplay separately.
- vNext now: V/db/schema/courses.ts:51-55 status ACTIVE/ARCHIVED only; active offerings modeled separately.
- Fix: Differentiate hidden visibility from archived course lifecycle; avoid conflating user hide with archive.

## G2-19-027-074  [P1] GAP  facet F15  effort M
- Legacy: LBE/controller/CourseController.java:380-448 audits COURSE_UPDATE/DELETE, :471-480 COURSE_RESTORE through AdminAuditLogService.
- vNext now: V/modules/courses/course-service.ts:342-355 writes activity COURSES_CATALOG_UPDATED and :426-433 ARCHIVED; no restore event.
- Fix: Map audit event taxonomy and add restore audit with actor/time and change summary.

## G2-19-027-085  [P1] GAP  facet F19  effort M
- Legacy: LFE/pages/superadmin/sections/Courses.js:18-19 persists pageSize in localStorage and can select 100.
- vNext now: V/modules/courses/college-course-catalogue-model.ts:3-11 defines pageSize query but service fixed 25.
- Fix: Fix wrong pageSize view/query contract, prevent page count mismatch.

## G2-19-027-087  [P1] GAP  facet F20  effort M
- Legacy: LBE/model/Course.java:52-61 @Version optimistic CAS prevents lost updates including whole metaData.
- vNext now: V/modules/courses/course-service.ts:310-337 FOR UPDATE within transaction but no expected-version from client.
- Fix: Add expectedUpdatedAt/version in PATCH and stale-conflict message to prevent overwriting form edits.

## G2-19-027-091  [P1] GAP  facet F21  effort M
- Legacy: LFE/pages/superadmin/sections/Courses.js:217-228 uses R2 presigned upload helper for course image.
- vNext now: V/components/courses/admin-course-display-editor.tsx:215-216 says upload-backed thumbnail dependent on W01 storage.
- Fix: Connect storage receipt flow or document intentional deferral and render fallback.

## G2-19-027-092  [P1] GAP  facet F22  effort L
- Legacy: LBE/model/Course.java:24-76 has integer ID/dept ID, optional parent/createdByOrgId, 3 visibility fields, slug, optimistic version, JSON contents.
- vNext now: V/db/schema/courses.ts:34-86 defines UUID courses, departmentId, name, code, shortTitle, officialCode, cardColor, takeaways, description, status, timestamps and partial unique indexes.
- Fix: Write complete old-to-new schema migration with typed JSON extraction and legacy identity crosswalk.

## G2-19-027-093  [P1] GAP  facet F22  effort M
- Legacy: LBE/repository/CourseRepository.java:112-134 checks duplicate course name OR short title among non-deleted rows.
- vNext now: V/db/schema/courses.ts:66-78 partial unique indexes on active department/name and department/code.
- Fix: Resolve duplicate short titles during import and ensure intended constraint parity.

## G2-19-027-095  [P1] GAP  facet F22  effort M
- Legacy: LBE/model/Course.java:52-61 Long version CAS.
- vNext now: V/db/schema/courses.ts:55-63 updatedAt but no version integer; service PATCH lacks client token.
- Fix: Migrate version or use millisecond-precision expectedUpdatedAt CAS for course edits.

## G2-19-027-096  [P1] GAP  facet F22  effort M
- Legacy: LBE/service/impl/CourseServiceImpl.java:168-210 soft delete/restore stores isDeleted boolean.
- vNext now: V/db/schema/courses.ts:51-55 status ACTIVE/ARCHIVED and no archivedAt or restore route.
- Fix: Preserve deleted/restored audit lifecycle with timestamp and reversible status transition.

## G2-19-027-098  [P1] GAP  facet F23  effort M
- Legacy: LFE/pages/superadmin/sections/Courses.js:578-639 has student visibility Show/Hide bulk controls selected across pages.
- vNext now: V/components/courses/admin-course-overview.tsx:523-528 has SuperAdminCourseBulkVisibility but not college selection flow.
- Fix: Make bulk visibility reachable to college admins under same role policy and preserve selection/partial failures.
