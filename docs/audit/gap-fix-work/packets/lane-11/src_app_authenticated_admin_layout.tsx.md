# Work packet: edit src/app/(authenticated)/admin/layout.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-index.md

## G2-10-010-019  [P2] GAP  facet F07  effort S
- Legacy: `docs/legacy-source/frontend/src/layouts/SuperAdminLayout.js:105-114` unauthorized Super Admin target shows Access denied... toast/login
- vNext now: `src/app/(authenticated)/admin/layout.tsx:9-10` unauthorized admin layout redirects to /dashboard
- Fix: Preserve safe unauthorized behavior and check login redirection/intent without losing session
