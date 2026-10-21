# Work packet (wave 2): edit src/modules/placements/college-drive-applications-service.ts

37 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-jobs-jobid-applications.md, docs/audit/gap2/lane-14/u011-placement-job-service-impl.md, docs/audit/gap2/lane-17/placement-job-service.md, docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-8/admin-job-service.md, docs/audit/gap2/lane-8/job-application-search-dto.md

## G2-10-011-016  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1321-1345 — Age uses last status update or applied timestamp, amber/gray dot, 'today' or Nd.
- vNext now: src/modules/placements/college-drive-applications-service.ts:41-53; src/components/placements/college-application-pipeline-controls.tsx:93-95 — Age derives from submission only and prints N days without dot.
- Fix: Expose last-stage-updated time and calculate legacy age indicator, not only days since submission.

## G2-14-011-013  [P2] GAP  facet F05  effort M
- Legacy: Applications default page zero size twenty max hundred `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:439-476`
- vNext now: New college page model uses own page size and indexing `src/modules/placements/college-drive-applications-service.ts:25-32` `src/modules/placements/college-drive-applications-service.ts:99-109`
- Fix: Preserve legacy pagination size and page numbering in adapter

## G2-14-011-054  [P2] GAP  facet F13  effort S
- Legacy: Legacy paginated response content totalElements totalPages first last `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:478-492`
- vNext now: New college list items total totalPages stageCounts `src/modules/placements/college-drive-applications-service.ts:99-110`
- Fix: Map empty and first/last pagination keys

## G2-14-011-056  [P2] GAP  facet F13  effort S
- Legacy: Legacy negative page clamps to zero and nonpositive size falls back `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:475-480`
- vNext now: New parsed college pagination `src/modules/placements/college-drive-applications-service.ts:25-32`
- Fix: Choose compatibility clamp behavior

## G2-14-011-057  [P2] GAP  facet F14  effort M
- Legacy: Legacy CSV export cap 20000 with truncated warning row `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:1451-1514`
- vNext now: New college export cap constant and truncated metadata `src/modules/placements/college-drive-applications-service.ts:114-129`
- Fix: Align cap and warning row text

## G2-17-012-004  [P2] GAP  facet F02  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:70-150 — Applications, notes, bulk pipeline mutations.
- vNext now: src/modules/placements/college-drive-applications-service.ts:25-113 — College drive application list and separate pipeline service.
- Fix: Expose corresponding org-wide applications surface and controls.

## G2-17-012-016  [P2] GAP  facet F05  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/PlacementJobServiceImpl.java:743-759 — Skills filter uses in-memory fallback because JSON; others SQL-paged.
- vNext now: src/modules/placements/college-drive-applications-service.ts:100-103 — Uses DB filtered/page query.
- Fix: Preserve skills match-any case-insensitive semantics while keeping SQL scale.

## G2-17-012-032  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PlacementJobController.java:755-787 — GET /applications/export streams UTF8 CSV attachment with filtered rows.
- vNext now: src/modules/placements/college-drive-applications-service.ts:114-131 — College CSV exporter for scoped drive.
- Fix: Provide org-wide filtered CSV and matching download filename.

## G2-17-012-041  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:153-168 — CSV export mirrors on-screen filters, UTF8 bytes.
- vNext now: src/modules/placements/college-drive-applications-service.ts:114-130 — UTF8 BOM CSV, college roster-specific columns.
- Fix: Align header order/filter scope and BOM policy, preserve Excel interoperability.

## G2-17-012-053  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/PlacementJobService.java:94-103 — Search first, last, email, skills any case-insensitive.
- vNext now: src/modules/placements/college-drive-applications-service.ts:25-95 — College roster filters and fuzzy query different.
- Fix: Maintain casefold/Unicode name+email and skill matching semantics.

## G2-2-016-012  [P2] GAP  facet F05  effort M
- Legacy: Legacy application list pageable with filters and search (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1185-1215`)
- vNext now: VNext read model for college drive applicants separated from job CRUD (`src/modules/placements/college-drive-applications-service.ts:25-115`)
- Fix: Map legacy list columns/filter/sort/page count without leaking applicant profile PII

## G2-2-016-078  [P2] GAP  facet F05  effort M
- Legacy: Legacy application list computes totalElements,totalPages,number,size `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:445-484`
- vNext now: New response computes total and totalPages but fixed 25 UI `src/modules/placements/college-drive-applications-service.ts:99-111`
- Fix: Expose selectable page size and exact backend meta fields

## G2-8-012-012  [P2] GAP  facet F05  effort M
- Legacy: Legacy application list pageable with filters and search (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:1185-1215`)
- vNext now: VNext read model for college drive applicants separated from job CRUD (`src/modules/placements/college-drive-applications-service.ts:25-115`)
- Fix: Map legacy list columns/filter/sort/page count without leaking applicant profile PII

## G2-8-014-001  [P2] GAP  facet F01  effort M
- Legacy: Search DTO implements SearchableDTO, used by /api/v2/job-applications/search (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:13-30; docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-81`)
- vNext now: New college job applicants list scoped to a specific job and college (`src/modules/placements/college-drive-applications-service.ts:25-39`)
- Fix: Map legacy org-wide application search route to role-appropriate scoped list

## G2-8-014-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy search spans all applications in an organization (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:99-116`)
- vNext now: New college applicant query requires one jobId (`src/modules/placements/college-drive-applications-service.ts:25-39`)
- Fix: Provide authorized all-drives search if TPO historically needs it

## G2-8-014-003  [P2] GAP  facet F02  effort M
- Legacy: Legacy search displayName concatenates learnerName + ' - ' + jobTitle (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:23-29`)
- vNext now: New list stores separate name/roleTitle/job title display (`src/modules/placements/college-drive-applications-service.ts:35-53`)
- Fix: Match result-option name/title concatenation with explicit missing-value fallback

## G2-8-014-005  [P2] GAP  facet F04  effort M
- Legacy: Legacy id Integer (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:14-14`)
- vNext now: New application id UUID (`src/modules/placements/college-drive-applications-service.ts:41-42`)
- Fix: Provide integer-to-UUID resolver for historical links only

## G2-8-014-006  [P2] GAP  facet F04  effort M
- Legacy: Legacy learnerId Integer and learnerName String (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:15-16`)
- vNext now: New applicant membership UUID and users.displayName (`src/modules/placements/college-drive-applications-service.ts:42-44`)
- Fix: Map active membership; avoid cross-college learner identity joins

## G2-8-014-007  [P2] GAP  facet F04  effort M
- Legacy: Legacy jobId Integer, jobTitle and companyName (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:17-19`)
- vNext now: New drive context job UUID/title and roleTitle but no companyName on each row (`src/modules/placements/college-drive-applications-service.ts:35-53`)
- Fix: Add safe company label to org-wide search read model if needed

## G2-8-014-008  [P2] GAP  facet F04  effort M
- Legacy: Legacy applicationStatus raw String (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:20-20`)
- vNext now: New status and derived college_stage and screening status (`src/modules/placements/college-drive-applications-service.ts:50-55`)
- Fix: Preserve canonical application status separate from screening and college stage

## G2-8-014-010  [P2] GAP  facet F05  effort M
- Legacy: Legacy searchableText includes name/job title/company/status (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:40-46,106-114`)
- vNext now: New search matches name/email/roll/role, not job title/company/status (`src/modules/placements/college-drive-applications-service.ts:89-94`)
- Fix: Restore safe job-title/company/status search on org-wide picker, keep PII policy

## G2-8-014-011  [P2] GAP  facet F05  effort M
- Legacy: Legacy default limit15 on org-wide search (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-62`)
- vNext now: New query fixed DRIVE_APPLICATIONS_PAGE_SIZE with cursor page (`src/modules/placements/college-drive-applications-service.ts:99-110`)
- Fix: Default suggestion list 15 with explicit bounded result controls

## G2-8-014-019  [P2] GAP  facet F10  effort M
- Legacy: Legacy 15-result search and stats endpoint backed by in-memory partition (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-104`)
- vNext now: New DB read/total/group stage counts per job (`src/modules/placements/college-drive-applications-service.ts:99-110`)
- Fix: Map old search/stats API separately, no accidental PII global enumeration

## G2-8-014-026  [P2] GAP  facet F13  effort M
- Legacy: Legacy cache load error logs and retains snapshot (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:49-75`)
- vNext now: New service DB errors bubble to page boundary (`src/modules/placements/college-drive-applications-service.ts:25-110`)
- Fix: Differentiate unavailable backend from zero applicants

## G2-8-014-032  [P2] GAP  facet F18  effort M
- Legacy: Legacy searchable status string raw not translated (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:20-20; docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:40-46`)
- vNext now: New college stage enum, screening and application statuses separate (`src/modules/placements/college-drive-applications-service.ts:50-55`)
- Fix: Use exact user-facing stage label mapped from old status semantics

## G2-8-014-034  [P2] GAP  facet F20  effort M
- Legacy: Legacy name is firstName + space + lastName trimmed (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:53-58`)
- vNext now: New name uses users.displayName (`src/modules/placements/college-drive-applications-service.ts:41-44`)
- Fix: Compare whitespace/missing surname cases and stable search

## G2-8-014-037  [P2] GAP  facet F22  effort M
- Legacy: Legacy primitive integer app/user/job/organization IDs (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:14-21`)
- vNext now: New UUIDs, membership ID and relationship keys (`src/modules/placements/college-drive-applications-service.ts:41-69`)
- Fix: Document typed join key mapping and status lineage

## G2-8-014-040  [P2] GAP  facet F23  effort M
- Legacy: Legacy fuzzy search matches company name/status; vNext search not same (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:40-46`)
- vNext now: New search expanded to email/roll, excludes company/title (`src/modules/placements/college-drive-applications-service.ts:89-94`)
- Fix: Document search match field changes and privacy implications

## G2-9-010-066  [P2] GAP  facet F14  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:706-735` — CSV export accepts legacy status/source/department/program/batch filters
- vNext now: `src/modules/placements/college-drive-applications-service.ts:114-130` — CSV exports current filters including screening/role, capped 1000 with safe neutralization
- Fix: Align field order and filter coverage, document cap/truncation

## G2-9-014-019  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1322-1352` — Age is days since statusUpdatedAt (or appliedAt); today/7d/14d dot thresholds.
- vNext now: `src/modules/placements/college-drive-applications-service.ts:45-48` — ageDays from submittedAt only; even summary table hides it.
- Fix: Calculate age from last status update and expose legacy icon tiers.

## G2-9-014-021  [P2] MISSING  facet F04  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1293-1310` — Applied Date formatted by formatPlacementDateShort.
- vNext now: `src/modules/placements/college-drive-applications-service.ts:45-48` — Raw submittedAt Date, no date in shortlist columns.
- Fix: Expose legacy short calendar date with IST semantics.

## G2-9-014-028  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:1256-1378` — Age and Match Score sortable; default age sort differs by shortlistedMode.
- vNext now: `src/modules/placements/college-drive-applications-service.ts:104-117` — SQL order by displayName ASC, id ASC; no column sort.
- Fix: Offer Age/score sorts and legacy shortlist initial sort.

## G2-9-014-083  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/JobApplications.js:116-117` — Default 20 results, server pages; user can increase to100.
- vNext now: `src/modules/placements/college-drive-applications-service.ts:104-117` — 25 fixed, stage count query and lists filtered server-side.
- Fix: Restore flexible page size and bounded queries.

## G2-9-014-094  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:37-68` — source nullable varchar50; resumeUrl and assessmentUrl text.
- vNext now: `src/modules/placements/college-drive-applications-service.ts:45-63` — channel source and roleOption linkage; shortlist does not expose resume/assessment URL.
- Fix: Map source and restore access to resume/assessment artifacts.

## G2-8-014-012  [P3] GAP  facet F05  effort M
- Legacy: Legacy blank query yields first N org records (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchCache.java:101-105`)
- vNext now: New blank query returns filtered and alphabetically sorted job rows (`src/modules/placements/college-drive-applications-service.ts:96-110`)
- Fix: Define stable default suggestion order

## G2-8-014-025  [P3] GAP  facet F13  effort M
- Legacy: Null learnerName yields empty search display; no dedicated DTO error (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:26-29`)
- vNext now: New empty results returns items=[],total=0 (`src/modules/placements/college-drive-applications-service.ts:99-110`)
- Fix: Use explicit No applications empty state, not blank select entry

## G2-8-014-031  [P3] GAP  facet F18  effort M
- Legacy: Legacy display name `${learnerName} - ${jobTitle}` even null jobTitle produces literal `null` (`docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchDTO.java:26-29`)
- vNext now: New separates name and roleTitle (`src/modules/placements/college-drive-applications-service.ts:41-53`)
- Fix: Handle null jobTitle gracefully without literal null
