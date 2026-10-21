# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-13-027-023 [P1] GAP facet F11
- Files: src/modules/courses/lesson-content-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:57-59 — explicit principal.isFaculty requirement
- Expected fix: Confirm no roles outside intended teacher/admin gain write privilege, retaining old faculty/admin scope intent.

## G2-10-013-053 [P1] MISSING facet F13
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:781-794 — Fetch error message presented alongside previous data and recovery.
- Expected fix: Keep last-known-good appointment rows and warning, Retry.

## G2-19-027-043 [P1] GAP facet F14
- Files: src/components/courses/admin-course-display-editor.tsx
- Legacy: Legacy course form supports presigned R2 image upload + image removal and deferred remote key cleanup; Courses.js:11-13,70-100,360-368
- Expected fix: Use signed upload-backed thumbnails following project storage policy; preserve preview/replace/delete UX, never expose object key publicly.

## G2-12-007-073 [P1] GAP facet F22
- Files: src/app/(authenticated)/learn/allAssignments/page.tsx
- Legacy: Legacy submission payload assets array (file/link/text multiple kinds) `docs/legacy-source/frontend/src/components/Assignments/SubmitAssignmentModal.jsx:392-471`
- Expected fix: Preserve multipart asset lookup and display history

## G2-17-029-013 [P1] GAP facet F04
- Files: src/modules/platform-settings/legacy-setting-specs.ts, src/components/admin/tenant-settings-editor.tsx
- Legacy: legacy TenantSettings.js:150-187 SMS sender and three templates have placeholders and %s/{#var#} guidance
- Expected fix: Restore DLT variable ordering warnings and explicit active-provider instructions; avoid stale BulkSMSApps terminology

## G2-13-013-033 [P1] GAP facet F12
- Files: src/modules/courses/college-learning-directory-service.ts, src/db/schema/courses.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchCache.java:50-55` filter l.isActive before loading (not isDeleted check)
- Expected fix: Clarify mapping legacy active/is_deleted/enabled to vNext ACTIVE/ARCHIVED/visible flags and exclude soft-deleted where intended

## G2-14-002-093 [P1] MISSING facet F21
- Files: src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy OTP rate limiter integration reset all login prefixes; vNext page lacks integration — `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/UserController.java:180-200`
- Expected fix: Implement privileged limiter reset with auditing

## G2-15-012-003 [P1] GAP facet F01
- Files: src/modules/notifications/types.ts
- Legacy: sendNotification/sendSmsWithTemplate/sendJobUpdateSms callable by legacy domains. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/SmsService.java:31-49`)
- Expected fix: Build explicit job-update and approved notice SMS ports with DLT template schemas.

## G2-15-012-033 [P1] GAP facet F10
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: send() records SENT/FAILED, provider Sid or error. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:147-205`)
- Expected fix: Write privacy-safe durable OTP send attempts or equivalent audit DB/event.

## G2-15-003-043 [P1] GAP facet F08
- Files: src/components/courses/super-admin-lesson-bulk-visibility.tsx
- Legacy: Bulk success `Show/Hide to students: {updatedCount} lesson(s) updated.` (`sections/Lessons.js:346-369`).
- Expected fix: Preserve per-lesson update semantics and counts; report content-level changes separately.

## G2-17-007-043 [P1] GAP facet F10
- Files: src/app/api/courses/lessons/route.ts
- Legacy: docs/legacy-source/frontend/src/api/Services/AdminService.js:560-580 — Legacy `/api/v1/lesson/create` POST, `/fetch?courseId=` GET, `/update/{id}` PUT, `/delete/{id}` DELETE.
- Expected fix: Map edit/delete to relevant per-ID routes and expose UI, explicitly translate old course to offering/path IDs.

## G2-18-007-023 [P1] GAP facet F05
- Files: src/modules/courses/college-content-authoring-service.ts, src/components/courses/college-content-authoring-control.tsx
- Legacy: Old Existing Content filters Course, Lesson, Section; class change refetches (`LessonContent.js:1601-1664`).
- Expected fix: Server-page/filter scoped list by Course/Lesson/Section; remove arbitrary 250 cap.

## G2-18-001-093 [P1] GAP facet F20
- Files: src/components/courses/faculty-course-tab-navigation.tsx, src/modules/courses/faculty-course-service.ts
- Legacy: Legacy checks cancellation and sequence to ignore out-of-order assignment refresh, clears cached roster on failure. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:145-156`, `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:184-203`
- Expected fix: Ensure a failed periodic refresh never leaves stale confidential roster visibly accessible; consider route-level error reset on revoked access.

## G2-18-002-113 [P1] GAP facet F20
- Files: src/components/courses/super-admin-lesson-bulk-visibility.tsx
- Legacy: Legacy hide/show partial failure retains only failed IDs selected for Retry failed. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:353-375`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:473-490`
- Expected fix: Store failed IDs and per-item retry without repeating successful changes, preserve error reason.

## G2-18-003-053 [P1] GAP facet F08
- Files: src/components/courses/super-admin-course-bulk-visibility.tsx
- Legacy: Legacy bulk success/partial report per course, failed IDs reselected; Retry failed. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:414-455`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:576-590`
- Expected fix: Align one-course-unit success count and targeted retry with detail on lesson/content effects.

## G2-18-003-063 [P1] GAP facet F10
- Files: src/components/courses/super-admin-course-bulk-visibility.tsx, src/modules/courses/super-admin-course-bulk-visibility.ts
- Legacy: Legacy bulk POST `/api/v1/admin/courses/bulk-status` toggles course active/enabled. `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:414-455`, `docs/legacy-source/frontend/src/api/Services/AdminService.js:527-534`
- Expected fix: Rename to `bulk published content visibility` or implement actual course status bulk toggles.

## G2-19-007-023 [P1] GAP facet F05
- Files: src/components/courses/admin-offering-learning-overview.tsx, src/components/courses/admin-offering-section-preview.tsx
- Legacy: Legacy class-specific syllabus query fetches specific content `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:555-568`
- Expected fix: Render actual scoped course syllabus including section items when class selected.

## G2-19-005-063 [P1] GAP facet F21
- Files: src/app/(authenticated)/learn/my-placements/calendar/page.tsx
- Legacy: Old destination integrates TPO calendar blocked dates and job deadlines `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:81-101`
- Expected fix: Integrate authorized blocked-date and deadline providers.

## G2-19-008-023 [P1] GAP facet F10
- Files: src/components/courses/assignment-file-open-control.tsx
- Legacy: Legacy iframe open performs browser GET to pdfUrl; no JS API write `docs/legacy-source/frontend/src/pages/Dashboard/course/syllabus/PdfViewerModal.jsx:16-25`
- Expected fix: Introduce view-only grant with inline disposition and authorized GET / signed URL; do not repurpose attachment grant.

## G2-19-014-023 [P1] GAP facet F10
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: Legacy `@Query` performs SQL SELECT and Page response, no data mutation `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`
- Expected fix: Separate append-on-send and read-only history service.

## G2-2-024-003 [P1] MISSING facet F02
- Files: src/app/(authenticated)/admin/audit/page.tsx
- Legacy: AdminSmsLogController.java:22-31 designed as restricted operational support log
- Expected fix: Add separate SMS delivery section under Super Admin operations.

## G2-2-024-033 [P1] GAP facet F15
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: SmsDeliveryLog.java:9-17 attempt status without sending itself
- Expected fix: Instrument send adapters to durable write, not as a second send.

## G2-2-024-043 [P1] GAP facet F21
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: AdminSmsLogController.java:40-47 repository+AccessControlService+SecurityContextUtil
- Expected fix: Create an authorized support-read service integrated with provider outcome audit.

## G2-2-026-023 [P1] GAP facet F05
- Files: src/modules/courses/faculty-submission-review-service.ts
- Legacy: AssignmentController.java:236-267 bulk stats distincts at most 100 IDs, silently omits unauthorized IDs.
- Expected fix: Add capped batch stat route; preserve unauthorized-ID omission without side-channel.

## G2-3-001-043 [P1] GAP facet F09
- Files: src/components/courses/college-quiz-actions.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:385-392`
- Expected fix: When submissions exist, show modal `This quiz already has learner submissions` with count, metadata-only action, cancel; vNext edit lacks preflight explanation.
