# Work packet (wave 2): edit src/modules/projects/progress-percentage-policy.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-projects-workspaces.md

## G2-10-028-014  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/index.js:250-263; docs/legacy-source/frontend/src/components/admin/projects/adminProjectUtils.js:125-142 — progress = rounded done tasks+sprints / all.
- vNext now: src/modules/projects/admin-insights-service.ts:18-19; src/modules/projects/progress-percentage-policy.ts:1-6 — noncomplete cap at 99.
- Fix: Reconcile progress numerator and rounding.

## G2-10-028-038  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/adminProjectUtils.js:125-142 — progress formula includes task+sprint completion.
- vNext now: src/modules/projects/admin-insights-service.ts:18-19; src/modules/projects/progress-percentage-policy.ts:1-6 — capped rounding.
- Fix: Align status/progress boundary.
