# Work packet: edit src/app/(authenticated)/tracker/logs/page.tsx

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l18-u025-public-tracker-logs-access.md, docs/audit/gap2/lane-16/u005-tracker-logs.md, docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md, docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md

## G2-18-025-009  [P0] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTrackerLogsAccessController.java:89-101 — successful password grants full Super Admin session
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:29-30 — full platform admin identity required and unscoped
- Fix: Do not reintroduce full-admin password bypass; require attributable named privileged identity

## G2-18-025-001  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTrackerLogsAccessController.java:36-38,64-66 — public POST /api/v1/public/bug-tracker/logs-access/verify
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:23-30 — tracker logs is private SSR route, no password endpoint
- Fix: Intentional security removal; offer named admin login and scoped deep link, NEVER restore shared-secret superadmin bypass

## G2-18-025-039  [P1] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/TrackerLogsAccessRequest.java:6-8 — no DB credential row; password hash in config
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:23-30 — authenticated request context and persisted account
- Fix: Document credentials not migrated for safety; no static hashed secret onboarding

## G2-16-005-001  [P1] GAP  facet F01  effort L
- Legacy: `logs.js:550-576,770-815`: standalone `/tracker/logs` within TrackerShell; `Logs` H1 and `42 Logs` eyebrow.
- vNext now: `src/app/(authenticated)/tracker/logs/page.tsx:36-44`: authenticated app, heading `Known errors`.
- Fix: Restore primary Logs workbench as entry and keep Known Errors as a sub-workspace.

## G2-16-005-004  [P1] GAP  facet F01  effort M
- Legacy: `logs.js:770-815`; `TrackerLogsAccessGate.jsx:12-56`: Super Admin or tracker logs password access gate.
- vNext now: `tracker/logs/page.tsx:28-30`: unscoped platform Super Admin only, redirects others.
- Fix: Get owner access decision; if password-based tester access remains, implement isolated hardened alternate auth.

## G2-16-005-005  [P1] GAP  facet F02  effort L
- Legacy: `logs.js:554-640`: Logs title/actions, health strip, since-last-visit banner, control strip and toggles, summary.
- vNext now: `tracker/logs/page.tsx:81-109`: Known Errors page first; tabs, known cards, collapsed Live logging tools and Telegram tools.
- Fix: Rebuild legacy vertical section hierarchy and make Live logs first-class rather than collapsed behind Known errors.

## G2-16-005-015  [P1] GAP  facet F04  effort S
- Legacy: `logs.js:122-127`: defaults PRODUCTION, 1H, WARNING, grouped true, autoRefresh false.
- vNext now: `tracker/logs/page.tsx:32-33`; `tracker-live-logs-explorer.tsx:48-54`: PRODUCTION, 60m, ERROR, no grouping/auto.
- Fix: Set severity default WARNING and group on; retain 1h default and auto off.

## G2-16-005-044  [P1] GAP  facet F10  effort L
- Legacy: `SuperAdminLogsController.java:201-234`: deploy marker, health, digest and Telegram endpoints.
- vNext now: `tracker/logs/page.tsx:76-109`: deploy health strip absent; known errors and Telegram manual tools present.
- Fix: Expose deploy markers, health comparisons and digest where supported or document dropped integration.

## G2-16-005-045  [P1] GAP  facet F11  effort M
- Legacy: `logs.js:770-815`: logs gate permits logs-session hint/password under strict API auth; token refresh on mount.
- vNext now: `tracker/logs/page.tsx:28-30`: unscoped Super Admin enforced server-side, no alternate gate.
- Fix: Document access policy; protect all Cloud Logging routes and potential password-only path.

## G2-16-005-080  [P1] GAP  facet F21  effort L
- Legacy: `SuperAdminLogsController.java:201-234`: rollout markers/health and digest separate services.
- vNext now: `tracker/logs/page.tsx:81-109`: no deploy health strip; Telegram manual digest present.
- Fix: Restore deploy-health and rollout chips integrated with log list.

## G2-12-024-002  [P1] GAP  facet F01  effort M
- Legacy: Query/detail separate endpoints `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:56-65`
- vNext now: New Known errors heading with Live logging disclosure `src/app/(authenticated)/tracker/logs/page.tsx:36-44`; `src/app/(authenticated)/tracker/logs/page.tsx:89-94`
- Fix: Restore Logs as primary page workbench.

## G2-12-024-003  [P1] GAP  facet F02  effort M
- Legacy: Controller includes query, status, triage, export, deploys, digest `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:56-235`
- vNext now: Page shows known cards, live logs and manual Telegram `src/app/(authenticated)/tracker/logs/page.tsx:81-109`
- Fix: Map all legacy workbench sections in legacy order.

## G2-12-024-043  [P1] GAP  facet F23  effort M
- Legacy: Legacy known-error triage available with configured service `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:94-110`
- vNext now: New Known Errors gated behind DB10 flag `src/app/(authenticated)/tracker/logs/page.tsx:55-60`
- Fix: Leave warning until migration registered.

## G2-8-031-021  [P1] GAP  facet F05  effort L
- Legacy: docs/legacy-source/frontend/src/pages/tracker/logs.js:310-343 older cursor for cloud logs, :265-310 newer refresh, grouped list.
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:110-113 known errors limited to most recent 40 signatures, no historical pagination.
- Fix: Implement paginated known-error history or default to primary cloud-log paginated explorer.

## G2-8-031-061  [P1] GAP  facet F19  effort L
- Legacy: docs/legacy-source/frontend/src/pages/tracker/logs.js:265-343 30-second refresh and older pages, cached signatures map.
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:110-113 explicitly only 40 recent signatures, no historical paging.
- Fix: Add bounded cursor pagination for durable signatures and document retention.

## G2-18-025-013  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicTrackerLogsAccessController.java:70-85 — 429 Too many attempts; 503 Logs access is not configured; 401 Incorrect password
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:29-30,55-60 — redirect/feature-not-ready alerts
- Fix: Map visible denial reasons without exposing login account state

## G2-12-024-014  [P2] MISSING  facet F07  effort M
- Legacy: Deploy health requires ISO at; distinct missing and parse messages `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:210-219`
- vNext now: No corresponding operation on mapped tracker page `src/app/(authenticated)/tracker/logs/page.tsx:81-109`
- Fix: Restore validated deploy-health endpoint.

## G2-18-025-014  [P3] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/components/tracker/TrackerLogsAccessGate.jsx:30-33 — on failed password, error response or Incorrect password. and clears field
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:29-30 — redirect has no inline error field
- Fix: Link to sign-in page and support secure errors there

## G2-18-025-015  [P3] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/components/tracker/TrackerLogsAccessGate.jsx:42-43 — AntD red Alert with showIcon for password errors
- vNext now: src/app/(authenticated)/tracker/logs/page.tsx:55-59 — warning Alert for log-store unavailable
- Fix: Separate authentication denial and logging readiness notices
