# Work packet (wave 3): edit src/app/(authenticated)/tracker/audit-findings/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md

## G2-8-031-050  [P1] MISSING  facet F14  effort L
- Legacy: docs/legacy-source/frontend/src/pages/tracker/audit-findings.js:117 'Sync now' imports audit findings from GitHub; :69-80 reports completion.
- vNext now: src/app/(authenticated)/tracker/audit-findings/page.tsx:114-124 states manual sync unavailable.
- Fix: Build integration-triggered sync with permission and config checks, or expose verified disabled action and explicit reason.
