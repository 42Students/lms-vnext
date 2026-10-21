# Work packet: edit src/modules/placements/college-drive-attention-service.ts

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-2/admin-job-controller.md, docs/audit/gap2/lane-9/college-admin-jobs-index.md, docs/audit/gap2/lane-9/college-admin-jobs-overview.md

## G2-2-016-117  [P1] GAP  facet F10  effort L
- Legacy: GET needs-attention includes stale applications, unscheduled interviews, missing offer letters, closing soon `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminJobController.java:975-990`
- vNext now: New attention model explicitly has hasOfferLetterEvidence=false `src/modules/placements/college-drive-attention-service.ts:11-20,60-69`
- Fix: Implement real missing-offer-letter evidence and counts rather than false negative

## G2-9-016-024  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:251-257` — Active drives true paginated total and All drives count from size1 query.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:12-20` — Only current published jobs max60 and attention total, no overall total.
- Fix: Fetch count of all status records to fill four metrics.

## G2-9-016-025  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19-26` — Four attention categories include missingOfferLetters, stale, unscheduled, low conversion.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:10-11` — Only STALE_APPLIED, INTERVIEW_UNSCHEDULED, LOW_CONVERSION; offer evidence false.
- Fix: Restore fourth category when evidence available or explicit UNKNOWN with source.

## G2-9-016-026  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:253-254` — Needs attention count sums category candidate item counts.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:67-70` — total categories.length, counts per (job,category), not number of learners.
- Fix: Use sum of affected applicants and show category row count separately.

## G2-9-016-057  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:765-783` — searchAdminJobs GET /api/v1/admin/jobs/search, active page60 + all size1.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:12-18` — Drizzle query PUBLISHED max60, no all total.
- Fix: Fetch all job count and sorted published page separately.

## G2-9-016-058  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:920-955` — getAdminNeedsAttentionSummary college-scoped GET, categories from backend.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:21-69` — Computes three categories in SQL directly, missing offer-letter evidence.
- Fix: Implement missing category through approved evidence source.

## G2-9-016-065  [P1] GAP  facet F12  effort L
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:19-26` — Attention has four categories: stale, unscheduled, missing letters, low conversion.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:10-11` — Three categories and evidence unavailable.
- Fix: Mark offer missing count unavailable, connect secure evidence when possible.

## G2-9-016-066  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:211-214` — Needs attention total sums counts per category, including sample-truncated rows.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:67-70` — Attention total counts matching category-job records.
- Fix: Sum candidate/event counts, not drive-category rows.

## G2-9-016-067  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:345-383` — Alert rules configurable in Super Admin: stale days 1-90, close soon 1-60, sample cap1-50, conversion threshold0-1.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:10-11` — Hardcoded stale7, window3, threshold0.2, no sample cap setting.
- Fix: Read tenant/platform effective settings instead of hardcoding thresholds.

## G2-9-016-068  [P1] GAP  facet F12  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:355-377` — Default conversion threshold 0.15 from Settings.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:61-64` — SQL low conversion threshold 0.20.
- Fix: Use 0.15 default or effective policy override.

## G2-9-016-069  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:109-120` — Active count from search active total and inactive all-active.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:14-18` — Only max60 list, cannot compute all active/inactive totals.
- Fix: Add independent count queries by status.

## G2-9-016-099  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:765-783` — Legacy two search queries active/size60 and all/size1 with totalElements.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:14-18` — Query PUBLISHED max60, no all count; SQL only gets active records.
- Fix: Add separate countAll/countActive aggregate.

## G2-9-016-100  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/frontend/src/api/Services/AdminService.js:920-955` — Legacy attention backend returns categories with candidate sample, truncation counts.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:49-70` — New category record count and no candidate example rows.
- Fix: Store/send candidate-level rows with countTotal and sample cap.

## G2-9-016-103  [P1] GAP  facet F23  effort M
- Legacy: `src/modules/placements/college-drive-attention-service.ts:61-64` — Old default low conversion threshold .15; candidate count categories independent.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:61-64` — New low-conversion threshold .2; >=5 applicants, <3d.
- Fix: Honor settings threshold and same denominator/interval.

## G2-9-011-019  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:83-90` — Attention rows filtered by matching numeric jobId, containing learnerName/detail and category
- vNext now: `src/modules/placements/college-drive-attention-service.ts:53-70` — Categories aggregate by job/category and do not include learner names or details
- Fix: Return learner-specific attention items from scoped query or link filtered register with equivalent copy

## G2-9-011-034  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:79-90` — GET /api/v1/admin/jobs/needs-attention college-wide then filter by jobId
- vNext now: `src/modules/placements/college-drive-attention-service.ts:12-70` — Scoped SQL attention aggregates top60 published jobs
- Fix: Include arbitrary deep-linked job outside top60 and missing offer-letter category

## G2-9-011-041  [P1] MISSING  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:17-21` — Attention categories staleApplications, unscheduledInterviews, missingOfferLetters plus closingSoonLowConversion
- vNext now: `src/modules/placements/college-drive-attention-service.ts:10-11` — Only STALE_APPLIED/INTERVIEW_UNSCHEDULED/LOW_CONVERSION, no missing-offer-letter category
- Fix: Implement missing offer letter category based on authoritative offer records

## G2-9-011-057  [P1] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/index.js:79-90` — Attention reads college summary then filters named categories by exact job ID
- vNext now: `src/modules/placements/college-drive-attention-service.ts:14-17` — Attention only computes first60 published jobs ordered createdAt desc
- Fix: Allow isolated attention read for deep-linked archived/older job

## G2-9-016-046  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/DrivesLanding.js:497-509` — Active drive refresh warning shows old scoped items + Retry.
- vNext now: `src/modules/placements/college-drive-attention-service.ts:12-20` — Fresh server read only, no last-known snapshot fallback.
- Fix: Preserve scoped cached data while refresh error displays.
