# Work packet (wave 2): edit src/app/(authenticated)/tracker/logs/page.tsx

30 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l18-u025-public-tracker-logs-access.md, docs/audit/gap2/lane-16/u005-tracker-logs.md, docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md, docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md

## G2-18-025-002  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/api/Services/TrackerLogsAccessService.js:7-9 — posts password alone and stores session
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:29-30 — login prerequisite, redirect /dashboard without SuperAdmin
- Fix: Implement authorized convenience workflow via standard SSO or named identity

## G2-18-025-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/tracker/TrackerLogsAccessGate.jsx:36-54 — standalone password gate: lock icon, Logs access title
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:39-44 — Known errors heading, authenticated panel
- Fix: Preserve safe visual entry explanation without password-only privilege escalation

## G2-18-025-004  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/components/tracker/TrackerLogsAccessGate.jsx:41-51 — Enter the password to view backend logs, Password placeholder, Unlock
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:46-69 — permission and runtime states rather than password form
- Fix: Document product copy change; direct named login CTA instead of unsupported secret

## G2-18-025-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/tracker/TrackerLogsAccessGate.jsx:39-41 — Logs access title and prompt
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:39-40 — Known errors title and longer description
- Fix: Match module title hierarchy only; do not resurrect insecure gate

## G2-18-025-006  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/components/tracker/TrackerLogsAccessGate.jsx:51-52 — Unlock primary action
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:23-30 — unauthorized redirect, no CTA on route
- Fix: Direct to normal sign-in rather than generic dashboard

## G2-18-025-029  [P2] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/tracker/TrackerLogsAccessGate.jsx:36-54 — password gate CSS tracker-logs-gate-wrap and AntD large controls
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:81-104 — Next PageHeader, disclosures and controls
- Fix: Compare permitted logs screen visual shell without copying login bypass

## G2-18-025-034  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTrackerLogsAccessController.java:67-68 — rate key derived client IP
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:29-30 — user-based role gate
- Fix: Verify sign-in rate limit behind reverse proxy and principal identity

## G2-16-005-002  [P2] GAP  facet F01  effort S
- Legacy: `logs.js:807-810`: document title `Logs · 42 Tracker`.
- vNext now: `tracker/logs/page.tsx:21-22`: no explicit metadata export for this route (inherits generic title).
- Fix: Export exact metadata title `Logs · 42 Tracker`.

## G2-16-005-007  [P2] GAP  facet F02  effort L
- Legacy: `logs.js:745-765`: Log details drawer, Known errors drawer, Claude report modal and digest drawer.
- vNext now: `tracker-live-logs-explorer.tsx:227-249`; `tracker/logs/page.tsx:89-109`: mute confirm, report dialog; known errors always in page, no log detail/digest drawers.
- Fix: Restore dedicated detail/known-error/digest overlays and original hierarchy.

## G2-16-005-009  [P2] GAP  facet F03  effort M
- Legacy: `logs.js:600-603`: Segmented environment and two selects (time window, minimum severity).
- vNext now: `tracker/logs/page.tsx:84-87`; `tracker-live-logs-explorer.tsx:164-175`: env separate top tabs; time/severity in accordion.
- Fix: Use one Segmented env control and adjacent two selects inside same filterbar.

## G2-16-005-013  [P2] GAP  facet F04  effort S
- Legacy: `logs.js:555-559`: `42 Logs`, `Logs`, `What the backend is telling us, and what to do about it.`
- vNext now: `tracker/logs/page.tsx:38-41`: `Known errors`, description about durable signatures and optional backup.
- Fix: Restore exact heading and description; Known errors gets subordinate title.

## G2-16-005-022  [P2] GAP  facet F05  effort M
- Legacy: `GcpCloudLoggingService.java:45-55,114-126`: namespaced PRODUCTION/DEVELOPMENT/UAT and 7-day supported filters.
- vNext now: `tracker/logs/page.tsx:84-87`; `tracker-live-logs-explorer.tsx:165-175`: env tabs and max24h live window.
- Fix: Wire full source namespace and 7-day filter with bounded server limits.

## G2-16-005-024  [P2] GAP  facet F06  effort M
- Legacy: `logs.js:35-52,121-125,162-164`: loads/saves env/window/level in `42tracker_logs_filters_v1`.
- vNext now: `tracker-live-logs-explorer.tsx:48-53`; `tracker/logs/page.tsx:31-34`: env from URL, window/severity default each visit, no localStorage.
- Fix: Restore saved env/window/level in localStorage with safe migration to URL defaults.

## G2-16-005-039  [P2] GAP  facet F09  effort M
- Legacy: `KnownErrorsDrawer.jsx` invoked `logs.js:756-761`: known errors overlay separate from Logs.
- vNext now: `tracker/logs/page.tsx:88`; `known-errors-workspace.tsx:232-280`: known errors list is top-level content.
- Fix: Restore drawer for known errors from More menu while preserving safe audit controls.

## G2-16-005-062  [P2] GAP  facet F16  effort M
- Legacy: `logs.js:550-640`: title/right actions, health cards, filters and toggles wrap.
- vNext now: `tracker/logs/page.tsx:81-109`: page nav/tabs/cards/accordion, live controls hidden at start.
- Fix: Visual 1280/768/375 comparison for header actions and first-screen content density.

## G2-12-024-004  [P2] GAP  facet F03  effort M
- Legacy: Status exposes lastViewedAt/backendStartedAt `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:68-75`
- vNext now: New known-error view has lastViewedAt but not backendStartedAt `src/app/(authenticated)/tracker/logs/page.tsx:76-88`
- Fix: Restore backend deploy/start indicator.

## G2-12-024-025  [P2] GAP  facet F12  effort M
- Legacy: Legacy deploys default 7d `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:202-206`
- vNext now: New known errors limit40 and separate live window `src/app/(authenticated)/tracker/logs/page.tsx:31-35`
- Fix: Restore deploy marker default.

## G2-12-024-033  [P2] GAP  facet F18  effort M
- Legacy: Legacy query/tool action names (known-errors, export, digest, deploys) `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:94-235`
- vNext now: New 'Known errors' and 'Live Google Cloud Logging' `src/app/(authenticated)/tracker/logs/page.tsx:36-44`; `src/components/tracker/tracker-live-logs-explorer.tsx:157-160`
- Fix: Align headings with legacy page copy.

## G2-12-024-041  [P2] GAP  facet F22  effort M
- Legacy: Legacy backendStartedAt part of state DTO `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:68-75`
- vNext now: New admin last-viewed only `src/app/(authenticated)/tracker/logs/page.tsx:76-88`
- Fix: Retain backend boot/deploy marker if meaningful.

## G2-8-031-004  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tracker/logs.js:118-160 tracker logs route uses URL deep link env/insertId/logName.
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:23-33 uses /tracker/logs?environment=...&query=...; live log details nested in explorer rather than old page route.
- Fix: Accept and translate old log deep-link query parameters or display expired-link explanation.

## G2-8-031-007  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tracker/logs.js:118-160 tracker log filters/status, grouped controls and health indicator.
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:38-43 starts with 'Known errors' header, KnownErrorsWorkspace and collapsed Live logging tools :81-109.
- Fix: Preserve Log explorer as primary view, present known errors in separate tab rather than replace hierarchy.

## G2-8-031-012  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tracker/logs.js:122-152 default PRODUCTION, 1H, WARNING, grouped=true, autoRefresh=false.
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:31-34 defaults PRODUCTION but header shows Known errors; live explorer only after details open :89-101.
- Fix: Keep 1H/WARNING/grouping defaults visible immediately and preserve auto-refresh switch.

## G2-8-031-035  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tracker/logs.js:149-160 Known errors/report/digest modals and selected detail controls.
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:89-109 disclosure panels replace always-on report/digest modal entry points.
- Fix: Keep old report/digest triggers as obvious actions and ensure close returns focus.

## G2-8-031-041  [P2] GAP  facet F11  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tracker/logs.js:108-115 requires tracker manager/proxy credentials, shows rate limit appropriately.
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:28-30 redirects unless global Super Admin with no tenant scope.
- Fix: Confirm old tracker MANAGER access policy and decide whether to allow authorized manager instead of global SA only.

## G2-8-031-054  [P2] GAP  facet F16  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tracker/logs.js:227-343 logs explorer grouped infinite scroll on mobile and desktop.
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:89-101 hides explorer in details by default.
- Fix: Keep primary mobile log feed reachable without disclosure and show Load older button.

## G2-8-031-065  [P2] GAP  facet F21  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tracker/logs.js:244-320 queryCloudLogs Google Cloud Logging and :424-431 polling; :147 test alert integrated notifier.
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:17-19 readiness and notifier modules, :89-109 live explorer/Telegram tools optionally configured.
- Fix: Document required Cloud Logging/Telegram env configs, manual alert and polling contracts; live-config check.

## G2-18-025-018  [P3] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/components/tracker/TrackerLogsAccessGate.jsx:23-28 — successful login reload to hydrate Redux auth
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:23-30 — server redirects unauthorized clients
- Fix: Offer safe return URL to logs after named login

## G2-18-025-030  [P3] GAP  facet F16  effort M
- Legacy: docs/legacy-source/frontend/src/components/tracker/TrackerLogsAccessGate.jsx:39-42 — lock icon above H1, muted explanatory paragraph
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:39-44 — known error title and description
- Fix: Map typographic scale/padding only in authorized login path

## G2-18-025-032  [P3] GAP  facet F18  effort M
- Legacy: docs/legacy-source/frontend/src/components/tracker/TrackerLogsAccessGate.jsx:40-52 — Logs access; Unlock; Incorrect password.
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:39-40,55-59 — Known errors; warnings for readiness
- Fix: Update screenshot/copy parity exception for intentional security removal

## G2-16-005-067  [P3] GAP  facet F18  effort S
- Legacy: `logs.js:557-559`: `42 Logs`, `Logs`, `What the backend is telling us, and what to do about it.`
- vNext now: `tracker/logs/page.tsx:38-41`: `Known errors`, backend signatures description.
- Fix: Restore heading exact wording.
