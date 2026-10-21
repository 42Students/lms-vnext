# Work packet: edit src/components/tracker/tracker-live-logs-explorer.tsx (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u005-tracker-logs.md

## G2-16-005-010  [P1] MISSING  facet F03  effort M
- Legacy: `logs.js:619-622`: Group similar toggle default ON, Auto-refresh 30s toggle default OFF.
- vNext now: `tracker-live-logs-explorer.tsx:164-184`: neither toggle offered.
- Fix: Add grouping switch and 30-second auto-refresh with hidden-tab pause.

## G2-16-005-014  [P1] GAP  facet F04  effort M
- Legacy: `logs.js:54-71`: env PRODUCTION, DEVELOPMENT, UAT; windows 15M/1H/6H/24H/7D; levels WARNING/ERROR/INFO/ALL.
- vNext now: `tracker-live-logs-explorer.tsx:165-175`: windows omit 7D; severities ERROR/WARNING only, env in upper tabs.
- Fix: Add 7 days and Info/All levels; maintain same visible label order.

## G2-16-005-015  [P1] GAP  facet F04  effort S
- Legacy: `logs.js:122-127`: defaults PRODUCTION, 1H, WARNING, grouped true, autoRefresh false.
- vNext now: `tracker/logs/page.tsx:32-33`; `tracker-live-logs-explorer.tsx:48-54`: PRODUCTION, 60m, ERROR, no grouping/auto.
- Fix: Set severity default WARNING and group on; retain 1h default and auto off.

## G2-16-005-017  [P1] GAP  facet F04  effort L
- Legacy: `logs.js:682-711`: log row message, logger, exception Stack marker, counts/users, endpoint, time, status/pod/requestId.
- vNext now: `tracker-live-logs-explorer.tsx:196-221`: time/event/path headline, message, ref/component only.
- Fix: Expose permitted logger, stack marker, HTTP status/duration, pod/deploy/request metadata in rich cards.

## G2-16-005-021  [P1] GAP  facet F05  effort M
- Legacy: `logs.js:736-742`: load older with anchored page token, merge dedupes rows.
- vNext now: `tracker-live-logs-explorer.tsx:70-85,224-226`: older with page token merge by id but no snapshot anchor.
- Fix: Retain queriedAt anchor across pagination, prevent cross-refresh duplicates/missing records.

## G2-16-005-026  [P1] MISSING  facet F06  effort M
- Legacy: `logs.js:421-440`: auto-refresh 30s when visible; pauses while detail drawer open, refreshes on visibility.
- vNext now: `tracker-live-logs-explorer.tsx:48-101`: only initial load plus manual refresh, no interval.
- Fix: Restore 30s optional interval, page visibility and detail-open pause.

## G2-16-005-027  [P1] GAP  facet F06  effort M
- Legacy: `logs.js:266-309`: manual refresh newer preserves older pages; merges if older loaded.
- vNext now: `tracker-live-logs-explorer.tsx:70-85`: fresh refresh overwrites list even after pagination.
- Fix: Preserve anchored previously loaded older entries on refresh and update top without losing history.

## G2-16-005-028  [P1] GAP  facet F06  effort L
- Legacy: `logs.js:350-417`: ?insertId&logName&env permalink opens selected full detail regardless of visible window.
- vNext now: `tracker-live-logs-explorer.tsx:205-209`: copies `?query=<requestId/event>` and no direct detail permalink.
- Fix: Restore stable per-entry insertId/logName/env deep linking and direct detail fetch.

## G2-16-005-031  [P1] MISSING  facet F07  effort M
- Legacy: `LogsDownloadControl.jsx:40-48`: range errors start/end missing, reversed, >31 days, future.
- vNext now: `tracker-live-logs-explorer.tsx:115-134`: no custom date range UI nor matching validations.
- Fix: Implement RangePicker and 31-day bound with exact errors.

## G2-16-005-041  [P1] GAP  facet F10  effort L
- Legacy: `SuperAdminLogsService.js:3-10`; `SuperAdminLogsController.java:56-65`: POST `/query` + `/detail` with bearer/tenant and no-store.
- vNext now: `tracker-live-logs-explorer.tsx:65-69`: GET `/api/tracker/live-logs` only, no detail endpoint in UI.
- Fix: Implement authorized single-entry detail read and support legacy deep links.

## G2-16-005-043  [P1] GAP  facet F10  effort L
- Legacy: `SuperAdminLogsController.java:120-152`; `LogsDownloadControl.jsx:56-82`: server NDJSON date-range export to 31 days, chunked safely.
- vNext now: `tracker-live-logs-explorer.tsx:115-133`: paged GET capped ~240 entries, locally generated CSV or markdown.
- Fix: Port NDJSON export with explicit from/to, chunked non-truncating retrieval and metadata trailer.

## G2-16-005-047  [P1] GAP  facet F11  effort L
- Legacy: `TrackerLogDetailsDrawer.jsx:153-246`: raw sanitized log and SQL can include user/college metadata for manager.
- vNext now: `tracker-live-logs-explorer.tsx:24-46,196-221`: redacted fields only; raw samples/user IDs unavailable.
- Fix: Keep data least privilege, but provide privacy-safe diagnostic fields needed for equivalent triage.

## G2-16-005-048  [P1] GAP  facet F12  effort M
- Legacy: `logs.js:122-127`: initial filter severity WARNING, group=true, live query 50.
- vNext now: `tracker-live-logs-explorer.tsx:48-53,65-69`: severity ERROR, no groups; user receives fewer visible entries.
- Fix: Restore warning-level default and grouping.

## G2-16-005-049  [P1] GAP  facet F12  effort M
- Legacy: `logs.js:310-341`: older query reuses pagination anchor and merges de-duplicated.
- vNext now: `tracker-live-logs-explorer.tsx:70-85`: pageToken only, no anchor.
- Fix: Capture query anchor for stable older pagination.

## G2-16-005-055  [P1] GAP  facet F13  effort M
- Legacy: `logs.js:218,255-259`: HTTP 429 auto-refresh stops, static rate limit notice.
- vNext now: `tracker-live-logs-explorer.tsx:82-84`: on any error generic notice; auto-refresh not implemented.
- Fix: Pause future polling on 429 and show explicit rate-limit guidance.

## G2-16-005-056  [P1] GAP  facet F14  effort L
- Legacy: `LogsDownloadControl.jsx:102-170`: export popover quick ranges + precise timestamp RangePicker, NDJSON filename.
- vNext now: `tracker-live-logs-explorer.tsx:185-194,115-133`: collapsed export controls, no precise range, local CSV/markdown.
- Fix: Restore NDJSON time-range export with 31-day max and exact filename.

## G2-16-005-073  [P1] GAP  facet F19  effort M
- Legacy: `logs.js:421-440`: optional 30sec interval and on-visible refresh; no polling when detail open.
- vNext now: `tracker-live-logs-explorer.tsx:48-85`: manual-only, nonpolling.
- Fix: Implement optional timed refresh and hidden-tab pause.

## G2-16-005-075  [P1] GAP  facet F20  effort M
- Legacy: `logs.js:221-262,266-341`: generationRef/AbortControllers avoid stale response overwrite during filter changes.
- vNext now: `tracker-live-logs-explorer.tsx:70-85`: locked flag serializes requests; changing filter while pending suppresses load, prior response may populate wrong filter rows.
- Fix: Use generation IDs/AbortController and ignore responses for stale filters.

## G2-16-005-079  [P1] GAP  facet F21  effort L
- Legacy: `SuperAdminLogsController.java:56-65,120-152`: Google Cloud Logging query/detail/export backend and GCP metadata auth.
- vNext now: `tracker-live-logs-explorer.tsx:65-69`; log-alert readiness: indirect `/api/tracker/live-logs`, may show unconfigured.
- Fix: Verify live GCP logging endpoint parity, implement detailed query and output statuses.

## G2-16-005-086  [P1] MISSING  facet F23  effort M
- Legacy: `logs.js:54-71`: 7D/INFO/ALL selectable; group and auto refresh.
- vNext now: `tracker-live-logs-explorer.tsx:165-183`: fewer filter choices and switches absent.
- Fix: Port full filter affordances and grouping.
