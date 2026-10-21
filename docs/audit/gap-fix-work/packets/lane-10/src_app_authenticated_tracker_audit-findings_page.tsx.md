# Work packet: edit src/app/(authenticated)/tracker/audit-findings/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u001-tracker-audit-findings.md, docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md

## G2-16-001-001  [P1] GAP  facet F01  effort M
- Legacy: `audit-findings.js:194-221`; `TrackerShell.jsx:55-69`: tracker-branded standalone page via Audit findings nav; password gate possible.
- vNext now: `src/app/(authenticated)/tracker/audit-findings/page.tsx:24-33`; `tracker-admin-nav.tsx:7-29`: authenticated app page and tabs; no password gate.
- Fix: Restore accessible tracker shell/entry for authorized intended testers or record explicit security migration decision and equivalent approved access.

## G2-8-031-038  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/tracker/audit-findings.js:69-80 triggers import sync via API; versioned repo findings imported.
- vNext now: src/app/(authenticated)/tracker/audit-findings/page.tsx:114-124 read-only status, indicates sync unavailable until credentials verified.
- Fix: Implement authenticated POST sync job/manual trigger and durable results or explicitly record unsupported integration.

## G2-8-031-066  [P1] GAP  facet F21  effort L
- Legacy: docs/legacy-source/frontend/src/pages/tracker/audit-findings.js:9 imports GitHub findings through AuditFindingsService and :69-80 syncNow; credentials optional.
- vNext now: src/app/(authenticated)/tracker/audit-findings/page.tsx:20-21 independent findings service, :114-124 manual sync unavailable.
- Fix: Wire secure import runner/job and capture report/refused files, or record feature intentionally deferred.

## G2-8-031-028  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tracker/audit-findings.js:119-124 shows specific no-repo-credentials warning and last sync failed; :69-80 sync response.
- vNext now: src/app/(authenticated)/tracker/audit-findings/page.tsx:116-124 displays generic setup/last failure and manual sync unavailable.
- Fix: Distinguish missing credentials from transport failure and restore actionable Sync now error wording.

## G2-8-031-031  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tracker/audit-findings.js:117 Sync now action and :69-80 sync success/failure messaging.
- vNext now: src/app/(authenticated)/tracker/audit-findings/page.tsx:114-124 read-only state and explicit 'No sync was performed by opening this page'.
- Fix: Provide guarded manual sync and exact success count notification, never silently synthesize success.
