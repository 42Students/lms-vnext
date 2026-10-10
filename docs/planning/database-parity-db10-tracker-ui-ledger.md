# DB10 — Legacy 42 Tracker UI and persistence producer/consumer checklist

**Source:** 42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2; 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5  
**Status:** source-only UI inventory, not observed browser parity or vNext implementation. All entries open until producer/API/database works and browser checks are evidenced.  
**Note:** 42 Tracker is an independent cross-account surface, not merely a card under College Admin. It connects DB10 bug reports, audit and log-alert state. Do not suppress distinct pages during vNext cloning.

## Route and overlay checklist

| ID | Legacy entry and user job | Legacy source | DB10 dependency | State |
|---|---|---|---|---|
| BT-01 | Tracker standalone shell with route nav and light/dark switch | src/components/tracker/TrackerShell.jsx | Route context, auth and safe config | OPEN |
| BT-02 | Report issue landing page and draft restore/discard | src/pages/tracker/index.js | Draft behavior and validation | OPEN |
| BT-03 | Reporter selector, account/environment, page-screen-section cascade | tracker/index.js, src/data/bugTrackerData.js | Access identity and fields | OPEN |
| BT-04 | Issue classification, severity, description, evidence URL | tracker/index.js | bug_reports create + validation | OPEN |
| BT-05 | Screenshot picker including paste, drag/drop, remove and preview | src/components/tracker/ScreenshotPicker.jsx | Private upload workflow | OPEN |
| BT-06 | Create result, copy/open issue, report another | tracker/index.js | Public reference and acknowledgement | OPEN |
| BT-07 | Partial screenshot upload failure, retry, upload-in-progress states | tracker/index.js | Presigned object lifecycle, idempotency | OPEN |
| BT-08 | Issues list, status/environment/reporter filters and debounced search | src/pages/tracker/issues/index.js | Authorized paged query | OPEN |
| BT-09 | Sort by oldest/newest, query-string synchronization, back/forward | tracker/issues/index.js | Cursor/page stable query | OPEN |
| BT-10 | Saved filter presets, save dialog, edit/delete preset | tracker/issues/index.js; trackerSavedFilters.js | Preference persistence (legacy local storage) | OPEN |
| BT-11 | Bulk select issue rows, run bulk status and retry/error handling | tracker/issues/index.js; trackerBulk.js | Protected multi-row transactions | OPEN |
| BT-12 | Issue detail header, severity/status/resolution pills, location and context | src/pages/tracker/issues/[issueId].js | Authorized detail fetch | OPEN |
| BT-13 | Manager status control and optimistic response states | tracker/issues/[issueId].js | Super Admin mutation, version conflict | OPEN |
| BT-14 | Copy issue link and Markdown export | tracker/issues/[issueId].js | Safe redaction of private notes | OPEN |
| BT-15 | Screenshot gallery with unavailable/error fallback | tracker/issues/[issueId].js | Authorized expiring download URLs | OPEN |
| BT-16 | Engineering details editor (cause, layer, fix notes, commit links, test coverage, resolution, deployed flag) | src/components/tracker/EngineeringDetails.jsx | Role-scoped workflow | OPEN |
| BT-17 | Retest pass/fail with note and failed/retry state | src/components/tracker/RetestCard.jsx | State machine, history | OPEN |
| BT-18 | Immutable activity timeline/history | src/components/tracker/ActivityTimeline.jsx | bug_report_activities | OPEN |
| BT-19 | Related issue cloud-log panel, similar issues | IssueLogsPanel.jsx; SimilarIssuesPanel.jsx | Log search/correlation | OPEN |
| BT-20 | Logs tab/filters (environment, window, severity, search) | src/pages/tracker/logs.js | Cloud log access and durable cursor | OPEN |
| BT-21 | Grouped logs, auto refresh, pagination/load older and stale/retry states | tracker/logs.js | Log query/alert service | OPEN |
| BT-22 | Known error signatures, mute/triage, regression tracking | KnownErrorsDrawer.jsx; TrackerLogDetailsDrawer.jsx | DB10 log signature + history | OPEN |
| BT-23 | Log digest drawer, export and report modal | LogDigestDrawer.jsx; LogsDownloadControl.jsx; ClaudeReportModal.jsx | Redacted export/AI boundaries | OPEN |
| BT-24 | Logs access gate and permission/error states | TrackerLogsAccessGate.jsx; TrackerLogsAccessService.js | Server-side SUPER_ADMIN only | OPEN |
| BT-25 | Quick-report launcher in surrounding account pages | TrackerQuickReportLauncher.jsx; bugTrackerQuickReport.js | Capture context without session leaks | OPEN |

**Next required inventory pass:** inspect every child modal and detailed error/empty/loading state, including mobile/responsive, keyboard navigation and session restoration, then subdivide any multi-purpose row. Current 25-row checklist is a source-route inventory seed, **not proof that no tiny surface is missed**.

## Explicit security behavior reconciliation

- Legacy no-login reporter dropdown and open issue listing cannot be treated as authenticated identity. In vNext, reporter actions should require token/session identity proven on the server. Do not let a reporter select another reporter merely by form field.
- Source issues list is open in legacy; vNext should redact or restrict sensitive detail/list results. Add a documented privacy parity exception so intentional security changes are not mistaken for missing UI.
- UI manager gate and server-side Super Admin permission are distinct. Backend is authoritative; disabled/unauthorized buttons must not call a privileged endpoint.
- Engineering details and commit links are admin-only; reporters may get safe public status and their own retest flow only when approved.
- Logs page requires real Super Admin authorization even if the frontend shows the tab by role. No access through a publicly guessable link.
- Screenshot objects cannot be embedded from permanent public URLs; require owned signed read access and an unavailable fallback.

## Producer to consumer links

BugReportService.create → bug_reports → report success, issues list, detail.  
BugTrackerWorkflowService.updateWorkflow/retest → bug_reports + bug_report_activities atomically → status dropdown, engineering editor, retest card, activity timeline.  
BugTrackerAttachmentService.presign/confirm → private object + bug_report_attachments → screenshot picker, upload retry, detail gallery.  
LogAlertingService + Cloud Logging query → signature tables + durable poll state → logs strip, known-errors drawer, digest and issue logs panel.

## Closing rule

A row can move OPEN → SOURCE_COMPARED → IMPLEMENTED → BROWSER_VERIFIED only with exact FE/BE SHAs, linked vNext code, executed tests and real cross-role browser evidence. Source analysis and authored tests do not close it.


## W06 admin-triage staging checkpoint — 2026-10-10

The following rows now have source code staged behind a hard migration gate, but **remain below IMPLEMENTED** until W01 registers/replays DB10 tables and tests actually pass:

- **BT-08** issues list: server filters for status/environment/severity/search plus authorized scoped query.
- **BT-09** sort and stable keyset continuation: newest/oldest + cursor pairs and query-string preservation; saved filters still OPEN.
- **BT-12** issue detail: private header/context/status/severity, source context, sanitized attachment metadata and history.
- **BT-13** manager status/workflow control: Super Admin only, same-origin HTTP mutation and version conflict response.
- **BT-16** engineering details: layer, cause, fix notes, FE/BE commit SHA, regression status and production verification.
- **BT-17** retest: READY_FOR_RETEST-only PASS/FAIL semantics through existing pure workflow state machine.
- **BT-18** immutable history consumer: activity rows rendered oldest-to-newest; service appends workflow/retest events in same DB transaction as CAS update.
- **BT-01 partial**: lightweight Tracker admin nav exists, but legacy standalone shell/theme/report/log tabs are not cloned.

Still wholly OPEN: BT-02–07 reporter intake/upload, BT-10 saved views, BT-11 bulk operations, BT-14 Markdown export/copy, BT-15 authorized screenshot gallery/downloads, BT-19 similar/log correlations, BT-20–24 logs/known errors/digest/access gate, BT-25 quick report launcher.

Activation contract: `DB10_TRACKER_READY=DB10_VERIFIED` must **not** be set until W01 promotes the schema, disposable PostgreSQL replay passes, authored integration/security tests pass, and browser role/scope verification is captured.
