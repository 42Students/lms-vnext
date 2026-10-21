# Work packet (wave 2): edit src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-9/college-admin-jobs-settings.md

## G2-9-013-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:10-16` — AdminLayout, JobsErrorBoundary, DriveSubNav and placements ModuleGroupGuard wrap college-admin/jobs/{jobId}/settings.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:1-17` — App Router college/placements/jobs/{jobId}/settings renders PageHeader and standalone elements, not the legacy route/shell.
- Fix: Preserve legacy workspace nav, breadcrumb and layout around vNext content.

## G2-9-013-003  [P2] MISSING  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:21-26` — Breadcrumb Drives -> companyName or jobTitle -> job; returnTo checked against jobs root.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:38-40` — No Drives breadcrumb or returnTo-preserving back target.
- Fix: Restore safe scoped breadcrumb and preserved return destination.

## G2-9-013-006  [P2] GAP  facet F02  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:82-90` — Subnavigation then loading or refresh alert, JobForm, Drive status card (non-draft), red Danger zone card.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:36-86` — Header, draft editor or read-only alert, Drive status section, conditional Delete drive disclosure.
- Fix: Match old hierarchy and visual divider/card ordering while retaining deliberate archive differences.

## G2-9-013-010  [P2] MISSING  facet F03  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:108-114` — Refresh warning contains Retry action and refreshing inline status.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:24-33` — Server data loaded before render; no in-page refresh retry/refreshing annotation.
- Fix: Add retry/refresh affordance that preserves visible saved details.

## G2-9-013-016  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:21-51` — GET job title/company name and totalApplications from hiring metrics; metrics may be unavailable independently.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:24-38` — Loads drive overview/job/eligibility plus programs/cohorts, no applicant impact count at page load.
- Fix: Expose independently loaded application impact with unknown/partial state.

## G2-9-013-024  [P2] MISSING  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobForm.js:120-172` — Company AutoComplete is client-filtered by substring, no pagination.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:40-66` — No company search/dropdown.
- Fix: Implement company search with scoped pagination for large directories.

## G2-9-013-053  [P2] GAP  facet F09  effort S
- Legacy: `docs/legacy-source/frontend/src/components/admin/placements/DriveSubNav.jsx:28-47` — Tab change while dirty opens Discard unsaved changes? confirm before navigation.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:36-40` — Only Overview link, no tab-specific dirty modal.
- Fix: Guard all navigation paths with same dirty disclosure.

## G2-9-013-071  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/frontend/src/components/admin/ModuleGroupGuard.jsx:58-65` — When feature flag lookup fails, guard fails open to server permissions; loading skeleton.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:20-23` — No module-flag loading fallback in page code.
- Fix: Add guarded module loading/failed distinction.

## G2-9-013-087  [P2] MISSING  facet F18  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:103-108` — Legacy Loading drive settings / Couldn't refresh drive settings.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:24-33` — No matching local refresh-state strings.
- Fix: Use exact loading and refresh messages where same state exists.

## G2-9-013-088  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:36-55` — Concurrent job+metric requests use Promise.allSettled; no table pagination.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:24-34` — Two server reads Promise.all and eager listPrograms/listCohorts for all programs on drafts.
- Fix: Parallelize/narrow academic option retrieval and isolate failures; profile many programs.

## G2-9-013-094  [P3] GAP  facet F21  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:36-51` — Two reads to AdminService and useChoices dropdown/hierarchy service, no job-runner in page.
- vNext now: `src/app/(authenticated)/college/placements/jobs/[jobId]/settings/page.tsx:24-34` — Server pulls overview/job, academic program/cohort reads; no external worker in page.
- Fix: Document service dependencies and failure isolation.
