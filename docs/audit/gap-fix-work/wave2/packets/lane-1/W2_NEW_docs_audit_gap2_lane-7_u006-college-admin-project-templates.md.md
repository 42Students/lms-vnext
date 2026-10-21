# Work packet (wave 2): NEW / MISSING items from docs/audit/gap2/lane-7/u006-college-admin-project-templates.md

32 findings. No vNext file yet: create the needed files, modules or routes inside the feature area of this lane.
Audit documents with full context: docs/audit/gap2/lane-7/u006-college-admin-project-templates.md

## G2-7-006-003  [P2] GAP  facet F01  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:129-134: View & use routes `/college-admin/projects/templates/:integerId`.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:64-66: View template routes `/college/projects/templates/:uuid`.
- Fix: Bridge legacy ID links and restore action label `View & use`.

## G2-7-006-004  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/templates/index.js:162-185: fixed h1/subtitle, Alert; single Templates Card with extra search+CSV.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:74-96: heading, separate search form, ListToolbar export and DataTable.
- Fix: Restore card with title and right-aligned search/export toolbar.

## G2-7-006-005  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/templates/index.js:184-225: Card `Templates` contains search field and Export CSV.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:78-95: search as standalone form; toolbar caption `Assigned project templates`.
- Fix: Keep original one-card layout and card gap.

## G2-7-006-006  [P2] GAP  facet F02  effort M
- Legacy: LFE/pages/college-admin/projects/templates/index.js:225-244: Skeleton or table inside Card, responsive x-scroll.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:96-103: DataTable at page root; no Card.
- Fix: Wrap data table in legacy Card.

## G2-7-006-008  [P2] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:120-125: four Section tags Overview/Sprints/Tasks/Resources.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:60-63: one text string separated by dots, includes Releases.
- Fix: Show four compact Tags, not string blob.

## G2-7-006-009  [P2] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:188-194: clearable Input.Search with search icon.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:78-91: plain native search and separate Search/Clear search links.
- Fix: Use icon search field with built-in clear affordance.

## G2-7-006-010  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:164-165: `Project templates`, `Pick a template to start a new project workspace.`
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:74-77: `Templates`, `Published project templates assigned to this college.`
- Fix: Restore both legacy heading/subtitle strings.

## G2-7-006-012  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:102-105: title and muted summary fallback em dash.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:55-58: title and summary only when present, no dash.
- Fix: Show em-dash when summary absent.

## G2-7-006-014  [P2] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:132-134: action `View & use`.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:64-66: action `View template`.
- Fix: Restore exact CTA copy reflecting create flow.

## G2-7-006-016  [P2] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/templates/index.js:226-233: page size10, no page-size selector, x=max-content scroll.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:96-103: all matched templates in one DataTable, no paginator.
- Fix: Add 10-row page navigation with correct totals.

## G2-7-006-017  [P2] GAP  facet F05  effort M
- Legacy: LFE/pages/college-admin/projects/templates/index.js:120-125: section-count tags Overview/Sprints/Tasks/Resources.
- vNext now: V/modules/projects/project-template-catalogue-model.ts:16-28: overview=1 if any key, includes release count, not legacy meaningful keys count.
- Fix: Compute meaningful goal/deliverables count; omit release tag for strict parity.

## G2-7-006-018  [P2] GAP  facet F05  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:73-85: backend performs search on query string before list returned.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:43-46: in-memory filter title+slug+version, adds numeric version matches.
- Fix: Align supported searchable fields and case/trim behavior.

## G2-7-006-019  [P2] GAP  facet F06  effort M
- Legacy: LFE/pages/college-admin/projects/templates/index.js:188-194: debounced auto-search after 350ms on input.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:78-91: explicit GET Search button required.
- Fix: Implement debounced/clearable automatic search with shallow URL update.

## G2-7-006-030  [P2] GAP  facet F11  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:141-155: no scope `Admin not assigned to a college`, role guidance, Projects tab strip preserved.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:24-25: generic missing-college component, no local group shell.
- Fix: Restore exact role guidance and navigation affordance.

## G2-7-006-032  [P2] GAP  facet F12  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:120-125: meaningful Overview count via templateSectionCount.
- vNext now: V/modules/projects/project-template-catalogue-model.ts:19-28: Overview=1 for any object keys, including unrelated legacy metadata.
- Fix: Count goal/deliverables only to match legacy section semantics.

## G2-7-006-035  [P2] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:235-240: empty no search `No templates are available to this college yet... ask them to assign one.`
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:99-100: `No assigned project templates` / `No project templates are currently assigned to this college.`
- Fix: Restore actionable assignment guidance text.

## G2-7-006-039  [P2] GAP  facet F14  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:199-217: exports current entire searched template dataset even if UI paged to 10.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:47-52,93-96: exports all searched templates; button says `this page`.
- Fix: Rename scope accurately and restore page-size parity (export all searched rows, not only first page).

## G2-7-006-042  [P2] GAP  facet F16  effort M
- Legacy: LFE/pages/college-admin/projects/templates/index.js:184-244: wrapped Card toolbar, x-scroll table for narrow viewport.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:78-103: vertically stack search on mobile, DataTable responsive column treatment.
- Fix: Match compact 240px search and horizontal-scroll 4-column table on mobile.

## G2-7-006-045  [P2] GAP  facet F17  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:226-233: Ant table semantic grid, headings and pagination keyboard navigation.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:54-67,96: semantic DataTable columns and links, no pager.
- Fix: Add accessible 10-row pagination.

## G2-7-006-046  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:164-166: h1 `Project templates`, subtitle `Pick a template to start a new project workspace.`
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:74-76: `Templates`, `Published project templates assigned to this college.`
- Fix: Restore both strings.

## G2-7-006-047  [P2] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:185,190,220,132-134: `Templates`, `Search title or slug`, `Export CSV`, `View & use`.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:81-95,65-66: `Search templates`, `Search by template or version`, `Export this page (CSV)`, `View template`.
- Fix: Restore section/control labels exactly.

## G2-7-006-050  [P2] GAP  facet F19  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:231: client paginator size10.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:96: DataTable no explicit pagination.
- Fix: Paginate 10 rows to prevent long list.

## G2-7-006-054  [P2] GAP  facet F22  effort L
- Legacy: LBE/model/ProjectTemplate.java:12-90: published global project_template with JSON overview/sprints/tasks/resources and templateVersion.
- vNext now: V/db/schema/projects.ts:26-165: project_templates + version JSONB blueprint + per-college assignment; identity UUID.
- Fix: Map schema/version/assignment joins and legacy section count semantics.

## G2-7-006-055  [P2] GAP  facet F22  effort M
- Legacy: LBE/controller/AdminProjectTemplateController.java:64-92: GET with optional collegeId/lifecycleStatus/search, backend published catalog.
- vNext now: V/modules/projects/template-service.ts:781-843: college active assignments only and PUBLISHED; search performed in page.tsx:43-46.
- Fix: Preserve contract for college catalog search results and assignment visibility.

## G2-7-006-057  [P2] GAP  facet F23  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:96-139: Sections as four Tags, action View & use.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:54-67: section-count text, action View template.
- Fix: Restore legacy per-row visual affordances and wording.

## G2-7-006-007  [P3] GAP  facet F03  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:4,195-221: DownloadOutlined small button `Export CSV`.
- vNext now: V/components/projects/project-template-catalogue-export.tsx:17-20: secondary button `Export this page (CSV)` no icon.
- Fix: Add download icon and literal Export CSV label.

## G2-7-006-011  [P3] GAP  facet F04  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:99-111: Version cell only number or em dash.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:59: `Version N` neutral badge.
- Fix: Use unadorned Version cell value with fallback.

## G2-7-006-033  [P3] GAP  facet F12  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:44-64: preserves existing URL query keys when shallow updating search.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:78-93: form GET only `q`, removes unknown prior keys.
- Fix: Preserve intended query state, sanitize unsupported keys.

## G2-7-006-036  [P3] GAP  facet F13  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:237-239: search empty `No templates match this search`.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:99-102: `No matching project templates` and clear link.
- Fix: Use exact empty search copy, optionally retain clear action.

## G2-7-006-043  [P3] GAP  facet F16  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:188-194: search width 240px, wrap in toolbar.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:79-85: full flex min-w0 search input.
- Fix: Restore search width at desktop, fullwidth mobile.

## G2-7-006-048  [P3] GAP  facet F18  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:150-151: `Admin not assigned to a college` with template-specific description.
- vNext now: V/components/projects/project-admin-missing-college.tsx:7-10: general no-college wording.
- Fix: Use exact no-scope copy.

## G2-7-006-052  [P3] GAP  facet F20  effort S
- Legacy: LFE/pages/college-admin/projects/templates/index.js:56-64: query history shallow replace, preserving other params.
- vNext now: V/app/(authenticated)/college/projects/templates/page.tsx:78-91: normal GET full-page navigation.
- Fix: Preserve history/back behavior with canonical q/filter state.
