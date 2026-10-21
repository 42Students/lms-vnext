# Work packet: edit src/app/(authenticated)/tpo/placements/lifecycle/page.tsx

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-index.md, docs/audit/gap2/lane-12/l16-u031-placements-end-to-end.md

## G2-11-012-009  [P1] GAP  facet F02  effort L
- Legacy: AntD Tabs tab bar wraps table pane. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:423`
- vNext now: Headless Tabs with renderPanel false followed by GET form and article results. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:120`
- Fix: Restore table-within-active-tab layout.

## G2-11-012-010  [P1] GAP  facet F02  effort L
- Legacy: TpoDataTable inside .tpo-drives__table with column headers, selection, sorting. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:438`
- vNext now: Article/card rows; no corresponding sortable table header. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:318`
- Fix: Use old table grid, sortable columns, column picker.

## G2-11-012-011  [P1] GAP  facet F02  effort L
- Legacy: Drive column first, Where it is, Mode, Owner, Job type, Pay, Applied, Deadline, Status, actions. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:295`
- vNext now: Card fields company title, status, employment/work mode, counts, deadline, actions. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:321`
- Fix: Restore all legacy columns and default visibility.

## G2-11-012-031  [P1] GAP  facet F05  effort M
- Legacy: Mode filter ON_CAMPUS/POOL/OFF_CAMPUS. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:105`
- vNext now: Work mode filter ONSITE/HYBRID/REMOTE. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:200`
- Fix: Expose drive-mode filter and map independent job work mode.

## G2-11-012-041  [P1] MISSING  facet F06  effort M
- Legacy: Bulk extend skips drives already later than new date. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:261`
- vNext now: No bulk operation or skip feedback. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:363`
- Fix: Preserve later-deadline skip rule with preview.

## G2-11-012-045  [P1] GAP  facet F07  effort M
- Legacy: Drives GET failure uses response message or Could not load drives. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:155`
- vNext now: Service errors bubble from await; no in-page fallback. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:28`
- Fix: Render exact PanelError and retry.

## G2-11-012-049  [P1] MISSING  facet F08  effort M
- Legacy: Failed refresh with rows retains old drives and shows This refresh failed. Drives below are from last successful load. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:421`
- vNext now: Server render without retained old snapshot. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:88`
- Fix: Cache last-good list and provide stale-banner Retry.

## G2-11-012-053  [P1] MISSING  facet F09  effort M
- Legacy: Close drives consequence requires acknowledgement irreversible. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:266`
- vNext now: Per-drive separate close preview, no selected-aggregate dialogue. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:368`
- Fix: Add bulk close acknowledgement and count preview.

## G2-11-012-066  [P1] GAP  facet F12  effort M
- Legacy: Reminders exclude recordedOutside and deadline-passed. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:243`
- vNext now: TpoRemindNonApplicants shown on all PUBLISHED records. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:373`
- Fix: Hide/disable invalid reminder early with reason.

## G2-11-012-069  [P1] MISSING  facet F13  effort M
- Legacy: Refresh failure keeps old drives visible. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:421`
- vNext now: New server result discarded on error. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:88`
- Fix: Retain last snapshot with stale warning.

## G2-11-012-075  [P1] GAP  facet F15  effort M
- Legacy: Bulk remind sends in-app notifications to eligible nonapplicants. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:244`
- vNext now: Single-drive reminder action. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:373`
- Fix: Port bulk reminder result summary and delivery guard.

## G2-11-012-094  [P1] GAP  facet F20  effort M
- Legacy: Failed drives GET retains last array. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:157`
- vNext now: Page reload error boundary loses previous list. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:24`
- Fix: Retain snapshot across failed refresh.

## G2-11-012-102  [P1] GAP  facet F23  effort L
- Legacy: Original Drives is data-table command list and bulk ActionsWindow. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:439`
- vNext now: vNext list is paginated cards with export-selected only. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:318`
- Fix: Rebuild old-look table, bulk select and actions.

## G2-11-012-104  [P1] GAP  facet F23  effort M
- Legacy: Legacy stale load warning and Retry missing data. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:421`
- vNext now: No per-section fallback. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:88`
- Fix: Add retriable independent data failures.

## G2-16-031-033  [P1] GAP  facet F11  effort M
- Legacy: TpoDriveController.java:51-63 guard requires owned job for reads/writes
- vNext now: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:24-27 uses placements.manage tenant check
- Fix: Verify per-job owner restrictions and acting-college admin permissions rather than relying solely on broad manage scope

## G2-11-012-050  [P2] MISSING  facet F08  effort M
- Legacy: Support-data Alert lists each unavailable category and Retry missing data. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:391`
- vNext now: No unified support data warning. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:127`
- Fix: Show named failures, suppress affected counts, Retry.

## G2-11-012-051  [P2] GAP  facet F08  effort S
- Legacy: Initial load/refresh state driven by setLoading. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:160`
- vNext now: Server streaming; inline loading state not in page. `src/app/(authenticated)/tpo/placements/lifecycle/page.tsx:24`
- Fix: Add list skeleton and refreshing badge.
