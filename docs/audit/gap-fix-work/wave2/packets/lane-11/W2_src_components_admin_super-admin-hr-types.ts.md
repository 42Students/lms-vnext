# Work packet (wave 2): edit src/components/admin/super-admin-hr-types.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-recruiters.md

## G2-10-021-105  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:547-554 — Drawer shows active+historical grants in one table; server-colleges model.
- vNext now: src/components/admin/super-admin-hr-types.ts:29-31; src/components/admin/super-admin-hr-detail-drawer.tsx:367-374 — grantHistory optional separate section; active grants list.
- Fix: Always expose grant history and lifecycle end states.

## G2-10-021-019  [P3] GAP  facet F04  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:25-25 — Name fallback `#<numeric recruiter id>` if missing name.
- vNext now: src/components/admin/super-admin-hr-types.ts:83-90 — Name fallback phoneE164 or 'Unnamed recruiter'.
- Fix: Use legacy fallback in migrated data, keep privacy-safe phone fallback as approved.
