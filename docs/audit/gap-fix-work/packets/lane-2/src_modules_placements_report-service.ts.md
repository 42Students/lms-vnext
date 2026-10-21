# Work packet: edit src/modules/placements/report-service.ts

10 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/job-types.md, docs/audit/gap2/lane-3/l11-u022-tpo-reports-index.md, docs/audit/gap2/lane-5/l13-u031-dashboards-reports.md, docs/audit/gap2/lane-8/l11-u021-tpo-report-detail.md

## G2-3-011-034  [P0] MISSING  facet F12  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:108-114`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:392-397`
- vNext now: `src/db/schema/placements.ts:496-498`, `570-573`, `src/modules/placements/report-service.ts:159-163`
- Fix: Legacy job.counts_as_placed is source of eligibility, held-offer and reports; vNext jobs store only three-value employmentType, no count flag, reports ignore type-specific placed answer. Restore per-drive placed policy.

## G2-11-022-047  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:63-72`
- vNext now: `src/modules/placements/report-service.ts:430-454`
- Fix: Legacy first funnel step looking = registered students and placed = unique, accepted = unique, vNext acceptedOffers differs and placed policy configurable SELECTED/RELEASED/ACCEPTED. Do not compare conversion rates without denominator note.

## G2-11-022-072  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/tpo/reports/index.js:64-72`
- vNext now: `src/modules/placements/report-service.ts:448-454`
- Fix: Legacy null/NaN stats treated as 0; vNext explicitly flags missing registration data rather than guessing. Do not silently treat missing denominator as valid 0 in cloned JourneyStrip.

## G2-13-031-079  [P1] GAP  facet F04  effort M
- Legacy: Legacy registered = latest season registration choice plus earlier-applicant fallback. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:79-81`
- vNext now: vNext derives registrations from current placement batch, not historical season. `src/modules/placements/report-service.ts:309-331`
- Fix: Add season-consistent registration snapshot or scope note.

## G2-13-031-099  [P1] GAP  facet F12  effort M
- Legacy: Unseasoned legacy drives count as current-season drives. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:21-22`
- vNext now: vNext excludes jobs with NULL seasonId. `src/modules/placements/report-service.ts:145-149`
- Fix: Explicitly migrate/assign seasonless drives.

## G2-13-031-102  [P1] GAP  facet F19  effort M
- Legacy: Legacy branch stats aggregate in grouped SQL. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:383-393`
- vNext now: vNext builds JS aggregate after fetching scoped fact rows. `src/modules/placements/report-service.ts:235-367`
- Fix: Move high-volume aggregates and pagination to DB.

## G2-13-031-103  [P1] GAP  facet F21  effort M
- Legacy: Legacy TPO insights calls rules, academic marks, eligibility and recruiter-leads service. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:24-45`
- vNext now: vNext summarizes offers/jobs/enrollment facts. `src/modules/placements/report-service.ts:430-437`
- Fix: Trace each dependency for omitted fields/denominators.

## G2-13-031-104  [P1] GAP  facet F22  effort M
- Legacy: Legacy CTC persisted as `ctc_lpa`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:118-125`
- vNext now: vNext persisted as annualCtcInr. `src/modules/placements/report-service.ts:273-276`
- Fix: Define LPA/INR mapping and historical precision.

## G2-11-021-013  [P1] GAP  facet F06  effort L
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:36 defaults batch null, branch/company empty, mode/category null
- vNext now: src/modules/placements/report-service.ts:51-56 only accepts collegeId/seasonId/jobId in core report query
- Fix: Implement all old report filters without silently dropping them

## G2-11-021-022  [P1] GAP  facet F10  effort L
- Legacy: docs/legacy-source/frontend/src/pages/tpo/reports/[name].js:90-100 GET getReport(name, batch/branch/company/mode/category)
- vNext now: src/modules/placements/report-service.ts:63-85 reads scoped normalized tables with season/job arguments
- Fix: Map API query fields and all result row fields for every report
