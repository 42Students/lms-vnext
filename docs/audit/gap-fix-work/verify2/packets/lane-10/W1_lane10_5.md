# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-16-005-010 [P1] MISSING facet F03
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `logs.js:619-622`: Group similar toggle default ON, Auto-refresh 30s toggle default OFF.
- Expected fix: Add grouping switch and 30-second auto-refresh with hidden-tab pause.

## G2-16-005-014 [P1] GAP facet F04
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `logs.js:54-71`: env PRODUCTION, DEVELOPMENT, UAT; windows 15M/1H/6H/24H/7D; levels WARNING/ERROR/INFO/ALL.
- Expected fix: Add 7 days and Info/All levels; maintain same visible label order.

## G2-16-005-015 [P1] GAP facet F04
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/app/(authenticated)/tracker/logs/page.tsx, src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `logs.js:122-127`: defaults PRODUCTION, 1H, WARNING, grouped true, autoRefresh false.
- Expected fix: Set severity default WARNING and group on; retain 1h default and auto off.

## G2-16-005-017 [P1] GAP facet F04
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `logs.js:682-711`: log row message, logger, exception Stack marker, counts/users, endpoint, time, status/pod/requestId.
- Expected fix: Expose permitted logger, stack marker, HTTP status/duration, pod/deploy/request metadata in rich cards.

## G2-16-005-021 [P1] GAP facet F05
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `logs.js:736-742`: load older with anchored page token, merge dedupes rows.
- Expected fix: Retain queriedAt anchor across pagination, prevent cross-refresh duplicates/missing records.

## G2-16-005-026 [P1] MISSING facet F06
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `logs.js:421-440`: auto-refresh 30s when visible; pauses while detail drawer open, refreshes on visibility.
- Expected fix: Restore 30s optional interval, page visibility and detail-open pause.

## G2-16-005-027 [P1] GAP facet F06
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `logs.js:266-309`: manual refresh newer preserves older pages; merges if older loaded.
- Expected fix: Preserve anchored previously loaded older entries on refresh and update top without losing history.

## G2-16-005-028 [P1] GAP facet F06
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `logs.js:350-417`: ?insertId&logName&env permalink opens selected full detail regardless of visible window.
- Expected fix: Restore stable per-entry insertId/logName/env deep linking and direct detail fetch.

## G2-16-005-031 [P1] MISSING facet F07
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `LogsDownloadControl.jsx:40-48`: range errors start/end missing, reversed, >31 days, future.
- Expected fix: Implement RangePicker and 31-day bound with exact errors.

## G2-16-005-041 [P1] GAP facet F10
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `SuperAdminLogsService.js:3-10`; `SuperAdminLogsController.java:56-65`: POST `/query` + `/detail` with bearer/tenant and no-store.
- Expected fix: Implement authorized single-entry detail read and support legacy deep links.

## G2-16-005-042 [P1] GAP facet F10
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/known-errors-workspace.tsx
- Legacy: `SuperAdminLogsController.java:68-84`: GET status and POST mark-viewed on successful first query.
- Expected fix: Mark viewing after first successful current query, while preserving before-query lastViewedAt for counts.

## G2-16-005-047 [P1] GAP facet F11
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `TrackerLogDetailsDrawer.jsx:153-246`: raw sanitized log and SQL can include user/college metadata for manager.
- Expected fix: Keep data least privilege, but provide privacy-safe diagnostic fields needed for equivalent triage.

## G2-16-005-048 [P1] GAP facet F12
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `logs.js:122-127`: initial filter severity WARNING, group=true, live query 50.
- Expected fix: Restore warning-level default and grouping.

## G2-16-005-049 [P1] GAP facet F12
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `logs.js:310-341`: older query reuses pagination anchor and merges de-duplicated.
- Expected fix: Capture query anchor for stable older pagination.

## G2-16-005-055 [P1] GAP facet F13
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `logs.js:218,255-259`: HTTP 429 auto-refresh stops, static rate limit notice.
- Expected fix: Pause future polling on 429 and show explicit rate-limit guidance.

## G2-16-005-056 [P1] GAP facet F14
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `LogsDownloadControl.jsx:102-170`: export popover quick ranges + precise timestamp RangePicker, NDJSON filename.
- Expected fix: Restore NDJSON time-range export with 31-day max and exact filename.

## G2-16-005-075 [P1] GAP facet F20
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `logs.js:221-262,266-341`: generationRef/AbortControllers avoid stale response overwrite during filter changes.
- Expected fix: Use generation IDs/AbortController and ignore responses for stale filters.

## G2-16-005-079 [P1] GAP facet F21
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `SuperAdminLogsController.java:56-65,120-152`: Google Cloud Logging query/detail/export backend and GCP metadata auth.
- Expected fix: Verify live GCP logging endpoint parity, implement detailed query and output statuses.

## G2-16-005-086 [P1] MISSING facet F23
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/components/tracker/tracker-live-logs-explorer.tsx
- Legacy: `logs.js:54-71`: 7D/INFO/ALL selectable; group and auto refresh.
- Expected fix: Port full filter affordances and grouping.

## G2-16-011-004 [P1] GAP facet F02
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/modules/operations/outbound-delivery-queue.ts
- Legacy: NotificationSchedulerService.java:79-80 RELEASE_BATCH_SIZE=200, rows released independently.
- Expected fix: Add bounded persisted due notification batch and per-row independent updates.

## G2-16-011-006 [P1] MISSING facet F03
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:182-185 interview reminder 7pm IST.
- Expected fix: Schedule interview reminder at 19:00 Asia/Kolkata.

## G2-16-011-007 [P1] MISSING facet F03
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:285-288 assignment reminders default daily 09:00 JVM zone.
- Expected fix: Schedule assignment+quiz reminder with explicit agreed IST wall clock.

## G2-16-011-009 [P1] MISSING facet F04
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/modules/operations/outbound-delivery-envelope.ts
- Legacy: NotificationSchedulerService.java:427-456 reminder variables learnerName/assignmentName/contentType/dueDate/courseSlug/name.
- Expected fix: Build legacy compatible template data mapper, IST date formatting.

## G2-16-011-010 [P1] MISSING facet F04
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/modules/operations/outbound-delivery-envelope.ts
- Legacy: NotificationSchedulerService.java:357-384 interview variables applicationId/roundName/time/location.
- Expected fix: Build interview reminder payload with required applicationId.

## G2-16-011-011 [P1] MISSING facet F05
- Verification: DEFERRED — requires targeted implementation and integration review; no verified safe fix in this pass.
- Files: src/modules/operations/scheduled-job-runner.ts
- Legacy: NotificationSchedulerService.java:187-200 tomorrow in India mapped to UTC half-open full-day window.
- Expected fix: Use IST date-boundary conversion, exclusive upper bound.
