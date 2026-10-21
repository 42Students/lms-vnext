# Work packet (wave 2): edit src/app/(authenticated)/superadmin/[...legacy]/page.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u002-superadmin-lessons.md, docs/audit/gap2/lane-7/u031-superadmin-projects-index.md, docs/audit/gap2/lane-7/u034-superadmin-template-index.md

## G2-18-002-001  [P2] GAP  facet F01  effort M
- Legacy: Superadmin Lessons is a section under `/superadmin` and component also supports `/college-admin` based on router pathname. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:65-68`
- vNext now: vNext primary paths `/admin/lessons` and `/college/lessons`; `/superadmin/[...legacy]` redirects. `src/app/(authenticated)/admin/lessons/page.tsx:25-37`, `src/app/(authenticated)/college/lessons/page.tsx:17-19`, `src/app/(authenticated)/superadmin/[...legacy]/page.tsx:6-20`
- Fix: Preserve legacy URL deep-link including meaningful course filter; validate redirects before dropping query.

## G2-7-031-005  [P2] GAP  facet F02  effort S
- Legacy: superadmin/projects/index.js:25-29 shell with six-row Skeleton while redirect pending
- vNext now: superadmin/[...legacy]/page.tsx:10-20 server redirect, no placeholder
- Fix: Match interim skeleton only if navigation visibly blocks; otherwise document invisible SSR improvement

## G2-7-031-007  [P2] GAP  facet F03  effort S
- Legacy: superadmin/projects/index.js:25-28 AntD Skeleton active paragraph rows6
- vNext now: superadmin/[...legacy]/page.tsx:10-20 no skeleton/icon
- Fix: Provide six-row loading silhouette for hydration fallback if needed

## G2-7-031-024  [P2] GAP  facet F13  effort S
- Legacy: superadmin/projects/index.js:25-29 six-row active Skeleton while router becomes ready
- vNext now: superadmin/[...legacy]/page.tsx:10-20 no intermediate state
- Fix: Verify on slow navigation, preserve accessible fallback if necessary

## G2-7-034-035  [P2] GAP  facet F20  effort S
- Legacy: templates/[templateId]/index.js:12-19 preserves other query params in replace
- vNext now: superadmin/[...legacy]/page.tsx:18-20 preserves only q key for mapped one-segment routes
- Fix: Translate only safe from/return/template params for deep links

## G2-7-031-028  [P3] GAP  facet F16  effort S
- Legacy: superadmin/projects/index.js:25-29 single fluid Skeleton regardless of width
- vNext now: superadmin/[...legacy]/page.tsx:10-20 no rendered content
- Fix: No breakpoint-specific layout needed unless skeleton shown
