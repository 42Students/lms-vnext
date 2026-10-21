# Work packet: edit src/modules/placements/college-drive-read-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-repository.md, docs/audit/gap2/lane-9/college-admin-jobs-all.md

## G2-3-015-002  [P1] MISSING  facet F01  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:18-20`
- vNext now: `src/db/schema/placements.ts:462-513`, `src/modules/placements/college-drive-read-service.ts:24-29`
- Fix: Legacy recruiter request list filters recruiterId+collegeId and sorts job id DESC; vNext recruiter requests use distinct placement_drive_requests and recruiter/college scopes. Provide compatible join/list for old requests or record intentional migration.

## G2-3-015-011  [P1] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:130-146`
- vNext now: `src/modules/placements/college-drive-read-service.ts:57-83`
- Fix: Legacy college-admin list includes collegeId current OR unassigned college job with orgId, active path excludes EXTERNAL_ONLY; vNext requires exact non-null collegeId and cannot show org-wide jobs. Migrate/link shared legacy org jobs.

## G2-3-015-027  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:130-146`
- vNext now: `src/modules/placements/college-drive-read-service.ts:27-64`
- Fix: Legacy org-only jobs shared with college admins when collegeId null; vNext DB has nonnull collegeId and strict permission. Implement explicit read grants or migrate shared jobs per college, no blanket cross-college fallback.

## G2-9-015-027  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:565-572` — Applicants uses applicationCount or applicantCount, null shown em dash.
- vNext now: `src/modules/placements/college-drive-read-service.ts:39-42` — Count only application status SUBMITTED in subquery, default 0.
- Fix: Reconcile how withdrawn/deleted applications count in legacy totals.

## G2-9-015-059  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:770-783` — searchAdminJobs GET /api/v1/admin/jobs/search paginated by page0 size20, status search postedDate DESC.
- vNext now: `src/modules/placements/college-drive-read-service.ts:26-81` — SQL scoped list defaults PUBLISHED/TITLE, status enum.
- Fix: Reconcile sorting/filter mapping and payload names.

## G2-9-015-069  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:565-575` — Applicant count based on full applicationCount including legacy status flags.
- vNext now: `src/modules/placements/college-drive-read-service.ts:39-42` — Only SUBMITTED applications counted.
- Fix: Reconcile count metric definition with withdrawn/deleted legacy record rules.

## G2-9-015-090  [P1] GAP  facet F19  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:240-265` — Legacy server pagination avoids unbounded full history and sorts postedDate descending.
- vNext now: `src/modules/placements/college-drive-read-service.ts:76-92` — PostgreSQL count + bounded 25 query, sort TITLE default.
- Fix: Maintain bounded query but sort newest posted first; size20.

## G2-9-015-103  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:110-165` — Admin job search status all/active/draft/closed accepts page and size.
- vNext now: `src/modules/placements/college-drive-read-service.ts:26-59` — Filters by enum with default PUBLISHED; joined season and company.
- Fix: Restore all statuses as default and handle archived separately.

## G2-3-015-017  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:99-112`
- vNext now: `src/modules/placements/job-service.ts:74-76`, `src/modules/placements/college-drive-read-service.ts:27-29`
- Fix: Legacy by-id active query excludes drafts and deleted, deleted-inclusive org query available separately; vNext generic loadJob by UUID includes any status before caller gate. Ensure errors distinguish read unavailable/forbidden vs history allowed.
