# Work packet (wave 2): edit src/app/(authenticated)/admin/placements/hiring/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-hiring-dashboard.md

## G2-10-008-004  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/common/superAdminNavGroups.js:74-93` Placements group offers common tabs and recruiter/announcement additions
- vNext now: `src/app/(authenticated)/admin/placements/analytics/page.tsx:77-82` separate dashboard title; `src/app/(authenticated)/admin/placements/hiring/page.tsx:7-9` separate Hiring Dashboard · Applications title
- Fix: Expose Hiring Dashboard location within placements tabs, not only a separate job counts directory
