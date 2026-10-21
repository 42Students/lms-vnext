# Work packet: NEW / MISSING items from docs/audit/gap2/lane-2/admin-course-bulk-controller.md (part 1 of 2)

20 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-2/admin-course-bulk-controller.md

## G2-2-014-006  [P1] GAP  facet F03  effort S
- Legacy: LF:616-621 rowSelection across paginated courses
- vNext now: NP:49-64 Select all courses ON THIS PAGE; hidden rows discarded
- Fix: Preserve cross-page selected IDs scoped to current college.

## G2-2-014-007  [P1] GAP  facet F04  effort S
- Legacy: LC:146-151 requested,updatedCount,failed[{courseId,reason}]
- vNext now: NS:69-71 selectedCourses,matchedLessons,matchedContents,changed,unchanged,failures per lesson,failedCourseIds
- Fix: Report per COURSE updated/failed and reasons, not only content-level changes.

## G2-2-014-008  [P1] GAP  facet F04  effort S
- Legacy: LF:484-485 Students see it visible when active && enabled
- vNext now: NC:127-137 status depends on course.status ACTIVE
- Fix: Make visible chip reflect course learner visibility, not lesson content count alone.

## G2-2-014-009  [P1] MISSING  facet F04  effort S
- Legacy: LC:63-70 active,enabled,allowedForDisplay independent nullable fields
- vNext now: NS:12-16 only visibleToStudents and confirmed
- Fix: Implement status/visibility bulk flags or document intentionally different feature.

## G2-2-014-011  [P1] GAP  facet F05  effort S
- Legacy: LF:616-620 selection persists after pagination/filtering
- vNext now: NP:21-25 filters selected IDs to visible current page
- Fix: Retain selected IDs across filter/page within same scope, clear on acting-college change.

## G2-2-014-012  [P1] GAP  facet F06  effort S
- Legacy: LC:86-97 allows any combination active, enabled, allowedForDisplay, at least one required
- vNext now: NS:14 requires single visibleToStudents boolean
- Fix: Provide three independent nullable status controls and combination validation.

## G2-2-014-019  [P1] GAP  facet F07  effort S
- Legacy: LC:110-117 failures 'Invalid course id'/'Course not found' per course
- vNext now: NS:28 throws COURSE_NOT_FOUND for ENTIRE group when one invalid/out-of-scope
- Fix: Continue to process authorized selected courses and return per-item failure instead of aborting whole batch.

## G2-2-014-023  [P1] GAP  facet F10  effort S
- Legacy: LC:108-137 each courseService.updateCourse independently, partial failures
- vNext now: NS:21-71 fans out lessons content visibility, never mutates courses
- Fix: Implement actual course status updates atomically per course; not a lesson visibility substitute.

## G2-2-014-024  [P1] MISSING  facet F10  effort S
- Legacy: LC:118-128 null flags preserve untouched fields, metadata safe
- vNext now: NS:21-71 no course mutation at all
- Fix: Restore partial per-course active/enabled/allow-display update semantics.

## G2-2-014-025  [P1] GAP  facet F10  effort S
- Legacy: LC:130-135 catches each course failure and continues
- vNext now: NS:28 throws for any bad/out-of-scope course BEFORE processing any
- Fix: Isolate unauthorized/invalid course and process remaining permitted IDs.

## G2-2-014-026  [P1] GAP  facet F10  effort S
- Legacy: LC:139-144 audit once COURSE_BULK_STATUS_UPDATE if updated>0
- vNext now: NS:47-67 calls lesson bulk service audit per content and no batch course audit
- Fix: Add summary COURSE_BULK_STATUS_UPDATE event with original requested/updated/failed counts.

## G2-2-014-028  [P1] GAP  facet F11  effort S
- Legacy: LC:100-104 auth principal required; admins can update owned college courses
- vNext now: NS:23 resolveActingCollege(... courses.manage) for SuperAdmin UI only
- Fix: Provide college-admin bulk status functionality with central course permission.

## G2-2-014-030  [P1] GAP  facet F12  effort S
- Legacy: LC:123-128 sets active/enabled, controlling learner visibility
- vNext now: NS:18-20 explicitly avoids archiving courses; toggles only published lesson visibility
- Fix: Do not treat lesson-content hide as course hide; preserve course-level visibility and learner queries.

## G2-2-014-032  [P1] GAP  facet F12  effort S
- Legacy: LC:30-33 each course independent; no group-wide tx
- vNext now: NS:47-67 batches 25 lessons; independent group errors but parent invalid blocks all
- Fix: Preserve per-course partial completion semantics and response classification.

## G2-2-014-043  [P1] GAP  facet F19  effort S
- Legacy: LC:108-137 independent updates, bounded100
- vNext now: NS:29-41 fetch up to501 lessons; can reject valid100 courses with many lessons
- Fix: Do not apply 500-lesson content cap to course-status operation.

## G2-2-014-044  [P1] GAP  facet F20  effort S
- Legacy: LC:108-137 no optimistic version, partial DTO avoids metadata overwrite
- vNext now: NS:47-67 CAS content service but no parent course field update
- Fix: Implement true flag CAS/integer version for courses while preserving unrelated fields.

## G2-2-014-046  [P1] GAP  facet F21  effort S
- Legacy: LC:49 CourseService updateCourse path
- vNext now: NS:8-9 bulk lesson visibility service and safe error model
- Fix: Wire proper course write service with per-item scope and audit.

## G2-2-014-047  [P1] GAP  facet F22  effort S
- Legacy: LC:63-71 CourseDTO active,enabled,allowedForDisplay columns
- vNext now: NS:12-16 only lessonContents visibleToStudents changes, courses status unchanged
- Fix: Persist actual course status and mapping, not merely lesson content flags.

## G2-2-014-048  [P1] MISSING  facet F22  effort S
- Legacy: LC:118-128 only requested fields modify, other course metadata untouched
- vNext now: NS:47-67 no course flags updates
- Fix: Use partial update query, preserve metadata and optimistic version.

## G2-2-014-049  [P1] GAP  facet F23  effort S
- Legacy: LC:25-37 audit explicitly targets course bulk status independent per course
- vNext now: NS:18-20 explicitly says never archive courses; only lesson student visibility
- Fix: High-priority functional non-equivalence: name/API suggests course status but operation differs.
