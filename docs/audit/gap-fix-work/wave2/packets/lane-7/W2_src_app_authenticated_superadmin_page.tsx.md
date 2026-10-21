# Work packet (wave 2): edit src/app/(authenticated)/superadmin/page.tsx

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-index.md

## G2-10-010-002  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/index.js:11-14` server-side 302 issued before rendering page
- vNext now: `src/app/(authenticated)/superadmin/page.tsx:1-2` Next App Router redirect emits framework temporary redirect (commonly 307)
- Fix: Specify explicit 302 compatibility redirect/route rule if redirect code is contract

## G2-10-010-039  [P2] GAP  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/index.js:9-14` exact destination path /superadmin/dashboard
- vNext now: `src/app/(authenticated)/superadmin/page.tsx:2` uses /admin/academics
- Fix: Correct path mapping as user-visible deep-link contract
