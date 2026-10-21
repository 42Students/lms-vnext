# Work packet (wave 2): edit src/app/(authenticated)/admin/recruiters/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md, docs/audit/gap2/lane-3/superadmin-recruiter-accounts.md

## G2-10-021-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/recruiters.js:6-14 — /superadmin/recruiters under placements tab and scope picker; selected org/college passed to component.
- vNext now: src/app/(authenticated)/admin/recruiters/page.tsx:1-6; src/app/(authenticated)/admin/hr/page.tsx:26-41 — Alias /admin/recruiters to /admin/hr; scope resolved from request context.
- Fix: Restore Placement group nav and legacy route context labels.

## G2-3-031-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:31-35`
- vNext now: `src/app/(authenticated)/admin/recruiters/page.tsx:1-7`
- Fix: Legacy section embedded under Super Admin Recruiter accounts; vNext /admin/recruiters re-exports /admin/hr, adjust group tab/back/route semantics.
