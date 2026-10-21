# Work packet (wave 2): edit src/components/projects/project-admin-submissions-page.tsx

36 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-projects-submissions.md, docs/audit/gap2/lane-4/superadmin-projects-submissions.md

## G2-4-006-001  [P2] GAP  facet F01  effort M
- Legacy: College Admin `/college-admin/projects/submissions` sets Projects active sidebar item and wraps AdminGroupShell. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:96-104;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:965-971`)
- vNext now: New route `/college/projects/submissions`, ProjectAdminNav active submissions plus back link. (`src/components/projects/project-admin-submissions-page.tsx:117-140`)
- Fix: Reproduce legacy behavior and exact wording unless authorized scope divergence.

## G2-4-006-003  [P2] GAP  facet F02  effort M
- Legacy: Stats/filters/card then antd Submitted vs Not submitted tabs with full tables, review Modal. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:623-815;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:885-965`)
- vNext now: PageHeader and Tabs at top then separate stats, filters, article cards and review Dialog. (`src/components/projects/project-admin-submissions-page.tsx:117-212;src/components/projects/project-admin-submissions-page.tsx:213-302`)
- Fix: Reproduce legacy behavior and exact wording unless authorized scope divergence.

## G2-4-006-004  [P2] GAP  facet F02  effort M
- Legacy: Legacy metrics include submitted, not submitted, pending, needs learner action and reviewed. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:280-285;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:623-710`)
- vNext now: New four-link stats Active workspaces/Pending review/Needs student action/Reviewed; no Submitted+Not submitted stats tiles. (`src/components/projects/project-admin-submissions-page.tsx:170-185`)
- Fix: Restore both submitted/not-submitted count tiles and exact order.

## G2-4-006-009  [P2] GAP  facet F03  effort M
- Legacy: Open, Review, Reassign mentor buttons grouped per row; no Assign mentor absent mentor. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:379-399`)
- vNext now: Open · Review submission, Review, Reassign mentor or Assign mentor. (`src/components/projects/project-admin-submissions-page.tsx:275-288`)
- Fix: Match action labels/wrapping; retain assign-mentor functional enhancement if approved.

## G2-4-006-010  [P2] GAP  facet F03  effort M
- Legacy: Submitted table allows row-expand mentor feedback. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:839-846`)
- vNext now: New article renders summary and links but no dedicated expandable mentor-feedback row. (`src/components/projects/project-admin-submissions-page.tsx:245-274`)
- Fix: Add inline expandable mentor feedback under each delivery.

## G2-4-006-011  [P2] GAP  facet F04  effort M
- Legacy: Workspace display uses `normaliseCollegeScopedName`, mentor name secondary. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:403-416`)
- vNext now: New uses projectTitle and version; mentor not shown in article header. (`src/components/projects/project-admin-submissions-page.tsx:217-235`)
- Fix: Show normalized workspace name and mentor line.

## G2-4-006-013  [P2] GAP  facet F04  effort M
- Legacy: Reviews `reviewedByName` plus `reviewedByType==ADMIN` orange tag. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:471-491`)
- vNext now: New `Reviewed by` text with no visible Admin reviewer tag. (`src/components/projects/project-admin-submissions-page.tsx:251-255`)
- Fix: Retain reviewer type distinction.

## G2-4-006-016  [P2] GAP  facet F05  effort M
- Legacy: Submitted table columns Workspace, Submission type, Review status, Pending, Submitted, Revisions, Reviewed by, link/file fields, Status, Actions. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:403-610`)
- vNext now: New submitted renders article cards + summary, no equivalent titled table header columns. (`src/components/projects/project-admin-submissions-page.tsx:211-290`)
- Fix: Restore DataTable column layout with sort controls.

## G2-4-006-039  [P2] GAP  facet F12  effort M
- Legacy: Under Review excluded from pending by `isPendingReview` (only empty/submitted), though other old superadmin page differs. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:50-55`)
- vNext now: New `UNDER_REVIEW` has explicit needsDoing chip. (`src/components/projects/project-admin-submissions-page.tsx:123-129`)
- Fix: Ensure Pending review tile does not count Under Review unless scope approved.

## G2-4-006-042  [P2] GAP  facet F13  effort M
- Legacy: Loading Skeleton, on failure button Retry loading submissions, clears counts on fetch error. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:164-207;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:881-884`)
- vNext now: ErrorState Submissions unavailable with retry preserving URL query; tabs separate errors. (`src/components/projects/project-admin-submissions-page.tsx:97-114;src/components/projects/project-admin-submissions-page.tsx:141-145`)
- Fix: Reproduce skeleton/partial failure state, keep filters.

## G2-4-006-043  [P2] GAP  facet F13  effort M
- Legacy: No submissions yet or No submissions match this search. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:849-855`)
- vNext now: No matching deliveries + Clear filters. (`src/components/projects/project-admin-submissions-page.tsx:207-210`)
- Fix: Use legacy no-data strings based on active filter.

## G2-4-006-044  [P2] GAP  facet F13  effort M
- Legacy: Not-submitted empty No matching workspace has an outstanding submission or No matching workspaces on this page. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:870-877`)
- vNext now: No pending submissions; All matching workspaces have a submission. (`src/components/projects/project-admin-submissions-page.tsx:164-165`)
- Fix: Match separate no outstanding vs wrong-page messages.

## G2-4-006-048  [P2] GAP  facet F14  effort M
- Legacy: Legacy submission attachment from attachmentUrl or submissionFileUrl, optional downloaded on click. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:291-302;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:517-526`)
- vNext now: vNext uses attachments JSON items entry.url and sourceUrl/demoUrl. (`src/components/projects/project-admin-submissions-page.tsx:257-273`)
- Fix: Map legacy single attachment/download fallback to vNext evidence links.

## G2-4-006-050  [P2] GAP  facet F16  effort M
- Legacy: Responsive AntD Row/Col with cards and Table horizontal scroll max-content. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:623-815;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:833-869`)
- vNext now: Mobile-friendly article cards, DataTable only Not submitted. (`src/components/projects/project-admin-submissions-page.tsx:146-165;src/components/projects/project-admin-submissions-page.tsx:211-290`)
- Fix: Compare breakpoint and reproduce table layout/scroll where parity required.

## G2-4-006-053  [P2] GAP  facet F18  effort M
- Legacy: Tab exact `Submitted (N)` versus `Not submitted (N)`. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:804-880`)
- vNext now: New `All submissions` and `Not submitted` with counts. (`src/components/projects/project-admin-submissions-page.tsx:132-139`)
- Fix: Restore Submitted label/definition, not generic All submissions.

## G2-4-006-054  [P2] GAP  facet F18  effort M
- Legacy: Status labels `Changes Requested`, `Under Review`, `Draft (revising)`. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:41-48`)
- vNext now: StatusBadge uses SUBMITTED=>Under Review; code DRAFT_REVISING. (`src/components/projects/project-admin-submissions-page.tsx:237-243`)
- Fix: Match capitalization/spaces and determine Submitted vs Under Review code state.

## G2-4-006-055  [P2] GAP  facet F18  effort M
- Legacy: Button `Open`, `Review`, `Reassign mentor`, export `Export displayed page CSV`. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:379-399;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:737-800`)
- vNext now: `Open · Review submission`, `Review`, `Assign mentor` and `Export CSV`. (`src/components/projects/project-admin-submissions-page.tsx:275-288;src/components/projects/project-submissions-page-export.tsx:32-34`)
- Fix: Restore exact visible labels.

## G2-4-006-066  [P2] MISSING  facet F23  effort M
- Legacy: Legacy Not submitted tab uses same toolbar export button for displayed unsubmitted page. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:733-799;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:859-879`)
- vNext now: New export action only rendered on ALL submissions result. (`src/components/projects/project-admin-submissions-page.tsx:170-205`)
- Fix: Restore unsubmitted CSV export.

## G2-4-009-001  [P2] GAP  facet F01  effort M
- Legacy: `/superadmin/projects/submissions` under SuperAdminLayout and Projects group tabs. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:1-8;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:576-599`)
- vNext now: New route `/admin/projects/submissions`, ProjectAdminNav active submissions plus back link. (`src/app/(authenticated)/admin/projects/submissions/page.tsx:11-59;src/components/projects/project-admin-submissions-page.tsx:117-140`)
- Fix: Align old behavior and wording unless this difference is approved.

## G2-4-009-004  [P2] GAP  facet F02  effort M
- Legacy: Main page header `Submissions dashboard`, subtitle exact, then 3 KPI cards, 3 quick-filter cards, `Submissions` Card and Tabs. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:597-680;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:679-766`)
- vNext now: PageHeader, ProjectAdminNav and tabs above summary; four linked KPI tiles, filters, individual article list. (`src/components/projects/project-admin-submissions-page.tsx:117-212`)
- Fix: Match sequence/header, three stat tiles and card/table hierarchy.

## G2-4-009-005  [P2] GAP  facet F02  effort M
- Legacy: Stat tiles constrained to narrow-content width, wide data table intentionally uncapped. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:612-625;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:679-683`)
- vNext now: New stats grid full available area; result list articles separate. (`src/components/projects/project-admin-submissions-page.tsx:170-184;src/components/projects/project-admin-submissions-page.tsx:211-293`)
- Fix: Restrict stat width but keep main roster full-width.

## G2-4-009-006  [P2] GAP  facet F03  effort M
- Legacy: KPI cards Active workspaces, Pending review, Needs student action each icon/prefix; pending >0 amber. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:625-645`)
- vNext now: New 4 tiles: Active workspaces, Pending review, Needs student action, Reviewed, all links, no icons/amber. (`src/components/projects/project-admin-submissions-page.tsx:171-184`)
- Fix: Use exactly three primary KPI cards and color rule.

## G2-4-009-008  [P2] GAP  facet F03  effort M
- Legacy: `Submissions` card header search workspace or mentor, status dropdown only on Submitted, CSV button. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:679-763`)
- vNext now: New FilterBar and ListToolbar, global status/search, export inside submitted section. (`src/components/projects/project-admin-submissions-page.tsx:187-205`)
- Fix: Restore exact card title, toolbar positioning and conditional filter.

## G2-4-009-010  [P2] GAP  facet F03  effort M
- Legacy: `Reassign mentor` has EditOutlined icon, only if mentorId. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:355-373`)
- vNext now: New `Assign mentor` fallback when missing mentor, no old icon. (`src/components/projects/project-admin-submissions-page.tsx:281-288`)
- Fix: Keep conditional Reassign when mentor exists and icon; optional Assign as extra.

## G2-4-009-012  [P2] GAP  facet F04  effort M
- Legacy: Workspace row heading normalized college-scoped name, mentor secondary line. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:379-396`)
- vNext now: New article projectTitle, version/date; no mentor subtitle. (`src/components/projects/project-admin-submissions-page.tsx:217-235`)
- Fix: Render original normalized project title and mentor.

## G2-4-009-018  [P2] GAP  facet F05  effort M
- Legacy: Table default page size 10, no size changer, client-paginated and default Submitted sorting newest first. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:781-787`)
- vNext now: New server list pageSize defaults25 (10–100 allowed), display articles. (`src/modules/projects/admin-submissions-query-model.ts:18-20;src/components/projects/project-admin-submissions-page.tsx:295-301`)
- Fix: Use default10 for SA submissions and default submitted sort.

## G2-4-009-020  [P2] GAP  facet F05  effort M
- Legacy: Not submitted Table 10/page with Workspace,Mentor,Status,Progress,Inactive,Actions. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:518-573;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:807-817`)
- vNext now: New Not submitted DataTable omits mentor; uses 25/page default. (`src/components/projects/project-admin-submissions-page.tsx:150-168;src/modules/projects/admin-submissions-query-model.ts:18-20`)
- Fix: Add Mentor column and 10/page for SA view.

## G2-4-009-021  [P2] GAP  facet F05  effort M
- Legacy: Quick filters and search run entirely client-side over all college projects; counts update immediately. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:154-188;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:233-265`)
- vNext now: New URL-scoped server-filtered list and summary, different interaction/page reset. (`src/components/projects/project-admin-submissions-page.tsx:77-96;src/modules/projects/admin-submissions-query-model.ts:10-37`)
- Fix: Match search/filter instant behavior and selected chip while retaining scalable server paging.

## G2-4-009-034  [P2] GAP  facet F10  effort M
- Legacy: Legacy GET `/api/v1/admin/projects/byCollege` returns all projects, client splits into Submitted/Not submitted. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:154-176`)
- vNext now: New DB scoped result pages and distinct unsubmitted service/list. (`src/components/projects/project-admin-submissions-page.tsx:77-96`)
- Fix: Verify counts align across both independent queries and all version rows.

## G2-4-009-042  [P2] GAP  facet F13  effort M
- Legacy: Loading displays Skeleton eight-row form, errors `Submissions could not be loaded` and Retry? (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:609-611;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:833-835`)
- vNext now: New `Submissions unavailable` ErrorState and Retry loading submissions link; no old skeleton. (`src/components/projects/project-admin-submissions-page.tsx:97-115`)
- Fix: Restore domain-specific error heading and skeleton state.

## G2-4-009-043  [P2] GAP  facet F13  effort M
- Legacy: Submitted empty `No submissions match this search` or `No submissions yet`. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:797-803`)
- vNext now: New `No matching deliveries` and `No final-delivery versions match these filters`. (`src/components/projects/project-admin-submissions-page.tsx:207-210`)
- Fix: Split no data vs filtered/no match with exact text.

## G2-4-009-044  [P2] GAP  facet F13  effort M
- Legacy: Not submitted empty `No workspaces match this search` or `Every active workspace has submitted`. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:819-827`)
- vNext now: New `No pending submissions` / `All matching workspaces have a submission`. (`src/components/projects/project-admin-submissions-page.tsx:164-165`)
- Fix: Restore explicit all-active-submitted empty wording.

## G2-4-009-050  [P2] GAP  facet F16  effort M
- Legacy: Desktop AntD 3-column stat Row cards, then full width horizontally scrollable table x=max-content. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:612-676;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:781-817`)
- vNext now: New responsive four-grid stats then article list; DataTable only Not submitted. (`src/components/projects/project-admin-submissions-page.tsx:170-184;src/components/projects/project-admin-submissions-page.tsx:211-293`)
- Fix: Restore layout widths/card margins/table scroll rather than article list.

## G2-4-009-052  [P2] GAP  facet F17  effort M
- Legacy: Quick-filter cards keyboard Enter/Space toggle with role button, tabIndex0 aria-pressed. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:654-669`)
- vNext now: New KPI links and needsDoing links, no pressed toggle semantics. (`src/components/projects/project-admin-submissions-page.tsx:170-184`)
- Fix: Use accessible stateful buttons with aria-pressed.

## G2-4-009-054  [P2] GAP  facet F18  effort M
- Legacy: Page title `Submissions dashboard`, section title `Submissions`, tabs `Submitted (N)` and `Not submitted (N)`. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:599-604;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:679-683;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:763-811`)
- vNext now: Same header title, tab labels `All submissions` and `Not submitted`, missing section card title. (`src/components/projects/project-admin-submissions-page.tsx:120-140`)
- Fix: Restore exact tab labels and Card title.

## G2-4-009-056  [P2] GAP  facet F18  effort M
- Legacy: Buttons `Open`, `Review`, `Reassign mentor`, `Export CSV`. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:355-373;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:705-760`)
- vNext now: `Open · Review submission`, `Review`, `Assign mentor` or `Reassign mentor`, `Export CSV`. (`src/components/projects/project-admin-submissions-page.tsx:275-288;src/components/projects/project-submissions-page-export.tsx:32-34`)
- Fix: Match old action vocabulary and icon placement.
