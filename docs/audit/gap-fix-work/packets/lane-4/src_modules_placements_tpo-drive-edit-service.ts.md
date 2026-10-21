# Work packet: edit src/modules/placements/tpo-drive-edit-service.ts

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-11/tpo-drives-jobid-edit.md, docs/audit/gap2/lane-5/u013-admin-job-service.md

## G2-11-011-039  [P1] MISSING  facet F04  effort M
- Legacy: Verified marks only checkbox changes missing-data policy. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:688`
- vNext now: Edit service only minCgpaHundredths; cannot edit evidence mode. `src/modules/placements/tpo-drive-edit-service.ts:26`
- Fix: Port verified-marks-only policy and persisted update.

## G2-11-011-066  [P1] GAP  facet F10  effort L
- Legacy: Legacy updateDrive PUT with composite payload company, modes, roles, eligibility, rounds. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:17`
- vNext now: vNext PATCH /api/placements/tpo/jobs/{id}/edit updates title/pay/locations/deadline/minCgpa only. `src/modules/placements/tpo-drive-edit-service.ts:64`
- Fix: Extend DTO/transaction to all old editable fields.

## G2-11-011-068  [P1] GAP  facet F10  effort L
- Legacy: Legacy getDrive/getDriveRounds hydration for all form fields. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:17`
- vNext now: New fetch state only compact job fields+CGPA. `src/modules/placements/tpo-drive-edit-service.ts:12`
- Fix: Return all form defaults, including linked details and rounds.

## G2-11-011-071  [P1] GAP  facet F11  effort M
- Legacy: Frozen statuses CLOSED/CANCELLED/REJECTED block autosave. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:318`
- vNext now: Editable only DRAFT/PUBLISHED and season ACTIVE. `src/modules/placements/tpo-drive-edit-service.ts:37`
- Fix: Remove season-only edit denial where legacy permitted, preserve frozen statuses.

## G2-11-011-073  [P1] MISSING  facet F11  effort M
- Legacy: Recruiter ownership detected for conditional UI copy. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:91`
- vNext now: No recruiter relation in edit state projection. `src/modules/placements/tpo-drive-edit-service.ts:12`
- Fix: Include recruiter ownership and render protected fields.

## G2-11-011-102  [P1] GAP  facet F19  effort L
- Legacy: Hydrates batches, CGPA, students, companies, history, rounds and eligibility. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:166`
- vNext now: New edit loads job/season/CGPA/applicantCount only. `src/modules/placements/tpo-drive-edit-service.ts:12`
- Fix: Load supporting selection datasets lazily with status indicator.

## G2-11-011-111  [P1] GAP  facet F22  effort L
- Legacy: Legacy form model stores companyId, jobTitle, JD, driveMode, category, roleOptions. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:146`
- vNext now: New edit state only job fields/CGPA and applicantCount. `src/modules/placements/tpo-drive-edit-service.ts:12`
- Fix: Map full legacy form payload to schema and edit DTO.

## G2-11-011-113  [P1] GAP  facet F22  effort L
- Legacy: Legacy eligibility has verifiedMarksOnly and per-level percentages. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:264`
- vNext now: New updates only minCgpaHundredths in policy. `src/modules/placements/tpo-drive-edit-service.ts:86`
- Fix: Add missing policy columns/edit contract.

## G2-5-013-018  [P1] GAP  facet F06  effort M
- Legacy: Legacy extension modifies importantDates labeled Application deadline then re-derives applicationDeadline (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminJobService.java:45-50`)
- vNext now: vNext direct job applicationDeadline timestamptz field editable in TPO edit service (`src/modules/placements/tpo-drive-edit-service.ts:10-20`)
- Fix: Synchronize deadline important-date list and canonical field during extension

## G2-5-013-035  [P1] GAP  facet F10  effort M
- Legacy: Legacy updateJob edits current job with version conflict check (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:641-660`)
- vNext now: vNext updatePlacementJob rejects non-DRAFT, separate TPO edit handles timestamp lock (`src/modules/placements/tpo-drive-edit-service.ts:39-55`)
- Fix: Match allowed edits for PUBLISHED jobs or explicitly preserve approved restriction with UI notice

## G2-5-013-036  [P1] GAP  facet F10  effort M
- Legacy: Legacy extendApplicationDeadline special method preserves importantDates derived field (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/AdminJobServiceImpl.java:591-638`)
- vNext now: vNext TPO edit writes deadline directly (`src/modules/placements/tpo-drive-edit-service.ts:10-20`)
- Fix: Implement atomic deadline+importantDates consistency

## G2-11-011-054  [P2] MISSING  facet F07  effort M
- Legacy: Setup data failures listed with Retry setup data action. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:510`
- vNext now: New only loads season, CGPA, applicant count; form has no setup-source warning. `src/modules/placements/tpo-drive-edit-service.ts:24`
- Fix: Surface missing choices/company/eligibility setup errors.
