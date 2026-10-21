# Work packet (wave 2): edit src/app/(authenticated)/tpo/reports/accreditation/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md

## G2-13-031-097  [P2] GAP  facet F09  effort M
- Legacy: Legacy NAAC export opens Modal.confirm with missing field counts and Export anyway. `docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:139-152`
- vNext now: vNext preflight rendered inline. `src/app/(authenticated)/tpo/reports/accreditation/page.tsx:101-111`
- Fix: Restore modal with exact counts or owner-approved alternative.
