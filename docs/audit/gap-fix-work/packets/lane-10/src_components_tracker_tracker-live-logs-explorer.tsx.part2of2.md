# Work packet: edit src/components/tracker/tracker-live-logs-explorer.tsx (part 2 of 2)

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md, docs/audit/gap2/lane-16/u005-tracker-logs.md

## G2-12-024-007  [P1] GAP  facet F04  effort M
- Legacy: Export meta environment/since/until/count/truncated `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:129-135`
- vNext now: New client CSV/MD has no equivalent metadata line `src/components/tracker/tracker-live-logs-explorer.tsx:102-132`
- Fix: Include explicit range and truncation metadata.

## G2-12-024-019  [P1] GAP  facet F10  effort M
- Legacy: POST export yields NDJSON and _meta terminal row `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:120-151`
- vNext now: Browser assembles CSV/markdown and stops at 240 `src/components/tracker/tracker-live-logs-explorer.tsx:115-132`
- Fix: Implement bounded NDJSON explicit-range streaming or compatible metadata-rich export.

## G2-12-024-034  [P1] GAP  facet F19  effort M
- Legacy: Legacy 100-page export upper ceiling `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/GcpCloudLoggingService.java:57-61`
- vNext now: New 240-entry client cap `src/components/tracker/tracker-live-logs-explorer.tsx:115-132`
- Fix: Guarantee explicit truncation and bounded completeness.

## G2-16-005-029  [P2] GAP  facet F07  effort S
- Legacy: `logs.js:107-115`: explicit 401/403/429/503/502 error wording; 429 disables auto refresh.
- vNext now: `tracker-live-logs-explorer.tsx:82-84,95-97`: generic FriendlyFetchError and `Live logs could not be loaded. Try again.`.
- Fix: Map legacy status-specific messages and avoid repeat on throttling.

## G2-16-005-030  [P2] GAP  facet F07  effort M
- Legacy: `logs.js:642-655`: error Alert with Retry; while old results displayed uses warning+stale text.
- vNext now: `tracker-live-logs-explorer.tsx:80-84,195`: inline notice; stale old results may remain but no Stale badge/retry action.
- Fix: Restore stale banner, Retry and last successful time.

## G2-16-005-032  [P2] MISSING  facet F07  effort M
- Legacy: `TrackerLogDetailsDrawer.jsx:143-150`: full log detail fetch failure warning but compact summary remains.
- vNext now: `tracker-live-logs-explorer.tsx:196-222`: local Disclosure no separate full detail fetch/fallback.
- Fix: Open drawer and show partial summary on failure plus retry.

## G2-16-005-034  [P3] GAP  facet F08  effort S
- Legacy: `TrackerLogDetailsDrawer.jsx:90-96`: mute toast `Muted -- this error type won't be surfaced as noise going forward.` or unmuted variant.
- vNext now: `tracker-live-logs-explorer.tsx:135-153`: generic inline `Known error muted/unmuted.`.
- Fix: Use exact status-specific feedback and 404 poller caveat.

## G2-16-005-036  [P3] GAP  facet F08  effort S
- Legacy: `LogsDownloadControl.jsx:84-99`: success/warning toasts include count and truncation message.
- vNext now: `tracker-live-logs-explorer.tsx:115-133`: inline downloaded count/no match/truncated notice.
- Fix: Restore toast message/wording on full/partial export.
