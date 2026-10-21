# Work packet (wave 2): edit src/components/courses/super-admin-content-directory-page.tsx (part 2 of 2)

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/superadmin-admin-resources.md, docs/audit/gap2/lane-17/superadmin-lesson-content-wrapper.md

## G2-9-025-009  [P2] GAP  facet F03  effort S
- Legacy: Students column uses Visible green Tag vs Hidden neutral `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:309-313`
- vNext now: Students visibility badge computed using published ancestors `src/components/courses/super-admin-content-directory-page.tsx:143-146`
- Fix: Match visible/hidden badges but preserve stricter effective visibility semantics.

## G2-9-025-012  [P2] GAP  facet F04  effort L
- Legacy: Table Title, Visibility, Students, Materials, Action with 15 rows/page `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:307-322`
- vNext now: One article per record with title, statuses, links, meta and actions disclosure `src/components/courses/super-admin-content-directory-page.tsx:134-163`
- Fix: Render 5-column compact table, legacy column order, 15 default.

## G2-9-025-013  [P2] GAP  facet F04  effort S
- Legacy: Title fallback Untitled `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:308-308`
- vNext now: Article directly prints item.title without fallback `src/components/courses/super-admin-content-directory-page.tsx:135-138`
- Fix: Display Untitled for missing/blank titles.

## G2-9-025-014  [P2] MISSING  facet F04  effort M
- Legacy: Visibility cell All sections or specific class name `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:309-310`
- vNext now: Audience is separate filter, row renders course/lesson and status but not class label `src/components/courses/super-admin-content-directory-page.tsx:124-128` `src/components/courses/super-admin-content-directory-page.tsx:140-146`
- Fix: Add actual target section name or All sections as dedicated cell.

## G2-9-025-017  [P2] GAP  facet F05  effort M
- Legacy: Select by course -> lesson -> class; class 0 all sections and section-specific rows `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:335-359`
- vNext now: Advanced filters independently choose course offering, lesson, delivery and audience `src/components/courses/super-admin-content-directory-page.tsx:105-129`
- Fix: Require sequential course-lesson-class selected scope in main toolbar.

## G2-9-025-018  [P2] GAP  facet F05  effort S
- Legacy: All content in this lesson (new resources go to every section) explicit shared class option `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:173-177`
- vNext now: Audience SHARED labelled All currently eligible sections `src/components/courses/super-admin-content-directory-page.tsx:124-128`
- Fix: Restore exact selector label and explain shared authoring behavior.

## G2-9-025-019  [P2] GAP  facet F05  effort M
- Legacy: Select course/lesson showSearch searchable, width260; class width300 `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:336-359`
- vNext now: Native selectors in four-col Filters disclosure `src/components/courses/super-admin-content-directory-page.tsx:108-129`
- Fix: Restore searchable dropdowns with widths/placeholder.

## G2-9-025-049  [P2] GAP  facet F13  effort M
- Legacy: Separate course/lesson/list load states and stale same-scope rows on refresh failure `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:89-171`
- vNext now: Promise.allSettled; directory on failure replaced by ErrorState, authoring options independent warnings `src/components/courses/super-admin-content-directory-page.tsx:67-92`
- Fix: Retain same-scope snapshot and error banners per source.

## G2-9-025-050  [P2] GAP  facet F13  effort M
- Legacy: RefreshStatus, inline Retry, 6x5 TableSkeleton and same-scope stale results `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:363-378`
- vNext now: ErrorState Retry loading content, list renders only after server success `src/components/courses/super-admin-content-directory-page.tsx:73-80,134-166`
- Fix: Match in-table skeleton/refresh and Retry wording.

## G2-9-025-051  [P2] GAP  facet F13  effort S
- Legacy: Separate Could not load courses and Could not load lessons alerts `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:329-334`
- vNext now: Authoring options temporarily unavailable aggregated Banner `src/components/courses/super-admin-content-directory-page.tsx:89-92`
- Fix: Show course vs lesson-specific errors and retries.

## G2-9-025-057  [P2] GAP  facet F16  effort L
- Legacy: Legacy horizontal selector Space then compact Table and 700px modal `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:335-362,379-410`
- vNext now: Responsive 4-col filters, stacked articles, expanded details `src/components/courses/super-admin-content-directory-page.tsx:93-169` `src/components/courses/super-admin-content-authoring.tsx:16-35`
- Fix: Rebuild desktop toolbar/table/modal; maintain mobile tap targets.

## G2-9-025-058  [P2] GAP  facet F17  effort M
- Legacy: Selector/input labels, native file picker and Remove file aria-label `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:336-359,383-405`
- vNext now: New filters labelled but hidden authoring, no per-material remove controls `src/components/courses/super-admin-content-directory-page.tsx:93-131` `src/components/courses/super-admin-content-actions.tsx:120-145`
- Fix: Restore authoring accessibility with file alt/status and per-item actions.

## G2-9-025-059  [P2] GAP  facet F18  effort S
- Legacy: Literal Resources heading and complete subtitle `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:327-328`
- vNext now: Resources and different Manage lesson resources sentence `src/components/courses/super-admin-content-directory-page.tsx:85-89`
- Fix: Restore subtitle exactly.

## G2-17-003-042  [P3] GAP  facet F17  effort 
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/lesson-content.js:25-33 Alert showIcon for scope pending/errors; supports visible info/warning/error distinctions.
- vNext now: src/components/courses/super-admin-content-directory-page.tsx:62-79 EmptyState/ErrorState with role-dependent copy and buttons but no scope-status alert.
- Fix: Align alert aria-live and icon for pending/error where applicable.

## G2-9-025-052  [P3] GAP  facet F13  effort S
- Legacy: No empty rows table remains with Ant empty treatment `docs/legacy-source/frontend/src/pages/superadmin/sections/AdminResources.js:374-378`
- vNext now: No content found EmptyState with filter recovery `src/components/courses/super-admin-content-directory-page.tsx:164-166`
- Fix: Use old table empty state for no lesson-specific resource.
