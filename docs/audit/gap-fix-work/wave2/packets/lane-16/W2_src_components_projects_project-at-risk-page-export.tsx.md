# Work packet (wave 2): edit src/components/projects/project-at-risk-page-export.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u029-superadmin-at-risk.md, docs/audit/gap2/lane-7/u036-cross-exports-imports.md

## G2-7-029-014  [P2] GAP  facet F03  effort S
- Legacy: superadmin/projects/at-risk/index.js:398-433 Download icon Export CSV disabled if visible page empty
- vNext now: project-at-risk-page-export.tsx:25-27 Export this page no Download icon
- Fix: Show Download icon and exact Export CSV label, disabled state

## G2-7-029-050  [P2] GAP  facet F10  effort S
- Legacy: superadmin/projects/at-risk/index.js:410-429 page-only CSV export after local search refinement
- vNext now: project-at-risk-page-export.tsx:9-26 page-only CSV from server riskResult.items without local refinement
- Fix: Match visible-filtered rows precisely when exporting

## G2-7-029-065  [P2] GAP  facet F14  effort M
- Legacy: superadmin/projects/at-risk/index.js:415-428 five CSV columns Workspace, Mentor, Status, Severity, Risk reasons
- vNext now: project-at-risk-page-export.tsx:12-16 eight columns Workspace ID, Workspace, Mentor, Severity, Risk reasons, Inactive days, Blocker, Last activity (UTC)
- Fix: Match five ordered column headings or explicitly approve expanded export

## G2-7-029-079  [P2] GAP  facet F18  effort S
- Legacy: superadmin/projects/at-risk/index.js:432 Export CSV
- vNext now: project-at-risk-page-export.tsx:26 Export this page
- Fix: Match visible export label

## G2-7-036-008  [P2] GAP  facet F03  effort S
- Legacy: superadmin/projects/at-risk/index.js:398-433 DownloadOutlined Export CSV disabled if empty
- vNext now: project-at-risk-page-export.tsx:25-27 Export this page disabled empty
- Fix: Restore download icon and exact label

## G2-7-036-018  [P2] GAP  facet F05  effort M
- Legacy: superadmin/projects/at-risk/index.js:410-429 export after local text refinement
- vNext now: project-at-risk-page-export.tsx:10-17 server-page results
- Fix: Apply exact final visible filters before export
