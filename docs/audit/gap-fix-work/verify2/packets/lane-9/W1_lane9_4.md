# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-14-008-066 [P1] GAP facet F22
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/learner-video-player.tsx, src/components/courses/faculty-lesson-video-manager.tsx
- Legacy: Legacy contentDataDTO file_dto.cloud_storage_object or link, vNext lesson video record storageKey and published lesson content — `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/video.js:28-32`
- Expected fix: Normalize legacy link/file into managed video and lessonContent binding with signed access

## G2-18-028-001 [P1] GAP facet F01
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/app/(authenticated)/admin/projects/[projectId]/[section]/page.tsx, src/app/(authenticated)/superadmin/[...legacy]/page.tsx
- Legacy: Legacy /superadmin/projects/workspaces/[workspaceId]/overview under college selection and named shell tabs; overview.js:31-37,107-151;SuperAdminWorkspaceShell.jsx:14-26
- Expected fix: Confirm old deep-link route maps to overview, preserves from/college and does not 404

## G2-15-012-012 [P1] GAP facet F04
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/messaging/model.ts
- Legacy: Name trim, strip {#...#}, default User, clamp 30 chars. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:103-107`)
- Expected fix: Reuse exact job name sanitizer before rendering approved DLT body.

## G2-15-012-067 [P1] GAP facet F22
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/messaging/service.ts
- Legacy: sms_delivery_log stores purpose, 4-digit suffix, status, provider SID, error, college ID. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:21-55`)
- Expected fix: Define audit-schema crosswalk and support lookup without storing raw phone.

## G2-15-012-072 [P1] GAP facet F23
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/notifications/types.ts
- Legacy: Separate job/update and notification methods. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:96-134`)
- Expected fix: Verify complete feature trigger parity before release.

## G2-15-001-011 [P1] GAP facet F03
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/faculty-course-list.tsx
- Legacy: Orphan course or class displays warning `Incomplete assignment data`, unavailable image/card (CoursesContent.jsx:519-524,555-560).
- Expected fix: Fetch/report orphan assignment rows as disabled diagnostic cards rather than suppressing them.

## G2-15-001-015 [P1] GAP facet F04
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/faculty-course-list.tsx
- Legacy: Fallback for nameless courses is `Course information unavailable` (courseListingUtils.js:139-159).
- Expected fix: Preserve visible diagnostic missing-name case and disable navigation.

## G2-15-001-030 [P1] GAP facet F07
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/courses/faculty-course-service.ts
- Legacy: Unauthorized client shows `Faculty access is required to view teaching assignments.` before fetch (CoursesContent.jsx:109-113).
- Expected fix: Render accessible exact legacy role-denial message or documented 403 policy, without exposing data.

## G2-15-001-049 [P1] GAP facet F13
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/faculty-course-list.tsx
- Legacy: Malformed data warnings are visible instead of dropped; `Some course records have incomplete or duplicate information...` (CoursesContent.jsx:483-485).
- Expected fix: Add diagnostic warning for suppressed/orphaned grant records with actionable administrator resolution.

## G2-15-001-066 [P1] GAP facet F22
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/courses/faculty-course-service.ts
- Legacy: Legacy `faculty_teaching_assignment` uses integer faculty/course/class and nullable batch, semester_number, academic_year, role, is_active, start/end dates (FacultyTeachingAssignment.java:18-60).
- Expected fix: Write explicit mapping/document retention of legacy semester/year/status and active date semantics for audit/report parity.

## G2-15-001-067 [P1] GAP facet F22
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/courses/faculty-course-service.ts
- Legacy: Legacy soft deletion inherited BaseModel and allowed null deleted flag, filtered in repository (FacultyTeachingAssignmentRepository.java:41-47).
- Expected fix: Specify soft-delete translation and verify no removed old grants are shown as active.

## G2-15-003-016 [P1] GAP facet F04
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/courses/college-learning-directory-service.ts, src/app/(authenticated)/admin/lessons/page.tsx
- Legacy: Unknown course renders `Course name unavailable (ID …)` (`sections/Lessons.js:218-221`).
- Expected fix: Report orphan lesson/path references without silently suppressing record, with remediation hint.

## G2-15-003-052 [P1] GAP facet F10
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/super-admin-lesson-bulk-visibility.tsx
- Legacy: Bulk `bulkUpdateLessonStatus({lessonIds,active,enabled})` updates lessons (`sections/Lessons.js:346-369`; `AdminService.js:536-537`).
- Expected fix: Treat lesson visibility and child-content publish flags separately and display affected row types.

## G2-15-003-060 [P1] GAP facet F12
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/app/(authenticated)/admin/lessons/page.tsx, src/components/courses/college-lesson-reorder-actions.tsx
- Legacy: Legacy reorder disabled when searching, loading, errors or no selected course (`sections/Lessons.js:222-239`).
- Expected fix: Disable reordering on filtered list/incomplete data and valid bottom boundary; enforce server order guards.

## G2-15-003-065 [P1] GAP facet F13
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/super-admin-lesson-bulk-visibility.tsx
- Legacy: Bulk partial failure retains failed IDs selected; `Retry failed`, first five reasons (`sections/Lessons.js:346-379,473-491`).
- Expected fix: Keep exact failed IDs/reasons and retry only failed subset with summary counts.

## G2-15-003-082 [P1] GAP facet F20
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/super-admin-lesson-bulk-visibility.tsx
- Legacy: Bulk disables on loadError and selected IDs only; failure IDs carried to retry (`sections/Lessons.js:346-379,473-505`).
- Expected fix: Retry only failed IDs; reject stale/invalid selections and prevent bulk during degraded view.

## G2-15-004-044 [P1] GAP facet F12
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/app/(authenticated)/learn/projects/page.tsx
- Legacy: Legacy archived suppresses review/action and sorts last (ProjectsContent.jsx:130-152,316-329,396-418)
- Expected fix: Suppress obsolete actions on archived rows

## G2-15-006-018 [P1] GAP facet F05
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/learner-course-list.tsx
- Legacy: Legacy semester selection defaults backend current semester, can view off-current for reference (CoursesContent.jsx:233-246)
- Expected fix: Map authoritative semester currentSemester and preserve reference-only flag per selected semester

## G2-15-006-044 [P1] GAP facet F12
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: (none, new feature)
- Legacy: Legacy off-current-semester records visible but NOT clickable, label `Not your current semester: shown for reference` (CoursesContent.jsx:240-246,554-560)
- Expected fix: Disable link for off-current term where old workspace forbade access, or prove vNext intentional read-only route and mark exception

## G2-15-008-046 [P1] GAP facet F13
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: (none, new feature)
- Legacy: Legacy progress unknown warning holds completion badges/actions but leaves content accessible (syllabusDetail.js:338-347)
- Expected fix: Add independent progressStateUnknown and hold only completion-dependent controls

## G2-16-005-001 [P1] GAP facet F01
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/app/(authenticated)/tracker/logs/page.tsx
- Legacy: `logs.js:550-576,770-815`: standalone `/tracker/logs` within TrackerShell; `Logs` H1 and `42 Logs` eyebrow.
- Expected fix: Restore primary Logs workbench as entry and keep Known Errors as a sub-workspace.

## G2-16-009-008 [P1] MISSING facet F03
- Verification: OK — attendance load-error alert displays the exact legacy failure text and a Retry action.
- Files: src/components/courses/learner-course-attendance.tsx
- Legacy: StudentAttendanceView.jsx:60-68 error alert includes Retry button.
- Expected fix: Add localized retriable load-error Alert.

## G2-16-009-016 [P1] GAP facet F05
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/learner-course-attendance.tsx
- Legacy: StudentAttendanceView.jsx:73-80 absentIds and learnerSessionStatus derive future/pending.
- Expected fix: Reconcile future/unmarked/cancelled statuses vs legacy helper.

## G2-16-009-022 [P1] GAP facet F07
- Verification: OK — attendance load-error alert displays the exact legacy failure text and a Retry action.
- Files: src/components/courses/learner-course-attendance.tsx
- Legacy: StudentAttendanceView.jsx:42-49 failure text Failed to load attendance.
- Expected fix: Catch real service failure independently and display exact text.

## G2-16-009-029 [P1] GAP facet F10
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/courses/learner-course-attendance.tsx
- Legacy: StudentAttendanceView.jsx:37-49 independent attendance fetch/failure.
- Expected fix: Split local attendance recovery from entire course.
