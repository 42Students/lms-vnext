# Work packet (wave 2): edit src/app/(authenticated)/tracker/audit-findings/page.tsx

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md

## G2-8-031-008  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tracker/audit-findings.js:110-155 Audit findings title, Sync now, status summary chips, filter strip then table.
- vNext now: src/app/(authenticated)/tracker/audit-findings/page.tsx:32-43 title+nav then tabs and chips :64-78, no direct Sync now on page.
- Fix: Restore top action 'Sync now' when integration authorized, reflect setup failure clearly.

## G2-8-031-020  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tracker/audit-findings.js:30-60 view open/all/release, status/severity/area/kind/search, :87-103 columns Severity, Finding, Kind, Status and result.
- vNext now: src/app/(authenticated)/tracker/audit-findings/page.tsx:52-63 columns Finding, Area/Kind, Severity, Status, Assigned, Reported; :64-106 expanded filters.
- Fix: Match severity-first column order and include legacy report stage/result cells on index, keeping added fields optional.

## G2-8-031-034  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tracker/audit-findings.js:189 AuditFindingDrawer on click with sync/status controls.
- vNext now: src/app/(authenticated)/tracker/audit-findings/page.tsx:53-55 navigates to detail page /tracker/audit-findings/[externalId], no drawer in index.
- Fix: Restore same-page drawer or document approved dedicated-page UX; preserve Back and filter scroll state.

## G2-8-031-044  [P2] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/tracker/audit-findings.js:14-27 legacy findings status/severity/area/kind enums, :30 default view open.
- vNext now: src/app/(authenticated)/tracker/audit-findings/page.tsx:20-21 imports independent statuses/kinds; :65-77 OPEN/RELEASE/ALL, new schema may have differences.
- Fix: Build explicit old-vNew enum/transition mapping and row badge parity.

## G2-8-031-059  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/frontend/src/pages/tracker/audit-findings.js:110 'Audit findings' title and :117 'Sync now'.
- vNext now: src/app/(authenticated)/tracker/audit-findings/page.tsx:32-33 title identical, but no Sync now; new descriptive text differentiates independent audit findings.
- Fix: Keep title and Sync CTA with safe unavailable tooltip/status.
