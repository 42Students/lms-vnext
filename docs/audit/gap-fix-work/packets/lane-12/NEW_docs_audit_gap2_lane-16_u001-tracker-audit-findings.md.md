# Work packet: NEW / MISSING items from docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

5 findings. These findings have no vNext file yet: create the files, modules or routes needed, inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-16/u001-tracker-audit-findings.md

## G2-16-001-026  [P1] GAP  facet F07  effort S
- Legacy: `audit-findings.js:60-63`: API failure alert shows server message or `Couldn't load findings.`.
- vNext now: `page.tsx:44`: unhandled server list rejection enters Next error boundary.
- Fix: Catch listing failures and display inline `Couldn't load findings.` alert with retry.

## G2-16-001-039  [P1] GAP  facet F11  effort M
- Legacy: `audit-findings.js:194-221`; `TrackerLogsAccessGate.jsx:12-56`: super-admin hint or password-only temporary authorization.
- vNext now: `page.tsx:27-30`: active unscoped platform Super Admin and `admin-scope.select` required.
- Fix: Resolve owner policy for temporary manager password access; if retired, document security reason and replacement.

## G2-16-001-045  [P1] GAP  facet F12  effort M
- Legacy: `AuditFindingService.java:113-129`: similar issues = same area and title token overlap >=0.6, max 5.
- vNext now: `[publicId]/page.tsx:20-22,54-58`: loads first fifty all-area findings and searches title via link.
- Fix: Implement same-area overlap scoring and max-five candidate result before duplicate selection.

## G2-16-001-028  [P2] GAP  facet F07  effort S
- Legacy: `audit-findings.js:120-123`: sync config and last error are distinct icon alerts with full error text.
- vNext now: `page.tsx:116-124`: status sentence only, raw lastError not surfaced.
- Fix: Restore configured warning and lastError detail, retaining safe sanitization.

## G2-16-001-029  [P2] MISSING  facet F08  effort M
- Legacy: `audit-findings.js:69-80`: success/warning/error message toasts with `Synced`, `Sync didn't run`, `Sync failed.` fallbacks.
- vNext now: `page.tsx:114-124`: no Sync now; no sync toasts.
- Fix: Implement toasts keyed by SyncResult.ran and HTTP failure with exact fallbacks; verify duration live.
