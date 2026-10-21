# Work packet (wave 3): NEW / MISSING items from docs/audit/gap2/lane-7/u018-college-admin-deleted-workspaces.md

2 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u018-college-admin-deleted-workspaces.md

## G2-7-018-001  [P1] MISSING  facet F01  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:22-38 route /college-admin/projects/workspaces/deleted with Projects active menu
- vNext now: V/app/(authenticated)/college/projects/workspaces/page.tsx:1-7 redirects to /college/projects; no `/college/projects/workspaces/deleted` file in main recursive source tree
- Fix: Add dedicated deleted-workspaces route and safe redirect alias

## G2-7-018-035  [P1] MISSING  facet F10  effort L
- Legacy: LFE/pages/college-admin/projects/workspaces/deleted.js:47-50 GET /api/v1/admin/projects/deleted?collegeId&page&size using AdminService.js:375-386
- vNext now: V/app/(authenticated)/college/projects/page.tsx:63-70 listProjectAdminSnapshots reads active/archive statuses; no deleted endpoint in src/app/api/projects tree
- Fix: Implement college-scoped deleted collection GET with page/size
