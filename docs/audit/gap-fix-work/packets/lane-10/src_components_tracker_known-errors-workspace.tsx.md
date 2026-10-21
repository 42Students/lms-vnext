# Work packet: edit src/components/tracker/known-errors-workspace.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u005-tracker-logs.md

## G2-16-005-042  [P1] GAP  facet F10  effort M
- Legacy: `SuperAdminLogsController.java:68-84`: GET status and POST mark-viewed on successful first query.
- vNext now: `known-errors-workspace.tsx:243-250`: mark-viewed only via manual button; initial read happens in server page.
- Fix: Mark viewing after first successful current query, while preserving before-query lastViewedAt for counts.

## G2-16-005-035  [P2] MISSING  facet F08  effort M
- Legacy: `logs.js:587-595`: dismissible `N new events since your last visit` banner.
- vNext now: `known-errors-workspace.tsx:263-270`: shows Last reviewed and Mark logs reviewed but no since-last count banner.
- Fix: Compute and display new event count before marking viewed, offer dismiss.
