# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-014-023 [P1] GAP facet F13
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/EmailSuppressionRepository.java:8 — table expected deployed by V161 without feature flag.
- Expected fix: Register migration and verify enabled sender/pre-send checks before release.

## G2-10-009-023 [P1] MISSING facet F04
- Files: src/modules/inbound-mail/message-model.ts, src/modules/inbound-mail/triage-transition-model.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/inbound-mail.js:19-28` status details distinguish POSTED/STORED/NO_THREAD/WRONG_SENDER/NOT_VERIFIED/EMPTY/ACCESS_ENDED/FAILED
- Expected fix: Store delivery/routing outcome orthogonally to staff triage status

## G2-10-009-103 [P1] GAP facet F19
- Files: src/modules/inbound-mail/admin-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminInboundMailController.java:29-35` list body_preview max1000, full body only GET one
- Expected fix: Select indexed 180-character preview for list, fetch full body on drawer open

## G2-10-013-083 [P1] GAP facet F23
- Files: src/app/(authenticated)/admin/placements/jobs/[jobId]/schedule/page.tsx
- Legacy: docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:148-184 — Legacy failed fetch doesn't convert error to misleading empty list.
- Expected fix: Add data/error/empty distinct states with Retry.

## G2-16-031-033 [P1] GAP facet F11
- Files: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx
- Legacy: TpoDriveController.java:51-63 guard requires owned job for reads/writes
- Expected fix: Verify per-job owner restrictions and acting-college admin permissions rather than relying solely on broad manage scope

## G2-14-002-053 [P1] GAP facet F10
- Files: src/components/college/college-student-register-form.tsx
- Legacy: Legacy learner register POST /api/v1/learner/register and LEARNER_CREATE audit; vNext POST /api/college/students/register — `docs/legacy-source/frontend/src/api/Services/AdminService.js:257-259`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:338-383`
- Expected fix: Preserve actor audit, identity/enrollment payload and selected-college security

## G2-15-009-033 [P1] GAP facet F07
- Files: src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx
- Legacy: API load error shown or Failed to load students or attendance. (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:153-161`)
- Expected fix: Add scoped roster error state and Retry with old fallback wording

## G2-16-003-023 [P1] GAP facet F06
- Files: src/components/tracker/tracker-workflow-panel.tsx
- Legacy: `[issueId].js:115-127`: status dropdown change instantly POST/PATCH status, disables while saving.
- Expected fix: Commit status selection immediately using dedicated action with toast; keep CAS and prevent stale writes.

## G2-16-005-043 [P1] GAP facet F10
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `SuperAdminLogsController.java:120-152`; `LogsDownloadControl.jsx:56-82`: server NDJSON date-range export to 31 days, chunked safely.
- Expected fix: Port NDJSON export with explicit from/to, chunked non-truncating retrieval and metadata trailer.

## G2-16-005-073 [P1] GAP facet F19
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `logs.js:421-440`: optional 30sec interval and on-visible refresh; no polling when detail open.
- Expected fix: Implement optional timed refresh and hidden-tab pause.

## G2-16-012-023 [P1] GAP facet F10
- Files: src/modules/operations/postgres-scheduled-job-lease-store.ts
- Legacy: SchedulerLockService.java:76-92 direct JDBC SQL on scheduled_job_lock.
- Expected fix: Register physical Postgres migration, wire adapter and prove concurrency against real DB.

## G2-16-012-043 [P1] GAP facet F21
- Files: src/modules/operations/postgres-scheduled-job-lease-store.ts
- Legacy: SchedulerLockService.java:36-39 optional JDBC dependency.
- Expected fix: Ensure deployed runner has DB connectivity and migration before enabling cron.

## G2-19-004-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/learn/my-placements/schedule/page.tsx
- Legacy: Old page merges rounds, historical interviews, and direct vendor tests `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:70-112`
- Expected fix: Union historical interviews and standalone legacy assessments without duplicate slots.

## G2-19-014-043 [P1] GAP facet F21
- Files: scripts/sql/db10-sms-delivery-attempts-staging.sql, src/modules/notifications/exotel-sms.ts
- Legacy: Legacy JpaRepository + `@Query` support reads `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:6-12` `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/SmsDeliveryLogRepository.java:18-24`
- Expected fix: Create typed Drizzle repository and admin reader.

## G2-19-001-033 [P1] GAP facet F06
- Files: src/components/college/college-person-edit-action.tsx
- Legacy: Legacy cancel edited form invokes unsaved-changes discard confirmation `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:702-715`
- Expected fix: Track dirty state and render matching `Discard student edits?` confirmation.

## G2-15-030-063 [P1] GAP facet F19
- Files: (none, new feature)
- Legacy: L:558-561 table pagination pageSize10
- Expected fix: Add server-side or bounded client pagination.

## G2-4-005-033 [P1] GAP facet F10
- Files: src/components/college/college-faculty-assignment-actions.tsx
- Legacy: Deletion and deactivation are distinct Java endpoints. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:319-337;docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:14-18`)
- Expected fix: Decide hard-delete vs soft-end and preserve parity.

## G2-4-032-063 [P1] MISSING facet F19
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: release scheduled in batches200 per minute (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:79-111`)
- Expected fix: Implement bounded release worker and indexes.

## G2-4-033-053 [P1] GAP facet F22
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: Legacy SMS persisted delivery log on missing job DLT `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:96-100`
- Expected fix: Compare SmsDeliveryLog schema to durable provider attempts with exact status/attempt metadata.

## G2-5-032-003 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: TPO 10 scheduled entry methods live inside backend container. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:42-73`
- Expected fix: Inventory all ten TPO calls and bind to production dispatcher.

## G2-5-032-013 [P1] GAP facet F06
- Files: src/modules/operations/scheduled-job-lease.ts, src/modules/operations/scheduled-job-runner.ts
- Legacy: Legacy daily deadlineToday cron 08:00 Asia/Kolkata, lease30m. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:42-43`
- Expected fix: Schedule 08:00 IST using TZ-aware cron and 30m lease.

## G2-5-032-043 [P1] GAP facet F13
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: Legacy no due notifications returns no effect; individual failures persist FAILED/SCHEDULED. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:107-154`
- Expected fix: Show stalled queue as unavailable, not zero recipients.

## G2-5-032-063 [P1] GAP facet F21
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: Legacy scheduled announcement uses backend DB worker, no external cloud scheduler. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:189-197`
- Expected fix: Document deployment, IAM token and retry cadence.

## G2-17-031-053 [P1] GAP facet F21
- Files: (none, new feature)
- Legacy: LBE/controller/AdminProjectController.java:79-137 team generation and reconciliation and 198-242 bulk.
- Expected fix: Lock learner group roster through creation, compare batch promotion/revert callbacks.

## G2-7-017-073 [P1] GAP facet F19
- Files: (none, new feature)
- Legacy: LFE/components/admin/projects/workspaceRowMeta.jsx:50,85-86,134-137 20-row client page and filter before slicing
- Expected fix: Paginate/virtualize large rosters, preserve 20 default
