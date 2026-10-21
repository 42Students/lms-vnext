# Work packet (wave 2): edit src/components/tracker/tracker-live-logs-explorer.tsx

35 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u005-tracker-logs.md, docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md

## G2-16-005-006  [P2] GAP  facet F02  effort L
- Legacy: `logs.js:657-734`: rich log card list with deploy separators and grouped signatures.
- vNext now: `tracker-live-logs-explorer.tsx:196-223`: simple divided rows with Disclosure per entry, no deploy separator.
- Fix: Restore rich cards, deploy separators and signature groups.

## G2-16-005-007  [P2] GAP  facet F02  effort L
- Legacy: `logs.js:745-765`: Log details drawer, Known errors drawer, Claude report modal and digest drawer.
- vNext now: `tracker-live-logs-explorer.tsx:227-249`; `tracker/logs/page.tsx:89-109`: mute confirm, report dialog; known errors always in page, no log detail/digest drawers.
- Fix: Restore dedicated detail/known-error/digest overlays and original hierarchy.

## G2-16-005-008  [P2] GAP  facet F03  effort M
- Legacy: `logs.js:561-575`: top actions Report for Claude, Download logs, More menu.
- vNext now: `tracker-live-logs-explorer.tsx:185-194`: actions inside collapsed Export and report tools; Telegram actions separate.
- Fix: Surface three actions next to Logs title; preserve secondary menus.

## G2-16-005-009  [P2] GAP  facet F03  effort M
- Legacy: `logs.js:600-603`: Segmented environment and two selects (time window, minimum severity).
- vNext now: `tracker/logs/page.tsx:84-87`; `tracker-live-logs-explorer.tsx:164-175`: env separate top tabs; time/severity in accordion.
- Fix: Use one Segmented env control and adjacent two selects inside same filterbar.

## G2-16-005-011  [P2] GAP  facet F03  effort S
- Legacy: `logs.js:605-616`: text search with Run query and separate Refresh newer button.
- vNext now: `tracker-live-logs-explorer.tsx:177-183`: Search this page plus Refresh newer only; no Run query.
- Fix: Separate query submission and refresh semantics and exact button copy.

## G2-16-005-012  [P2] MISSING  facet F03  effort M
- Legacy: `logs.js:633-640`: summary `N events shown`, More available, namespace, Updated freshness, Stale tag.
- vNext now: `tracker-live-logs-explorer.tsx:155-163,195`: shows configured status and notices; no summary strip.
- Fix: Build summary strip with counts, namespace, freshness and stale state.

## G2-16-005-018  [P2] GAP  facet F04  effort S
- Legacy: `logs.js:74-85`: timestamp locale day/month/hour/minute/second, missing `Unknown time`.
- vNext now: `tracker-live-logs-explorer.tsx:199-201`: Intl en-IN full date/time, missing fallback may render invalid.
- Fix: Use short legacy timestamp with seconds, Unknown time fallback; validate invalid values.

## G2-16-005-019  [P2] GAP  facet F05  effort M
- Legacy: `logs.js:208-215`: query payload environment/window/level/search/size50.
- vNext now: `tracker-live-logs-explorer.tsx:65-69`: query windowMinutes/minimumSeverity/query, backend page unspecified limit.
- Fix: Normalize old option semantics and enforce 50 page records; adapt GET backend safely.

## G2-16-005-022  [P2] GAP  facet F05  effort M
- Legacy: `GcpCloudLoggingService.java:45-55,114-126`: namespaced PRODUCTION/DEVELOPMENT/UAT and 7-day supported filters.
- vNext now: `tracker/logs/page.tsx:84-87`; `tracker-live-logs-explorer.tsx:165-175`: env tabs and max24h live window.
- Fix: Wire full source namespace and 7-day filter with bounded server limits.

## G2-16-005-024  [P2] GAP  facet F06  effort M
- Legacy: `logs.js:35-52,121-125,162-164`: loads/saves env/window/level in `42tracker_logs_filters_v1`.
- vNext now: `tracker-live-logs-explorer.tsx:48-53`; `tracker/logs/page.tsx:31-34`: env from URL, window/severity default each visit, no localStorage.
- Fix: Restore saved env/window/level in localStorage with safe migration to URL defaults.

## G2-16-005-025  [P2] GAP  facet F06  effort S
- Legacy: `logs.js:489-497`: search only applies on submit; unchanged query retriggers load.
- vNext now: `tracker-live-logs-explorer.tsx:70-85,177-183`: refresh button applies current input, no separate submit.
- Fix: Implement explicit Run query and separate Refresh preserving applied search.

## G2-16-005-040  [P2] GAP  facet F09  effort M
- Legacy: `logs.js:763-764`: ClaudeReportModal + LogDigestDrawer invoked on separate actions.
- vNext now: `tracker-live-logs-explorer.tsx:238-248`; `tracker-telegram-manual-panel.tsx:65-89`: compact report Dialog and Telegram digest Dialog.
- Fix: Match modal title, payload preview and digest drawer interactions.

## G2-16-005-050  [P2] GAP  facet F12  effort M
- Legacy: `logs.js:343-381`: selected log must have insertId/logName; otherwise detail error `Full detail is unavailable ...`.
- vNext now: `tracker-live-logs-explorer.tsx:196-221`: every log has local disclosure by id with no provider key.
- Fix: Preserve missing-provider-ID error and fallback, don't fabricate permalink.

## G2-16-005-051  [P2] GAP  facet F12  effort M
- Legacy: `GcpCloudLoggingService.java:114-125`: env maps fixed GCP Kubernetes namespaces; window 7D server-supported.
- vNext now: `tracker-live-logs-explorer.tsx:165-175`: 24h ceiling in UI; backend adapter configuration unknown.
- Fix: Compare backend namespace mapping before enabling old env values; expose 7D.

## G2-16-005-052  [P2] GAP  facet F13  effort S
- Legacy: `logs.js:657-663`: initial three-card skeleton during query.
- vNext now: `tracker-live-logs-explorer.tsx:86-101,195-223`: silently fetches on mount and immediately renders `No live errors loaded`.
- Fix: Show loading skeleton until first query resolves, avoid false empty-state flash.

## G2-16-005-054  [P2] GAP  facet F13  effort S
- Legacy: `logs.js:642-655`: stale results banner and `Retry` action after refresh failed.
- vNext now: `tracker-live-logs-explorer.tsx:80-84,195`: retains previous rows but notice only, no stale tag or Retry.
- Fix: Mark stale rows, retain lastSuccessAt and show retry button.

## G2-16-005-058  [P2] GAP  facet F14  effort M
- Legacy: `LogsDownloadControl.jsx:65-88`: chunked export warns explicitly when truncated.
- vNext now: `tracker-live-logs-explorer.tsx:119-132`: caps first pages and warns but format/count differs.
- Fix: Preserve explicit truncation metadata and last-export cutoff across chunk ranges.

## G2-16-005-063  [P2] MISSING  facet F16  effort M
- Legacy: `TrackerLogDetailsDrawer.jsx:102-110`: right 760px drawer full width on mobile.
- vNext now: `tracker-live-logs-explorer.tsx:196-222`: inline disclosure; no drawer on any viewport.
- Fix: Implement right-side drawer at desktop and 100vw mobile with focus return.

## G2-16-005-064  [P2] GAP  facet F17  effort M
- Legacy: `logs.js:657-685`: each card is button and aria-live/busy list, keyboard accessible.
- vNext now: `tracker-live-logs-explorer.tsx:196-222`: Disclosure summary keyboard accessible but semantics differ.
- Fix: Maintain entry button/keyboard and return focus from detail drawer.

## G2-16-005-065  [P2] GAP  facet F17  effort M
- Legacy: `logs.js:745-753`; `TrackerLogDetailsDrawer.jsx:101-109`: modal drawer focus trap/Escape, accessible action buttons.
- vNext now: `tracker-live-logs-explorer.tsx:227-249`: generic ConfirmDialog/Dialog but no detail drawer.
- Fix: Restore accessible detail modal, focus lock, Escape and clean URL close.

## G2-16-005-066  [P2] MISSING  facet F17  effort S
- Legacy: `logs.js:619-627`: switch labels Group similar/Auto-refresh 30s.
- vNext now: `tracker-live-logs-explorer.tsx:164-184`: no switches.
- Fix: Add labelled switches with status announcement for auto-refresh.

## G2-16-005-072  [P2] GAP  facet F19  effort M
- Legacy: `logs.js:208-215,243-263`: API request 50, anchor saved and abortable.
- vNext now: `tracker-live-logs-explorer.tsx:65-101`: GET, no explicit limit and limited abort only first load.
- Fix: Use 50/page, abort stale filter queries, retain anchored pagination.

## G2-16-005-074  [P2] GAP  facet F19  effort L
- Legacy: `GcpCloudLoggingService.java:57-64`: export up to 31 days and bounded pages/server truncation.
- vNext now: `tracker-live-logs-explorer.tsx:115-132`: client capped by 20 pages and no date-based chunking.
- Fix: Bound and page full explicit date range, report truncation cleanly.

## G2-16-005-076  [P2] MISSING  facet F20  effort M
- Legacy: `logs.js:396-419`: permalink effect avoids closing drawer during environment switch via skipNextCloseDetailRef.
- vNext now: `tracker-live-logs-explorer.tsx:205-209`: only query text permalinks, no exact-entry detail.
- Fix: Add stable insertId/logName/env permalink restoration and avoid premature close.

## G2-16-005-077  [P2] GAP  facet F20  effort S
- Legacy: `TrackerLogDetailsDrawer.jsx:73-99`: only ERROR+ tracked signatures can mute; warning/info button absent.
- vNext now: `tracker-live-logs-explorer.tsx:210-217`: mute displayed whenever knownErrorId present regardless of severity, backend validates status.
- Fix: Hide mute control for nontracked below-ERROR logs and handle unknown signature safely.

## G2-12-024-028  [P2] GAP  facet F14  effort M
- Legacy: Download lms-logs_ENV_since_to.ndjson, application/x-ndjson `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:137-151`
- vNext now: New tracker-logs.csv and tracker-logs-for-claude.md `src/components/tracker/tracker-live-logs-explorer.tsx:106-113`
- Fix: Offer NDJSON with timestamp range and truncation.

## G2-12-024-033  [P2] GAP  facet F18  effort M
- Legacy: Legacy query/tool action names (known-errors, export, digest, deploys) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:94-235`
- vNext now: New 'Known errors' and 'Live Google Cloud Logging' `src/app/(authenticated)/tracker/logs/page.tsx:36-44`; `src/components/tracker/tracker-live-logs-explorer.tsx:157-160`
- Fix: Align headings with legacy page copy.

## G2-12-024-036  [P2] GAP  facet F20  effort M
- Legacy: Legacy serializes each line with fallback if one fails `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:154-159`
- vNext now: New CSV markdown text export `src/components/tracker/tracker-live-logs-explorer.tsx:24-46`
- Fix: Protect CSV injection, multiline sanitization, truncation.

## G2-16-005-016  [P3] GAP  facet F04  effort S
- Legacy: `logs.js:611`: placeholder `Search logs, then run query…`, maxLength 200.
- vNext now: `tracker-live-logs-explorer.tsx:178-179`: `Message, route, reference`, maxLength 150.
- Fix: Restore placeholder and 200-character cap.

## G2-16-005-023  [P3] GAP  facet F05  effort S
- Legacy: `logs.js:25,208-215`: live log search server search query over full entry.
- vNext now: `tracker-live-logs-explorer.tsx:177-183`: label `Search this page` but GET applied to server.
- Fix: Rename search label to accurate legacy `Search logs` and ensure server-wide query applies.

## G2-16-005-053  [P3] GAP  facet F13  effort S
- Legacy: `logs.js:725-731`: empty `No matching logs in this window.` or `No match in this segment. Continue searching older entries.`.
- vNext now: `tracker-live-logs-explorer.tsx:80-81,223`: `No live errors loaded` / `No matching errors in selected page and time window.`.
- Fix: Restore conditional empty text and distinguish active query from no request.

## G2-16-005-068  [P3] GAP  facet F18  effort S
- Legacy: `logs.js:600-616`: `Last 1 hour`, `Warnings + Errors`, `Run query`, `Refresh`.
- vNext now: `tracker-live-logs-explorer.tsx:165-183`: `Last hour`, `Error and above`, `Refresh newer`.
- Fix: Match exact option labels and buttons.

## G2-16-005-069  [P3] GAP  facet F18  effort S
- Legacy: `logs.js:611`: `Search logs, then run query…`.
- vNext now: `tracker-live-logs-explorer.tsx:179`: `Message, route, reference`.
- Fix: Change placeholder.

## G2-16-005-070  [P3] GAP  facet F18  effort S
- Legacy: `logs.js:739`: `Load older` and `Continue search` contextually.
- vNext now: `tracker-live-logs-explorer.tsx:224-226`: always `Load older`.
- Fix: Use `Continue search` when visible list empty but provider token remains.

## G2-16-005-071  [P3] GAP  facet F18  effort S
- Legacy: `TrackerLogDetailsDrawer.jsx:121-133`: `Copy link`, `Copy for Claude`, `Report this`, `Mute this error`.
- vNext now: `tracker-live-logs-explorer.tsx:203-219`: same actions except Open Known Errors, but no detail view.
- Fix: Restore details toolbar and match conditional action gating.
