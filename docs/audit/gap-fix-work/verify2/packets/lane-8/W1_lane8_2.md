# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-006-040 [P1] GAP facet F10
- Files: src/modules/placements/tpo-audit-service.ts
- Legacy: Legacy action writers persist to tpo_audit_log; logAtMostEvery de-dupes repeated updates. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAuditService.java:22`
- Expected fix: Trace every writer and ensure complete recorded action parity.

## G2-11-006-046 [P1] GAP facet F12
- Files: src/modules/placements/tpo-audit-service.ts
- Legacy: Single append-only tpo_audit_log with 1000-character normalized detail. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAuditService.java:32`
- Expected fix: Map legacy audit actions/details to privacy-safe canonical equivalents.

## G2-11-006-051 [P1] GAP facet F13
- Files: src/app/(authenticated)/tpo/audit/error.tsx
- Legacy: Old rows remain visible when refresh fails; closable Alert says stale data. `docs/legacy-source/frontend/src/pages/tpo/audit.js:117`
- Expected fix: Introduce stale-while-revalidate with retry banner.

## G2-11-006-074 [P1] GAP facet F21
- Files: src/modules/placements/tpo-audit-service.ts
- Legacy: Audit log persistence synchronous MySQL inserts, no background read jobs. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAuditService.java:34`
- Expected fix: Verify writer/webhook/job coverage of every old audit event.

## G2-11-006-076 [P1] GAP facet F22
- Files: src/modules/placements/tpo-audit-service.ts
- Legacy: V165 defines tpo_audit_log with college_id, actor_type/id, action, entity_type/id, detail, created_at and two indexes. `docs/legacy-source/backend/src/main/resources/db/migration/V165__tpo_v1_complete.sql:178`
- Expected fix: Write column/index/action crosswalk and close data migration requirements.

## G2-11-006-077 [P1] GAP facet F22
- Files: src/modules/placements/tpo-audit-service.ts
- Legacy: Legacy actor_type supports TPO/RECRUITER/STUDENT name lookups. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoAuditService.java:82`
- Expected fix: Capture safe type/name fallback where legacy stored it.

## G2-11-012-069 [P1] MISSING facet F13
- Files: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx
- Legacy: Refresh failure keeps old drives visible. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:421`
- Expected fix: Retain last snapshot with stale warning.

## G2-18-020-014 [P1] GAP facet F05
- Files: src/modules/academics/schedule-service.ts
- Legacy: ClassScheduleRepository.java:73-115 course-specific, faculty-specific and admin any-faculty variants
- Expected fix: Retain admin any-faculty filter and faculty-specific read for substitutions, co-teaching and course scope

## G2-18-020-017 [P1] GAP facet F06
- Files: src/modules/academics/schedule-service.ts
- Legacy: ClassScheduleDTO.java:14-31 requires positive classId/facultyId; courseId or courseSlug; nonblank startTime/endTime; hallId/title optional
- Expected fix: Map requiredness and error copy to legacy; explain new period/delivery constraints, support section-only without course

## G2-18-020-019 [P1] GAP facet F06
- Files: src/modules/academics/schedule-service.ts
- Legacy: ClassScheduleDTO.java:29 hallId int accepted; legacy service checks clashes
- Expected fix: Add lectureHallId into create schema and insert, validate same-college hall and conflicts

## G2-18-020-021 [P1] GAP facet F07
- Files: src/modules/academics/schedule-service.ts
- Legacy: ClassScheduleRepository.java:137-165 counts faculty, class and lecture hall overlaps on create/update
- Expected fix: Implement transactionally verified faculty/section/hall overlap exclusion on create/update; exclude same event

## G2-18-020-027 [P1] GAP facet F10
- Files: src/modules/academics/schedule-service.ts
- Legacy: ClassScheduleRepository.java:51-52 detail lookup, :54-65 date read; ClassSchedule.java:16-35 single-table persistence
- Expected fix: Ensure legacy course binding translates to delivery linkage and prevent unlinked event on partially invalid course

## G2-18-020-030 [P1] GAP facet F11
- Files: src/modules/academics/schedule-service.ts, src/modules/courses/faculty-schedule-service.ts
- Legacy: ClassScheduleRepository.java:88-107 distinguishes faculty own and admin all faculty reads
- Expected fix: Verify faculty mutation path honors teach-this-class, not just college scope; admin reports remain all-faculty

## G2-18-020-045 [P1] GAP facet F20
- Files: src/modules/academics/schedule-service.ts
- Legacy: ClassScheduleRepository.java:149-165 edit excludes self from conflict query
- Expected fix: Check conflict against other rows, exclude self ID and serialize concurrent update/insert

## G2-19-019-031 [P1] GAP facet F10
- Files: src/modules/academics/faculty-assignment-service.ts
- Legacy: FacultyTeachingAssignmentRepository.java:124-139 bulk semester deactivation/reactivation for batch
- Expected fix: Implement promotion rollback/reactivation contract transactionally against offering term assignment set

## G2-19-019-034 [P1] GAP facet F11
- Files: src/modules/academics/faculty-assignment-service.ts
- Legacy: FacultyTeachingAssignmentRepository.java:51-81 class,semester,batch boundaries
- Expected fix: Prevent section-level role from authorizing course outside assigned delivery, including electives

## G2-12-018-015 [P1] GAP facet F06
- Files: src/modules/academics/semester-mutation-model.ts
- Legacy: Legacy create programId required positive, name required, date strings max255, courseIds any ints/status string `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/NewProgramStructureDTO.java:13-24`
- Expected fix: Add legacy structure create form or canonical adapter accepting all source fields.

## G2-12-005-004 [P1] GAP facet F02
- Files: src/app/(authenticated)/learn/my-placements/placement/page.tsx
- Legacy: Page order: debarments/absence warnings, registration, your requests, full inline placement rules `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:160-237`
- Expected fix: Recreate legacy section and alert order; classify intentional extra offers

## G2-12-002-020 [P1] GAP facet F05
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: Available courses from all college courses minus mapped `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:283-284`
- Expected fix: Confirm cross-department electives and scope; allow legacy valid courses

## G2-12-002-024 [P1] GAP facet F06
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: Add disabled on mapping error/table loading/reordering `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:363-375`
- Expected fix: Prevent add while mapping stale/unavailable

## G2-12-002-029 [P1] GAP facet F07
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: Maps server field errors semester_id, course_ids, program_id `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:201-208`
- Expected fix: Restore field error mapping

## G2-12-002-037 [P1] MISSING facet F09
- Files: src/components/academics/college-term-mapping-manager.tsx
- Legacy: Dirty edit cancel prompts `Discard mapping changes?` `docs/legacy-source/frontend/src/pages/superadmin/sections/SemesterCourseMapping.js:243-252`
- Expected fix: Confirm discarding edits

## G2-12-002-041 [P1] GAP facet F10
- Files: src/app/api/academics/semester-course-mappings/route.ts
- Legacy: POST bulk `{course_ids}` skips already mapped `docs/legacy-source/frontend/src/api/Services/SemesterService.js:28-29`
- Expected fix: Match idempotent duplicate semantics

## G2-12-002-042 [P1] GAP facet F10
- Files: src/app/api/academics/semester-course-mappings/[mappingId]/route.ts
- Legacy: PUT mapping `{credits,is_mandatory,course_order}` `docs/legacy-source/frontend/src/api/Services/SemesterService.js:44-45`
- Expected fix: Preserve isMandatory transition or document enum type parity

## G2-12-002-049 [P1] GAP facet F12
- Files: src/modules/academics/college-term-mapping-model.ts
- Legacy: Backend credits allow 0..30, UI edit 1..10 `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/SemesterCourseServiceImpl.java:129-144`
- Expected fix: Align legacy accepted credits
