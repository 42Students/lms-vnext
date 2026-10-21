# Work packet (wave 2): edit src/app/(authenticated)/admin/projects/templates/page.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-project-template-controller.md, docs/audit/gap2/lane-6/superadmin-projects-templates-index.md

## G2-2-021-006  [P2] GAP  facet F02  effort M
- Legacy: Legacy superadmin/projects/templates/index.js:166-210 version/status/action columns
- vNext now: src/app/(authenticated)/admin/projects/templates/page.tsx:77-108 adds sections/assignments columns
- Fix: Clone exact column order, widths and actions; keep extra counts only if non-disruptive.

## G2-2-021-008  [P2] GAP  facet F02  effort M
- Legacy: Legacy superadmin/projects/templates/index.js:247-270 search/status toolbar, AntD card/table
- vNext now: src/app/(authenticated)/admin/projects/templates/page.tsx:62-75 form, ListToolbar, DataTable
- Fix: Match original filter styling, labels and table header.

## G2-2-021-016  [P2] GAP  facet F05  effort M
- Legacy: Legacy templates/index.js:119-124 350ms debounced title search
- vNext now: src/app/(authenticated)/admin/projects/templates/page.tsx:62-73 submit-form search
- Fix: Either restore debounced search or visibly use explicit Filter interaction.

## G2-2-021-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy templates/index.js:280-298 export entire currently filtered set
- vNext now: src/app/(authenticated)/admin/projects/templates/page.tsx:74-76 page-only export
- Fix: Match legacy CSV scope, headers, lifecycle status, version.

## G2-2-021-048  [P2] GAP  facet F14  effort M
- Legacy: Legacy templates/index.js:280-298 exports CSV including published/draft/archived
- vNext now: src/app/(authenticated)/admin/projects/templates/page.tsx:74-75 SuperAdminTemplatePageExport items
- Fix: Verify all filtered rows vs current page and exact CSV columns.

## G2-2-021-052  [P2] GAP  facet F16  effort M
- Legacy: Legacy templates/index.js:247-270 search/actions in toolbar over table
- vNext now: src/app/(authenticated)/admin/projects/templates/page.tsx:62-76 grid filter and ListToolbar
- Fix: Clone breakpoint widths, controls and table scroll.

## G2-2-021-053  [P2] GAP  facet F16  effort M
- Legacy: Legacy templates/index.js:314-323 AntD table skeleton/empty patterns
- vNext now: src/app/(authenticated)/admin/projects/templates/page.tsx:77-112 DataTable and EmptyState
- Fix: Inspect 375/768/1280 layout and row density.

## G2-6-029-016  [P2] GAP  facet F04  effort S
- Legacy: Legacy lifecycleStatus fallback status humanized (templates/index.js:170-176).
- vNext now: vNext always projectTemplates.status DRAFT/PUBLISHED/ARCHIVED uppercase (super-admin-template-directory-service.ts:22-25; admin/projects/templates/page.tsx:88-89).
- Fix: Humanize status label, document fallback priority.

## G2-6-029-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy table pageSize10, horizontal scroll max-content (templates/index.js:314-321).
- vNext now: vNext server PAGE_SIZE20 and separate Pagination (super-admin-template-directory-model.ts:11-15; admin/projects/templates/page.tsx:112).
- Fix: Set page size10 and clone AntD table pager/horizontal scroll.

## G2-6-029-022  [P2] GAP  facet F05  effort S
- Legacy: Legacy search query key search and status key status; invalid status silently resets to All (templates/index.js:58-85).
- vNext now: vNext query key q, status ALL and strict invalid-key/error page (super-admin-template-directory-model.ts:2-34; admin/projects/templates/page.tsx:29-35).
- Fix: Accept old deep-link key search and default bad status to All or explicit migration redirect.

## G2-2-021-007  [P3] GAP  facet F02  effort S
- Legacy: Legacy superadmin/projects/templates/index.js:228-247 heading Templates and New template button
- vNext now: src/app/(authenticated)/admin/projects/templates/page.tsx:57-61 PageHeader and Nav
- Fix: Match page header typography/toolbar spacing and placement.

## G2-2-021-056  [P3] GAP  facet F18  effort S
- Legacy: Legacy templates/index.js:252-270 search placeholder Search title or slug; status Lifecycle status
- vNext now: src/app/(authenticated)/admin/projects/templates/page.tsx:63-70 label Template title or slug, Status; search lacks placeholder
- Fix: Restore placeholder and exact filter label copy.
