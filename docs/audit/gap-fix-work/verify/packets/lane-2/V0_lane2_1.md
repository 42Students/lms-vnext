# Verification packet (P0, do FIRST): 7 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-15-022-010 [P0] GAP facet F04
- Files: src/modules/placements/tpo-recruiter-access-model.ts
- Legacy: `expired` true only when nonnull validUntil≤now; NULL explicitly `No end date`; TpoRecruiterAccessController.java:77-79; settings.js:705-709
- Expected fix: Fix `ended` computation: null only means ended if fail-closed security contract intentionally overrides legacy; distinguish `missing-expiry invalid` vs `never expires` in UI.

## G2-15-022-032 [P0] GAP facet F12
- Files: src/modules/placements/tpo-recruiter-access-model.ts, src/db/schema/placements.ts
- Legacy: Legacy `STATUS_ACTIVE` with `validUntil==null` considered live; RecruiterCollegeAccess.java:26-27,76-83
- Expected fix: Decide conflict between legacy indefinite access and new fail-closed policy; never silently treat null as both.

## G2-11-001-081 [P0] GAP facet F23
- Files: src/app/placements/page.tsx
- Legacy: Legacy recruiting form available for any published page. `docs/legacy-source/frontend/src/pages/placements/index.js:83`
- Expected fix: Fulfil DB09/proxy verification and keep form available.

## G2-11-002-055 [P0] MISSING facet F10
- Files: src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx
- Legacy: POST selections endpoint `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java:178`
- Expected fix: Add recruiter selection API

## G2-2-012-052 [P0] GAP facet F20
- Files: (none, new feature)
- Legacy: LC:166-170 `attendance_marked_at` required, absence exceptions counted only against marks
- Expected fix: Fix denominator/roster query to include every learner/session combination.

## G2-3-011-028 [P0] MISSING facet F10
- Files: src/modules/placements/tpo-job-type-write-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:165-170`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Job.java:58-64`
- Expected fix: Legacy renaming custom type rewrites job.job_type for all college drives, change to counts-as-placed rewrites job.counts_as_placed. VNext only updates type config, not drives. Implement tenant-scoped propagation and derived counts.

## G2-3-011-054 [P0] MISSING facet F23
- Files: src/modules/placements/tpo-job-type-write-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/JobTypeService.java:155-170`
- Expected fix: Legacy safe delete of unused custom and cascade rename/placed-answer onto drives are dropped without recorded reason; implement or obtain explicit exception.
