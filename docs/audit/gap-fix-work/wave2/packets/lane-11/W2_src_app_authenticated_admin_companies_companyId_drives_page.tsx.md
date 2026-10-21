# Work packet (wave 2): edit src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-companies-college.md

## G2-9-033-082  [P2] GAP  facet F09  effort M
- Legacy: History modal width720, loading state, error Retry, close `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:523-540`
- vNext now: Dedicated history route has no 720px overlay `src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx:11-47`
- Fix: Restore modal or provide parity drawer with three metrics and Retry.

## G2-9-033-088  [P2] GAP  facet F13  effort M
- Legacy: History modal Retry after failed jobs/stats GET `docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:531-540`
- vNext now: History route notFound and redirect, no retry `src/app/(authenticated)/admin/companies/[companyId]/drives/page.tsx:11-18`
- Fix: Add recoverable transient-load Retry separate from genuine 404.
