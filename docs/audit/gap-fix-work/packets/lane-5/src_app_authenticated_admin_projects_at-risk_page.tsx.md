# Work packet: edit src/app/(authenticated)/admin/projects/at-risk/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u029-superadmin-at-risk.md

## G2-7-029-040  [P2] GAP  facet F08  effort M
- Legacy: superadmin/projects/at-risk/index.js:346 Skeleton eight rows while loading
- vNext now: admin/projects/at-risk/page.tsx:51-56 async render, no explicit skeleton in risk page
- Fix: Add matching eight-row placeholder and scope restore skeleton
