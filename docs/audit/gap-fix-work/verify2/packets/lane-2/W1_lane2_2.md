# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-001-076 [P1] GAP facet F22
- Files: src/app/placements/page.tsx
- Legacy: One college_placements_page row with about, numbers, enabled, updated_by. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementsPageService.java:67`
- Expected fix: Document migration field mapping and constraints.

## G2-11-003-042 [P1] GAP facet F07
- Files: src/app/(authenticated)/hr/drives/page.tsx
- Legacy: Refresh failure nonblocking stale-list warning `docs/legacy-source/frontend/src/pages/recruiter/drives/index.js:140`
- Expected fix: Keep stale list and alert

## G2-11-003-057 [P1] GAP facet F10
- Files: src/modules/placements/recruiter-portfolio-counts-service.ts
- Legacy: Legacy offer count released/accepted `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterDriveWorkService.java:66`
- Expected fix: Match visible released/accepted ledger

## G2-11-003-060 [P1] GAP facet F11
- Files: src/modules/placements/recruiter-portfolio-counts-service.ts
- Legacy: Legacy direct-access mode or live TPO share influences counts `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterDriveWorkService.java:65`
- Expected fix: Align opt-in direct mode/shares and count semantics

## G2-11-003-101 [P1] GAP facet F22
- Files: src/modules/placements/recruiter-portfolio-counts-service.ts
- Legacy: Legacy job_offer statuses RELEASED/ACCEPTED `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterDriveWorkService.java:66`
- Expected fix: Map offer release counts

## G2-11-004-119 [P1] GAP facet F22
- Files: src/modules/placements/recruiter-drive-request-service.ts
- Legacy: Legacy `plan-drive` creates college job/requests with jobId receipt `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterPlanDriveController.java:47`
- Expected fix: Write mapping of approved job, old job ID and review statuses

## G2-11-005-089 [P1] GAP facet F13
- Files: src/app/(authenticated)/tpo/announcements/page.tsx
- Legacy: On fetch error red Alert with Retry retaining empty items `docs/legacy-source/frontend/src/pages/tpo/announcements.js:98`
- Expected fix: Add retryable load-error state

## G2-11-007-026 [P1] GAP facet F04
- Files: src/modules/placements/tpo-company-memory-service.ts
- Legacy: Legacy `getDriveCounts` keyed jobId supplies Applied and Offers; a failure yields unavailable, not zero. `docs/legacy-source/frontend/src/pages/tpo/companies.js:49`
- Expected fix: Propagate unknown count provenance and display Unavailable instead of inferred zero.

## G2-11-007-102 [P1] GAP facet F22
- Files: src/modules/placements/tpo-company-memory-service.ts
- Legacy: Legacy company identity based on recruiter_lead.company_name and job.company_name, optional college_company/companyId; query aliases by normalized strings. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:385`
- Expected fix: Write legacy-to-Postgres company identity/alias data crosswalk incl. orphan rows.

## G2-11-009-021 [P1] GAP facet F04
- Files: src/modules/placements/tpo-live-drive-day-service.ts
- Legacy: API provides id, roundName, kind, scheduled date, venue, company and role. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:345`
- Expected fix: Expose all full-day items with original fields.

## G2-11-009-041 [P1] GAP facet F10
- Files: src/modules/placements/tpo-live-drive-day-service.ts
- Legacy: Legacy GET /api/v1/tpo/drive-day/mine returns today's college list. `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:82`
- Expected fix: Build all-day equivalent GET/service and use it for index.

## G2-11-009-052 [P1] GAP facet F12
- Files: src/modules/placements/tpo-live-drive-day-service.ts
- Legacy: Legacy includes noncancelled and other status based only on job lifecycle. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- Expected fix: Show completed same-day rounds; define cancelled separately.

## G2-11-009-077 [P1] GAP facet F19
- Files: src/modules/placements/tpo-live-drive-day-service.ts
- Legacy: Legacy query one SQL query for all today rounds. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- Expected fix: Batch aggregate joins and support full day set.

## G2-11-009-094 [P1] GAP facet F23
- Files: src/modules/placements/tpo-live-drive-day-service.ts
- Legacy: Legacy all-day queue independent of duration. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- Expected fix: Implement day queue and retain live now as extra.

## G2-11-008-031 [P1] MISSING facet F06
- Files: src/modules/placements/tpo-drive-day-checkin-service.ts
- Legacy: Optional free-text room input with literal placeholder. `docs/legacy-source/frontend/src/pages/tpo/drive-day/[roundId].js:297`
- Expected fix: Add room input and persist with operator mark.

## G2-11-008-051 [P1] GAP facet F10
- Files: src/modules/placements/tpo-drive-day-checkin-service.ts
- Legacy: Attendance upsert COALESCE retains previous room when caller omits it. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:395`
- Expected fix: Do not clear prior assigned room on check-in.

## G2-11-008-052 [P1] GAP facet F10
- Files: src/modules/placements/tpo-drive-day-checkin-service.ts
- Legacy: First absent state enqueues MARKED_ABSENT and writes TPO audit. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:402`
- Expected fix: Enqueue deduplicated learner absence notification and dispute workflow.

## G2-11-008-068 [P1] GAP facet F15
- Files: src/modules/placements/tpo-drive-day-checkin-service.ts
- Legacy: First absence enqueues one `MARKED_ABSENT` learner APP notification; repeat does not. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:399`
- Expected fix: Add first-absence transactional notification with idempotency.

## G2-11-008-084 [P1] GAP facet F21
- Files: src/modules/placements/tpo-drive-day-checkin-service.ts
- Legacy: Legacy uses outbox and audit service for absence workflow. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:24`
- Expected fix: Integrate learner notifications/dispute event producer.

## G2-11-008-089 [P1] GAP facet F22
- Files: src/modules/placements/tpo-drive-day-checkin-service.ts
- Legacy: Legacy preserves room if missing from request. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:395`
- Expected fix: Retain room unless explicit clear requested.

## G2-11-012-011 [P1] GAP facet F02
- Files: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx
- Legacy: Drive column first, Where it is, Mode, Owner, Job type, Pay, Applied, Deadline, Status, actions. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:295`
- Expected fix: Restore all legacy columns and default visibility.

## G2-11-013-031 [P1] GAP facet F07
- Files: src/components/placements/placement-job-create-workspace.tsx
- Legacy: Failure loading supporting lists shows Retry setup data, keeps form. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:510`
- Expected fix: Provide partial support data with warning/retry.

## G2-11-013-056 [P1] GAP facet F13
- Files: src/components/placements/placement-job-create-workspace.tsx
- Legacy: Support-data errors keep available form and Retry. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:510`
- Expected fix: Isolate missing company/program/season fetch.

## G2-11-013-061 [P1] GAP facet F14
- Files: src/components/placements/placement-job-create-workspace.tsx
- Legacy: Clone copies source rounds while clearing dates. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:395`
- Expected fix: Clone round configuration unless deliberate documented change.

## G2-12-020-017 [P1] GAP facet F06
- Files: src/modules/placements/company-curation-domain-model.ts, src/modules/placements/tpo-trusted-domain-validation.ts
- Legacy: Legacy CompanyDomainService accepts email/URL/@domain, canonicalizes registrable domain with PSL `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:77-103,110-138`
- Expected fix: Normalize every input to registrable domain using a complete public-suffix parser.
