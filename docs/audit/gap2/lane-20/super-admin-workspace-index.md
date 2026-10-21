# U028 — Project workspace index redirect

Legacy docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js; new src/app/(authenticated)/admin/projects/[projectId]/page.tsx. No runtime/CI.

| ID | Facet | Legacy | vNext | Verdict | Severity | Fix | Effort |
|---|---|---|---|---|---|---|---|
| G2-20-028-001 | F01 | Legacy index forward summary docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:6-22 | New different route summary src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-29 | GAP | P2 | Alias route | M |
| G2-20-028-002 | F02 | Old skeleton six rows docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:26-30 | New no markup src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30 | GAP | P2 | Loading fallback | S |
| G2-20-028-003 | F03 | Old AntD active skeleton docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:3,26-29 | New nothing src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30 | MISSING | P2 | Shimmer | S |
| G2-20-028-004 | F04 | Dynamic workspaceId arbitrary docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:14-20 | New requires UUID src/app/(authenticated)/admin/projects/[projectId]/page.tsx:21-24 | GAP | P2 | ID mapping | M |
| G2-20-028-005 | F05 | No table docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:26-30 | No table src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30 | MATCH | P3 | N/A | S |
| G2-20-028-006 | F06 | No form docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:13-31 | No form src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30 | MATCH | P3 | N/A | S |
| G2-20-028-007 | F07 | Old waits router ready docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:17-24 | New bad ID notFound src/app/(authenticated)/admin/projects/[projectId]/page.tsx:21-24 | GAP | P2 | Failure UX | S |
| G2-20-028-008 | F08 | No toast docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:13-31 | No toast src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30 | MATCH | P3 | N/A | S |
| G2-20-028-009 | F09 | No dialog docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:13-31 | No dialog src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30 | MATCH | P3 | N/A | S |
| G2-20-028-010 | F10 | Old replaces retaining query docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:17-24 | New redirect drops query src/app/(authenticated)/admin/projects/[projectId]/page.tsx:25-29 | GAP | P1 | Forward query | S |
| G2-20-028-011 | F11 | Old SuperAdminLayout docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:4,33-34 | New role and scope verified src/app/(authenticated)/admin/projects/[projectId]/page.tsx:17-24 | EXTRA | P3 | Keep auth | S |
| G2-20-028-012 | F12 | Old encoded workspaceId docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:19-22 | New parsed UUID src/app/(authenticated)/admin/projects/[projectId]/page.tsx:21-28 | GAP | P2 | Map IDs | M |
| G2-20-028-013 | F13 | Old skeleton pending docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:17-30 | No loading state src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30 | MISSING | P2 | Loading UI | S |
| G2-20-028-014 | F14 | No files docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:13-31 | No files src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30 | MATCH | P3 | N/A | S |
| G2-20-028-015 | F15 | No email docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:13-31 | No email src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30 | MATCH | P3 | N/A | S |
| G2-20-028-016 | F16 | Legacy module class docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:26-30 | New no CSS src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30 | GAP | P3 | Spacing | S |
| G2-20-028-017 | F17 | Old skeleton no ARIA docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:26-30 | New blank src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-30 | GAP | P3 | Status label | S |
| G2-20-028-018 | F18 | Summary deep link docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:8-22 | New summary path differs src/app/(authenticated)/admin/projects/[projectId]/page.tsx:25-29 | GAP | P2 | Link copy | S |
| G2-20-028-019 | F19 | Client router waits docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:17-24 | Server DB authorization src/app/(authenticated)/admin/projects/[projectId]/page.tsx:17-24 | EXTRA | P3 | Keep safety | S |
| G2-20-028-020 | F20 | Old query rest retained docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:15-22 | New omits all src/app/(authenticated)/admin/projects/[projectId]/page.tsx:12-29 | GAP | P1 | Whitelist params | S |
| G2-20-028-021 | F21 | Old no integration docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:1-34 | New scope service src/app/(authenticated)/admin/projects/[projectId]/page.tsx:17-24 | EXTRA | P3 | Keep scope | S |
| G2-20-028-022 | F22 | No legacy DB docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:13-31 | New UUID parse src/app/(authenticated)/admin/projects/[projectId]/page.tsx:21-24 | GAP | P2 | Old key compatibility | M |
| G2-20-028-023 | F23 | New auth before redirect src/app/(authenticated)/admin/projects/[projectId]/page.tsx:17-24 | Legacy client forwards docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/index.js:17-24 | EXTRA | P3 | Retain auth | S |

## Unit summary

Rows 23. Top gaps: URL alias, lost query and missing skeleton. P0 0 P1 2. New role guard intentionally stronger.
