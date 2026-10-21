# Work packet: edit src/app/(authenticated)/admin/placements/drives/page.tsx

15 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-all.md, docs/audit/gap2/lane-11/l17-u030-drives-landing.md, docs/audit/gap2/lane-8/super-admin-jobs-directory.md

## G2-10-016-040  [P1] MISSING  facet F09  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-475 — Delete modal confirms job name and details impact; keeps modal for retry.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:80-86 — No Delete trigger in list.
- Fix: Add row preview and confirm with retry, respecting new archive safety.

## G2-10-016-046  [P1] MISSING  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:399-477 — Legacy deletion-impact GET and delete mutation available from row.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:80-85 — No row delete; modern per-job archive call requires navigation.
- Fix: Add navigable impact preview with API mapping.

## G2-10-016-054  [P1] MISSING  facet F13  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:812-825 — Stale refresh warning retains previous rows and allows Retry.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:42-60 — Server fetch failure replaces table with ErrorState; no last rows.
- Fix: Preserve last success when safe/authorized, show warning.

## G2-17-030-058  [P1] GAP  facet F23  effort L
- Legacy: Legacy inline duplicate, deadline, retention and lookup actions embedded in one landing; DrivesLanding.js:565-698
- vNext now: vNext separate directory/create/deadline/retention/student lookup pages; admin/placements/page.tsx:28-84; admin/placements/drives/page.tsx:80-115
- Fix: Restore first-class actions in landing while keeping routable backup workflows.

## G2-8-030-006  [P1] GAP  facet F03  effort M
- Legacy: Old Create Job, View Applications, Edit, Open/Close, Delete per row docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:566-610,719-721.
- vNext now: New Create drive, Open drive, bulk Open/Close but lacks Edit/Delete row buttons on index src/app/(authenticated)/admin/placements/drives/page.tsx:71-84; src/components/placements/super-admin-bulk-drive-actions.tsx:51-77.
- Fix: Restore direct edit/delete and view applications row actions.

## G2-8-030-010  [P1] GAP  facet F04  effort M
- Legacy: Old deadline from applicationDeadline or importantDates.find label application deadline, format DD MMM YYYY, missing — docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:195-203,27-39.
- vNext now: New only applicationDeadline Date, IST formatter, missing — src/app/(authenticated)/admin/placements/drives/page.tsx:65-67; src/modules/placements/admin-drive-directory-model.ts:43-49.
- Fix: Backfill legacy importantDates-deadline fallback before dropping old source.

## G2-8-030-012  [P1] GAP  facet F04  effort M
- Legacy: Old Applicants count applicationCount or applicantCount else — docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:556-562.
- vNext now: New metrics.submittedApplications only; zero printed even when old unknown src/app/(authenticated)/admin/placements/drives/page.tsx:69-70.
- Fix: Ensure count meaning matches all applicant statuses, not only SUBMITTED.

## G2-8-030-023  [P1] MISSING  facet F06  effort M
- Legacy: Old delete impact includes activeApps,affectedLearners,openInterviews docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-450.
- vNext now: New directory no Delete action; no impact confirm in this component src/app/(authenticated)/admin/placements/drives/page.tsx:59-75.
- Fix: Restore dependency impact preview and guarded deletion route.

## G2-8-030-033  [P1] GAP  facet F10  effort M
- Legacy: Old searchAdminJobs (page0,size20,status,search,postedDate desc), result content/totalElements docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:249-267.
- vNext now: New SSR getPlacementTpoOperations scoped full operations, filters+pages locally src/app/(authenticated)/admin/placements/drives/page.tsx:38-57; src/modules/placements/admin-drive-directory-model.ts:16-28.
- Fix: Implement DB paging and count at query layer before loading entire history.

## G2-8-030-036  [P1] GAP  facet F10  effort M
- Legacy: Old deleteAdminJob via impact preview, preserves apps/notifies learners docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:421-460.
- vNext now: New page links to job detail; delete lifecycle not reachable on directory src/app/(authenticated)/admin/placements/drives/page.tsx:71-75.
- Fix: Restore same action and cascade/soft-delete audit path with impact preview.

## G2-8-030-055  [P1] GAP  facet F22  effort M
- Legacy: Old job active/draft booleans, postedDate/createdAt, importantDates arrays docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:195-203,249-264,578-596.
- vNext now: New placementJobs status enum, publishedAt, applicationDeadline, job employmentType src/app/(authenticated)/admin/placements/drives/page.tsx:59-70; src/modules/placements/admin-drive-directory-model.ts:15-40.
- Fix: Create legacy column->new field mapping for status/posted/deadline/jobType.

## G2-10-016-037  [P2] MISSING  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:405-414 — Job deleted successfully or Failed to delete job toast.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:70-113 — Delete not available on table.
- Fix: If row archive added, implement truthful toast/error.

## G2-10-016-038  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:781-821 — Distinct statusActionError 'Drive status was not changed' and bulk 'Some drive statuses were not changed'.
- vNext now: src/app/(authenticated)/admin/placements/drives/page.tsx:42-60 — Top fetch has generic ErrorState; bulk error InlineNotice.
- Fix: Match alert titles/retry placement.

## G2-8-030-024  [P2] GAP  facet F07  effort M
- Legacy: Old list fetch failure exact Failed to load jobs. Please try again. docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:249-281.
- vNext now: New Drives unavailable ErrorState and Retry loading drives src/app/(authenticated)/admin/placements/drives/page.tsx:38-53.
- Fix: Preserve exact copy and keep previous data when refresh fails.

## G2-8-030-028  [P2] MISSING  facet F08  effort M
- Legacy: Old delete success Job deleted successfully docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:399-418.
- vNext now: New directory has no Delete request flow src/app/(authenticated)/admin/placements/drives/page.tsx:71-75.
- Fix: Restore archive/delete success feedback where action allowed.
