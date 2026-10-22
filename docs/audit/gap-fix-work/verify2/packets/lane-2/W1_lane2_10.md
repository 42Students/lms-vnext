# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-9-004-042 [P1] MISSING facet F09
- Files: src/components/placements/placement-employer-relationships.tsx
- Legacy: History modal width720 with KPI stats and job table (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:523-579`)
- Expected fix: Restore drive-history modal and data API.

## G2-9-004-060 [P1] MISSING facet F13
- Files: src/components/placements/placement-employer-relationships.tsx
- Legacy: History modal Skeleton/Error/Retry/No jobs states (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:531-541`)
- Expected fix: Implement history states with independent loading/error.

## G2-9-004-066 [P1] GAP facet F15
- Files: src/components/placements/placement-employer-relationships.tsx
- Legacy: Internal notes explicitly not student-visible (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:506-518`)
- Expected fix: Restore private notes with no learner leak; do not treat trusted flag as notes.

## G2-9-004-069 [P1] MISSING facet F17
- Files: src/components/placements/placement-employer-relationships.tsx
- Legacy: History job row keyboard Enter/Space opens job with role/button (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:553-570`)
- Expected fix: Implement focusable job history row/links with keyboard activation.

## G2-9-004-088 [P1] MISSING facet F23
- Files: src/components/placements/placement-employer-relationships.tsx
- Legacy: Legacy full details/history/edit/contact management in page (`docs/legacy-source/frontend/src/pages/superadmin/sections/Companies.js:431-579`)
- Expected fix: Restore vetted college-owned metadata/history features without cross-tenant identity mutation.

## G2-9-006-041 [P1] GAP facet F11
- Files: src/app/(authenticated)/college/departments/page.tsx
- Legacy: Warning Admin not assigned to a college (`docs/legacy-source/frontend/src/pages/college-admin/departments.js:19-33`)
- Expected fix: Restore exact warning and Contact administrator.

## G2-9-009-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/index.js:1-5` — Root /college-admin returns HTTP 302 to /college-admin/dashboard
- Expected fix: Create canonical root alias redirect to the corresponding college dashboard or explicitly document route remapping

## G2-9-015-027 [P1] GAP facet F04
- Files: src/modules/placements/college-drive-read-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:565-572` — Applicants uses applicationCount or applicantCount, null shown em dash.
- Expected fix: Reconcile how withdrawn/deleted applications count in legacy totals.

## G2-9-015-059 [P1] GAP facet F10
- Files: src/modules/placements/college-drive-read-service.ts
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:770-783` — searchAdminJobs GET /api/v1/admin/jobs/search paginated by page0 size20, status search postedDate DESC.
- Expected fix: Reconcile sorting/filter mapping and payload names.

## G2-9-015-069 [P1] GAP facet F12
- Files: src/modules/placements/college-drive-read-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:565-575` — Applicant count based on full applicationCount including legacy status flags.
- Expected fix: Reconcile count metric definition with withdrawn/deleted legacy record rules.

## G2-9-015-090 [P1] GAP facet F19
- Files: src/modules/placements/college-drive-read-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:240-265` — Legacy server pagination avoids unbounded full history and sorts postedDate descending.
- Expected fix: Maintain bounded query but sort newest posted first; size20.

## G2-9-016-004 [P1] GAP facet F01
- Files: src/components/placements/college-drive-attention-cards.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:227-230` — Drive card routes to detail /college-admin/jobs/{jobId} preserving safe returnTo.
- Expected fix: Make card itself navigate overview with safe returnTo.

## G2-9-016-017 [P1] GAP facet F03
- Files: src/components/placements/college-drive-attention-cards.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:410-457` — Attention category rows include learnerName, jobTitle, detail, RightOutlined.
- Expected fix: Restore candidate-level attention details and deep links.

## G2-9-016-021 [P1] MISSING facet F03
- Files: src/components/placements/college-drive-attention-cards.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:566-586` — MoreOutlined dropdown Duplicate as new drive, Extend deadline.
- Expected fix: Add icon dropdown with duplicate/extend.

## G2-9-016-028 [P1] MISSING facet F04
- Files: src/components/placements/college-drive-attention-cards.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:203-208` — Client search matches jobTitle/companyName, only first60, count shown.
- Expected fix: Add q search with bounded count and warning beyond first60.

## G2-9-016-035 [P1] MISSING facet F05
- Files: src/components/placements/college-drive-attention-cards.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:565-584` — Drive menu offers duplicate and deadline, not row-level stage mutation.
- Expected fix: Add full options dropdown and stateful duplicate modal.

## G2-9-016-038 [P1] GAP facet F06
- Files: src/components/placements/placement-job-create-workspace.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:656-673` — New/Duplicate form in 800px modal, duplicateFrom, empty job, collegeId, success refresh both collections.
- Expected fix: Restore duplicateFrom data mapping and modal sequence.

## G2-9-016-059 [P1] MISSING facet F10
- Files: src/app/(authenticated)/college/placements/page.tsx
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:920-955` — getAdminDataRetentionReport collegeId,180 lazy fetch.
- Expected fix: Add lazy server route scoped to college for retention sample.

## G2-9-016-061 [P1] GAP facet F10
- Files: src/components/placements/placement-job-create-workspace.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:565-586` — Duplicate uses existing job as JobForm duplicateFrom, creates distinct new drive.
- Expected fix: Expose duplicate to College Admin, clone only metadata/no applicants.

## G2-9-016-090 [P1] GAP facet F19
- Files: src/components/placements/college-drive-attention-cards.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:199-208` — Client filters active top60; explicitly warns when more active results than loaded.
- Expected fix: Surface cap notice/search-all link, prevent invisible older drives.

## G2-9-016-105 [P1] GAP facet F23
- Files: src/components/placements/placement-job-create-workspace.tsx
- Legacy: `src/components/placements/placement-job-create-workspace.tsx:48-57` — Old duplicate available for active card to College Admin.
- Expected fix: Add college-admin clone with safe metadata-only semantics.

## G2-9-012-017 [P1] GAP facet F05
- Files: src/modules/placements/college-drive-interviews-service.ts
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:89-102` — Sort Date earliest by default, plus Latest/Job/Status options
- Expected fix: Expose configurable appointment date/job/status sort and default earliest

## G2-9-012-067 [P1] GAP facet F22
- Files: src/modules/placements/college-drive-interviews-service.ts
- Legacy: `docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:396-640` — Legacy date/type/status/mode fields independently filter original Interview records
- Expected fix: Keep candidate appointment distinct from drive-round registry in schema and UI

## G2-9-011-059 [P1] GAP facet F20
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/overview/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:197-205` — Expired badge based on parsePlacementUtcDateTime and current time
- Expected fix: Check expiry against IST/inclusive deadline during SSR and UI refresh

## G2-9-014-034 [P1] MISSING facet F06
- Files: src/app/(authenticated)/college/placements/jobs/[jobId]/shortlisted/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:215-219` — Reject modals retain optional rejection reason and batch confirmation.
- Expected fix: Expose per-row/bulk rejection reason/confirmation.
