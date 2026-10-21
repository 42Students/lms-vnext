# Work packet (wave 2): edit src/components/admin/super-admin-placement-oversight-nav.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-index.md

## G2-10-017-004  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:259-261 — All drives button navigates secondary `/superadmin/jobs/all`.
- vNext now: src/components/admin/super-admin-placement-oversight-nav.tsx:6-26 — All drives is primary oversight Tabs link `/admin/placements/drives`.
- Fix: Maintain secondary escape-hatch semantics.

## G2-10-017-031  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:593-597 — All drives link includes '(including N closed/draft)' when inactiveCount>0.
- vNext now: src/components/admin/super-admin-placement-oversight-nav.tsx:6-26 — All drives tab no count.
- Fix: Show dynamic inactive count alongside link.
