# Work packet: edit src/app/(authenticated)/college/projects/create/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u020-college-admin-workspace-create.md

## G2-7-020-001  [P1] GAP  facet F01  effort L
- Legacy: new.js:393-410 one /college-admin/projects/workspaces/new for single, teams and cohort
- vNext now: college/projects/create/page.tsx:20-29 and college/projects/workspaces/new/page.tsx:27-35 split forms
- Fix: Unify all modes on one canonical route and preserve old URL
