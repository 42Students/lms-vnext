# Work packet (wave 2): edit src/components/admin/admin-scoped-read-page.tsx (part 3 of 3)

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-6/superadmin-faculty-section.md, docs/audit/gap2/lane-6/superadmin-teachers.md, docs/audit/gap2/lane-19/faculty-search-controller.md

## G2-6-002-065  [P2] GAP  facet F13  effort S
- Legacy: Old empty roster shows `No faculty found. Register faculty members to get started.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1362-1371`
- vNext now: New empty state `No matching records` and `No persisted data matches...` `src/components/admin/admin-scoped-read-page.tsx:245-264`
- Fix: Use original no-results and filtered-empty text, tailored to faculty

## G2-6-002-066  [P2] GAP  facet F13  effort M
- Legacy: Old loading state uses tableLoading spinner in Ant Table `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:123-136` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1362-1370`
- vNext now: New route performs SSR loader, no visible table-loading skeleton in component `src/components/admin/admin-scoped-read-page.tsx:58-68`
- Fix: Show table-equivalent pending/skeleton feedback during filter/navigation

## G2-6-002-073  [P2] GAP  facet F16  effort M
- Legacy: Old action column right-fixed when screens.md; horizontal scroll max-content `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:802-804` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1362-1370`
- vNext now: New article layout wraps actions and long details `src/components/admin/admin-scoped-read-page.tsx:245-265`
- Fix: Ensure laptop actions remain immediately visible and mobile actions grouped

## G2-6-002-077  [P2] GAP  facet F18  effort S
- Legacy: Old filter labels `All departments`, `All types`, `Any status` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1343-1353`
- vNext now: New `Faculty type` input and uppercase `ALL`, `ACTIVE`, etc `src/components/admin/admin-scoped-read-page.tsx:118-123` `src/components/admin/admin-scoped-read-page.tsx:154-165`
- Fix: Replace with exact catalog labels; use human readable values

## G2-6-003-003  [P2] GAP  facet F01  effort S
- Legacy: Old missing college alert exact `Select a college to continue` and `Choose a college in the header above to see its faculty.` `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:10-20`
- vNext now: New EmptyState starts with `Select a college to continue`, but description resolved via title `Registered Faculty` rather than `Faculty` `src/components/admin/admin-scoped-read-page.tsx:54-57` `src/app/(authenticated)/admin/faculty/page.tsx:33-35`
- Fix: Use exact former description when no college selected

## G2-6-003-006  [P2] GAP  facet F02  effort S
- Legacy: Old select-scope warning sits in single page surface, without list content `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:10-21`
- vNext now: New title/EmptyState display nested in `AdminScopedReadPage` `src/components/admin/admin-scoped-read-page.tsx:54-57`
- Fix: Avoid duplicate faculty headings and render warning in legacy-position content canvas

## G2-6-003-007  [P2] GAP  facet F03  effort S
- Legacy: Old warning has Ant `Alert type=warning showIcon` `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:13-19`
- vNext now: New `EmptyState` no warning alert icon `src/components/admin/admin-scoped-read-page.tsx:54-57`
- Fix: Render warning icon, yellow tone and original alert spacing

## G2-6-003-012  [P2] GAP  facet F05  effort L
- Legacy: Old Faculty table is Ant Table with pinned action column `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:769-936` `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1362-1370`
- vNext now: New nested page uses AdminScopedReadPage article rows `src/components/admin/admin-scoped-read-page.tsx:245-265`
- Fix: Restore table semantics/columns and action pinning at md

## G2-6-003-013  [P2] GAP  facet F05  effort M
- Legacy: Old active roster filters dept/type/status inline `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1343-1360`
- vNext now: New GET form status plus advanced filters `src/components/admin/admin-scoped-read-page.tsx:113-165`
- Fix: Keep original roster filter toolbar initially visible

## G2-6-003-014  [P2] GAP  facet F05  effort S
- Legacy: Old default roster page size 25 with pageSizeOptions 25/50/100/200 `docs/legacy-source/frontend/src/pages/superadmin/sections/Faculty.js:1362-1370`
- vNext now: New 10/25/50/100 options `src/components/admin/admin-scoped-read-page.tsx:180-190`
- Fix: Match legacy pagination options including 200

## G2-6-003-029  [P2] GAP  facet F13  effort S
- Legacy: Old no-scope form is yellow Alert in content `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:10-20`
- vNext now: New no-scope state is EmptyState with instructional description `src/components/admin/admin-scoped-read-page.tsx:54-57`
- Fix: Match warning treatment, icon, and exact text

## G2-6-003-040  [P2] GAP  facet F18  effort S
- Legacy: Old no-scope description `Choose a college in the header above to see its faculty.` `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:15-16`
- vNext now: New directory produces `...see its Registered Faculty.` due page title `src/components/admin/admin-scoped-read-page.tsx:54-57` `src/app/(authenticated)/admin/faculty/page.tsx:33-35`
- Fix: Hardcode exact faculty description in no-college state

## G2-6-003-051  [P2] GAP  facet F23  effort S
- Legacy: Old route handles no-college as in-page yellow Alert `docs/legacy-source/frontend/src/pages/superadmin/teachers.js:10-20`
- vNext now: New emptystate instead of warning Alert `src/components/admin/admin-scoped-read-page.tsx:54-57`
- Fix: Retain identical severity affordance and helper text

## G2-19-013-050  [P3] GAP  facet F18  effort S
- Legacy: Legacy literal response `Faculty retrieved`, `Popular faculty retrieved`, `Checked` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:229-230` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:186-188` `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/faculty/FacultySearchController.java:366-368`
- vNext now: vNext page names `Registered Faculty`, `No matching records` `src/app/(authenticated)/admin/faculty/page.tsx:33-35` `src/components/admin/admin-scoped-read-page.tsx:243-259`
- Fix: Map copy to same user task; preserve meaningful labels.

## G2-19-013-051  [P3] GAP  facet F18  effort S
- Legacy: Legacy search frontend comment `ultra-fast` and `fuzzy matching` `docs/legacy-source/frontend/src/api/Services/FacultySearchService.js:6-10`
- vNext now: vNext search title/label generic `Search`, text q `src/components/admin/admin-scoped-read-page.tsx:114-116` `src/modules/admin-ui/super-admin-scoped-people-service.ts:77-81`
- Fix: Avoid unsupported fuzzy claim or restore expansion.
