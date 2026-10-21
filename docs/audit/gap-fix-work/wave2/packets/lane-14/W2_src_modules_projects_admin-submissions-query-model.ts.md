# Work packet (wave 2): edit src/modules/projects/admin-submissions-query-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/college-admin-projects-submissions.md, docs/audit/gap2/lane-4/superadmin-projects-submissions.md

## G2-4-006-006  [P2] GAP  facet F03  effort M
- Legacy: Submitted status dropdown six legacy statuses, Draft displayed `Draft (revising)`. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:41-48;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:723-731`)
- vNext now: New server filter values DRAFT,SUBMITTED,CHANGES_REQUESTED,APPROVED,UNDER_REVIEW,LOCKED,DRAFT_REVISING. (`src/modules/projects/admin-submissions-query-model.ts:14-17`)
- Fix: Map case-sensitive old status names/labels to vNext enums without losing URL view.

## G2-4-006-021  [P2] GAP  facet F06  effort M
- Legacy: Filter status exact six strings Submitted, Under Review, Changes Requested, Draft, Accepted, Locked. (`docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:41-48;docs/legacy-source/frontend/src/pages/college-admin/projects/submissions/index.js:723-731`)
- vNext now: Strict submissionStatus enum uppercase with additional DRAFT_REVISING. (`src/modules/projects/admin-submissions-query-model.ts:14-17`)
- Fix: Support legacy `?status` deep-link mapping and readable placeholder.

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

## G2-4-009-058  [P2] GAP  facet F19  effort M
- Legacy: Original default 10/page for both Submitted/Not submitted. (`docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:781-787;docs/legacy-source/frontend/src/pages/superadmin/projects/submissions/index.js:810-817`)
- vNext now: New default25 rows/page, server read. (`src/modules/projects/admin-submissions-query-model.ts:18-20`)
- Fix: Use SA default10 or explicitly agree to page-size change.
