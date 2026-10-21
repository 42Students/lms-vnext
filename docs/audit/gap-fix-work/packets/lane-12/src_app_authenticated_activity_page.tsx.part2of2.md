# Work packet: edit src/app/(authenticated)/activity/page.tsx (part 2 of 2)

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-audit-hub.md, docs/audit/gap2/lane-9/superadmin-audit-logs.md

## G2-9-026-025  [P2] GAP  facet F07  effort M
- Legacy: Legacy failure error banner Couldn't load activity. with Retry `docs/legacy-source/frontend/src/components/admin/activity/ActivityCenter.jsx:74-129`
- vNext now: Strict query validation leads to Invalid audit filters; service read errors may bubble to route error `src/app/(authenticated)/admin/audit/page.tsx:15-20` `src/app/(authenticated)/activity/page.tsx:99-131`
- Fix: Display fetch failure inline preserving same-query data and retry.

## G2-9-027-029  [P2] GAP  facet F07  effort M
- Legacy: Refresh failures preserve last results and show warning `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:303-309`
- vNext now: SSR list read has no client stale-data state `src/app/(authenticated)/activity/page.tsx:98-131`
- Fix: Keep last same-scope rows and Retry.
