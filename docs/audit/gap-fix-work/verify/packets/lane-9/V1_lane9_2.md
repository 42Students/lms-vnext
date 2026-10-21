# Verification packet (P1 sample): 15 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-025-063 [P1] MISSING facet F15
- Files: src/components/verification/TpoVerificationPanel.tsx
- Legacy: `docs/legacy-source/frontend/src/components/verification/VerificationWorkspace.jsx:332-337`
- Expected fix: Legacy bulkNudge sends in-app student outreach from TPO verification action menu; confirm new send-message action rather than replace with verification event.

## G2-3-025-023 [P1] GAP facet F06
- Files: src/app/api/courses/learner/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/StudentCourseController.java:40-41`
- Expected fix: Legacy accepts optional integer semesterId query and reconciles foreign/deleted IDs; vNext API exposes no semester selector/query parameter.

## G2-4-032-033 [P1] MISSING facet F10
- Files: src/modules/courses/learner-assignment-due-notice-model.ts
- Legacy: Interview reminders every day 7pm Asia/Kolkata (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:182-220`)
- Expected fix: Build scheduled interview reminders with cancel/complete exclusion and timezone.

## G2-4-032-043 [P1] GAP facet F12
- Files: src/modules/courses/learner-assignment-due-notice-model.ts
- Legacy: Interview reminders only tomorrow 19:00 IST and not cancelled/completed (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:182-220`)
- Expected fix: Implement correct independent interview UTC boundaries.

## G2-4-019-063 [P1] GAP facet F19
- Files: src/modules/courses/college-learner-progress-service.ts
- Legacy: Legacy batch max500 avoids silently truncated content results. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LearnerContentProgressServiceImpl.java:218-225`)
- Expected fix: Do not quietly truncate large learner progress reports; expose partial warning.

## G2-4-016-013 [P1] MISSING facet F04
- Files: src/modules/notifications/exotel-sms.ts, src/db/schema/messaging-receipts.ts
- Legacy: Legacy provider_message_id varchar64 for accepted attempt. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/SmsDeliveryLog.java:45-46`)
- Expected fix: Persist safe provider trace ID in append-only attempt.

## G2-4-016-053 [P1] GAP facet F15
- Files: src/modules/notifications/exotel-sms.ts, src/modules/attendance/parent-sms-provider.ts
- Legacy: Legacy OTP, job and notification sender log attempts regardless of provider result. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:80-133`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:147-204`)
- Expected fix: Add universal provider attempt journal for all outgoing SMS categories.

## G2-4-013-063 [P1] GAP facet F14
- Files: src/modules/courses/faculty-report-pdf.ts
- Legacy: Legacy PDF uses jsPDF unicode-compatible text fallback; date Generated MMM D, YYYY at h:mm A. (`docs/legacy-source/frontend/src/utils/assignmentReport.js:114-115`; `docs/legacy-source/frontend/src/utils/downloadAssignmentReportPdf.js:35-37`)
- Expected fix: Preserve accented/non-English names and old generation timestamp format.

## G2-5-031-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/colleges/[collegeId]/admins/page.tsx
- Legacy: Legacy `Sessions`,`History`,`Delete` row actions in table. `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminUsers.js:318-346`
- Expected fix: Restore permanent delete where permitted and compact inline actions.

## G2-6-008-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/teacher/notifications/page.tsx, src/modules/courses/faculty-inbox-query-model.ts
- Legacy: Old tabs use `?tab=all
- Expected fix: Restore faculty scope tabs with corresponding counts and preserve deep links

## G2-17-031-033 [P1] GAP facet F12
- Files: (none, new feature)
- Legacy: LBE/controller/AdminProjectTemplateController.java:391-472 Publish/Unpublish and rollback template versions.
- Expected fix: Verify rollback doesn't mutate already-assigned frozen version.

## G2-7-016-023 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/tasks.js:33-42 reset/refill then useUnsavedFormGuard
- Expected fix: Guard Back, tabs and unload for in-page plan

## G2-8-017-023 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LBE/dto/projects/AdminProjectTemplateUpsertDTO.java:23-28 expectedTemplateVersion optional for section-only updates, omitted title preserves metadata
- Expected fix: Support legacy section-only writes without title and equivalent CAS; keep newer optimistic guard.

## G2-8-025-053 [P1] GAP facet F20
- Files: src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts
- Legacy: Legacy materialIndex references mutable list order; insert/remove can invalidate old link (docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ResourceFileController.java:94-104).
- Expected fix: Use stable UUID per material for downloadable bookmarks and sort independently.

## G2-9-015-023 [P1] GAP facet F04
- Files: src/app/(authenticated)/college/placements/drives/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:519-525` — Job Type uses college types with getJobTypeTag.
- Expected fix: Map dynamic job types and badges.
