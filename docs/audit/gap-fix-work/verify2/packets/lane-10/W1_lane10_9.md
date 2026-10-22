# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-4-005-028 [P1] GAP facet F09
- Files: src/components/college/college-faculty-reassign-action.tsx
- Legacy: Edit modal width500, Save Changes, faculty/course title and all fields editable. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:516-598`)
- Expected fix: Build full edit modal for course/class/semester/year/role/isActive.

## G2-4-005-031 [P1] GAP facet F10
- Files: src/components/college/college-faculty-assignment-actions.tsx
- Legacy: Create POST create/createBulk sends explicit year, semester, class, batch. (`docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:5-9;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:206-223`)
- Expected fix: Preserve year/semester selection in data contract.

## G2-4-005-032 [P1] GAP facet F10
- Files: src/components/college/college-faculty-reassign-action.tsx, src/components/college/college-faculty-assignment-actions.tsx
- Legacy: Edit PUT update/id accepts complete assignment fields. (`docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:11-12;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:270-284`)
- Expected fix: Restore complete edit mutation.

## G2-4-005-054 [P1] GAP facet F20
- Files: src/components/college/college-faculty-assignment-actions.tsx
- Legacy: Legacy supports historical/future custom academic years. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:27-39;docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:443-446`)
- Expected fix: Allow free year entry.

## G2-4-005-055 [P1] GAP facet F20
- Files: src/components/college/college-faculty-reassign-action.tsx
- Legacy: Legacy can simultaneously change faculty/course/class/semester/role. (`docs/legacy-source/frontend/src/pages/superadmin/sections/FacultyAssignment.js:259-284`)
- Expected fix: Restore full edit fields.

## G2-4-005-060 [P1] GAP facet F22
- Files: src/components/college/college-faculty-assignment-actions.tsx
- Legacy: Legacy delete versus soft-deactivate distinct. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyTeachingAssignmentController.java:159-190`)
- Expected fix: Document deletion mapping.

## G2-4-014-014 [P1] GAP facet F04
- Files: src/app/(authenticated)/admin/colleges/page.tsx
- Legacy: Searchable text includes name, uniqueId, city, state, country, address1, address2 and landmark. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/colleges/CollegeSearchDTO.java:45-59`)
- Expected fix: Restore state/country/address/landmark search predicates.

## G2-4-032-006 [P1] MISSING facet F02
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: Scheduled notifications hidden until release (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:86-104`)
- Expected fix: Implement timed in-app publication worker or explicitly drop scheduled notices.

## G2-4-032-031 [P1] MISSING facet F10
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: Student emails urgent interview/system only; TRAI SMS selected job statuses (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:50-70`)
- Expected fix: Wire per-event email/SMS channels to approved provider templates and owner policy.

## G2-4-032-042 [P1] GAP facet F12
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: Offer/Hired and interview cancel/reschedule in-app only, no provider templates (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:42-49`)
- Expected fix: Ensure offer/hired/cancel/reschedule at least in-app; don't invent unsupported emails.

## G2-4-032-050 [P1] MISSING facet F15
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: Explicit urgent EMAIL_EVENTS 6, TRAI_SMS_EVENTS 6, in-app job/course15 (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:50-70`)
- Expected fix: Build event-by-event parity table and live provider sends, suppression, timing.

## G2-4-032-069 [P1] GAP facet F21
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: Central in-app/Zepto/TRAI routing (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:23-50`)
- Expected fix: Centralize supported provider send and durable receipts while honoring dev safety.

## G2-4-032-070 [P1] MISSING facet F21
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: Background send-later release with failure record (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java:102-155`)
- Expected fix: Add scheduled worker and per-message retry/failed audit.

## G2-4-033-008 [P1] GAP facet F04
- Files: src/modules/notifications/exotel-sms.ts
- Legacy: Legacy uses `SmsDeliveryLog` for SMS purpose/status/provider reference `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:3-4`; records missing DLT `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:96-100`
- Expected fix: Provide privacy-safe provider attempt ledger for OTP and all message categories.

## G2-4-033-009 [P1] GAP facet F04
- Files: src/modules/notifications/exotel-sms.ts, src/modules/messaging/providers.ts
- Legacy: Legacy sender configuration has job, notification and OTP IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ExotelSmsServiceImpl.java:58-73`
- Expected fix: Inventory/validate each non-OTP DLT template and global override before live release.

## G2-4-033-044 [P1] GAP facet F19
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: Legacy dispatcher synchronous mail retries inside event dispatch `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:123-148`
- Expected fix: Enable durable sender and bounded retries before production bulk email/SMS.

## G2-12-010-037 [P1] GAP facet F19
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: Legacy outbound retry may sleep via dispatcher `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:47-51`
- Expected fix: Implement verified sender worker, backoff, queue control and dead-letter count.

## G2-12-010-042 [P1] GAP facet F21
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: Legacy notes mail/SMS blocking timeouts in batch `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:47-55`
- Expected fix: Add worker out-of-band dispatch with delivery receipts and monitoring.

## G2-12-024-007 [P1] GAP facet F04
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: Export meta environment/since/until/count/truncated `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:129-135`
- Expected fix: Include explicit range and truncation metadata.

## G2-12-024-008 [P1] GAP facet F05
- Files: src/app/api/tracker/live-logs/route.ts
- Legacy: Query fields environment/window/level/search/pageToken/anchor/size `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/GcpLogQueryRequest.java:8-15`
- Expected fix: Support historical anchor, environment and size safely.

## G2-12-024-018 [P1] GAP facet F10
- Files: src/app/api/tracker/live-logs/route.ts
- Legacy: POST query and POST detail `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:56-66`
- Expected fix: Port safe detail with request filters and validation.

## G2-12-024-019 [P1] GAP facet F10
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: POST export yields NDJSON and _meta terminal row `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:120-151`
- Expected fix: Implement bounded NDJSON explicit-range streaming or compatible metadata-rich export.

## G2-12-024-020 [P1] MISSING facet F10
- Files: src/app/api/tracker/live-logs/route.ts
- Legacy: GET deploys, POST deploys/health `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:201-219`
- Expected fix: Restore deploy health and regression comparison.

## G2-12-024-034 [P1] GAP facet F19
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: Legacy 100-page export upper ceiling `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/GcpCloudLoggingService.java:57-61`
- Expected fix: Guarantee explicit truncation and bounded completeness.

## G2-12-024-040 [P1] GAP facet F22
- Files: src/app/api/tracker/logs/known-errors/route.ts
- Legacy: Legacy service persists known errors, viewed marker `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:37-42`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:68-84`
- Expected fix: Promote DB10 migrations and validate live persistence.
