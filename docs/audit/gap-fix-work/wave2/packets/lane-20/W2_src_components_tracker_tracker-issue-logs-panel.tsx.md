# Work packet (wave 2): edit src/components/tracker/tracker-issue-logs-panel.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u003-tracker-issue-detail.md

## G2-16-003-021  [P2] GAP  facet F05  effort S
- Legacy: `IssueLogsPanel.jsx:8,41-84`: show at most 8 nearby log entries ranked by time offset, plus N more hint.
- vNext now: `tracker-issue-logs-panel.tsx:37-46`: displays every returned log in plain list, no 8-entry cap or count hint.
- Fix: Limit visible log rows to 8, rank and show overflow count with link.

## G2-16-003-022  [P2] GAP  facet F05  effort M
- Legacy: `IssueLogsPanel.jsx:65-79`: severity badge, offset code, first 200 chars, http path and user info in row.
- vNext now: `tracker-issue-logs-panel.tsx:38-44`: event/time, full message/path and Open in Logs link.
- Fix: Restore row severity/offset, 200-character snippet, method/path/user context.

## G2-16-003-042  [P2] GAP  facet F10  effort M
- Legacy: `IssueLogsPanel.jsx:24-35`: retrieves Cloud Logging export with env, WARNING level, since/until 5-min window.
- vNext now: `tracker-issue-logs-panel.tsx:15-25`: reads `/api/tracker/issues/[id]/nearby-logs`; configuration can be absent.
- Fix: Align backend window, severity filter, rank and bounded results to legacy behavior.

## G2-16-003-049  [P2] GAP  facet F12  effort S
- Legacy: `IssueLogsPanel.jsx:8,48`: eight shown and five minutes either side.
- vNext now: `tracker-issue-logs-panel.tsx:29-37`: ten minutes before AND after, all results.
- Fix: Change window to ±5 min, rank, show 8 and remaining count.

## G2-16-003-077  [P2] GAP  facet F21  effort M
- Legacy: `IssueLogsPanel.jsx:24-35`: Google Cloud Logging export via admin logs service.
- vNext now: `tracker-issue-logs-panel.tsx:15-25`: separate backend nearby-logs endpoint, may report unconfigured.
- Fix: Verify deployment logging source, ±5 minute window and severity parity.

## G2-16-003-053  [P3] GAP  facet F13  effort S
- Legacy: `IssueLogsPanel.jsx:51-59`: idle Load button, skeleton, error with Retry, empty sentence.
- vNext now: `tracker-issue-logs-panel.tsx:31-36`: loading button, inline notice, empty `No matching warnings or errors were found.`.
- Fix: Use legacy skeleton, error Retry button and empty wording.

## G2-16-003-068  [P3] GAP  facet F18  effort S
- Legacy: `IssueLogsPanel.jsx:59`: `No warnings or errors were logged around that time.`.
- vNext now: `tracker-issue-logs-panel.tsx:36`: `No matching warnings or errors were found.`.
- Fix: Use original empty sentence.

## G2-16-003-071  [P3] GAP  facet F19  effort S
- Legacy: `IssueLogsPanel.jsx:22-38`: on-demand Cloud Logging query not fetched on mount; max eight rows displayed.
- vNext now: `tracker-issue-logs-panel.tsx:15-34`: also on-demand, no display cap.
- Fix: Keep lazy fetch but limit visible results to eight.
