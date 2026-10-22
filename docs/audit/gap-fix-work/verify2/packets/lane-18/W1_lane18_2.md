# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-12-003-059 [P1] GAP facet F13
- Files: src/app/(authenticated)/admin/courses/page.tsx
- Legacy: Refresh failure keeps stale loaded college rows and warning `docs/legacy-source/frontend/src/pages/superadmin/sections/Courses.js:607-613`
- Expected fix: Add last-good snapshot/partial recovery for directory

## G2-12-005-021 [P1] GAP facet F06
- Files: src/components/placements/learner-placement-registration.tsx
- Legacy: Saved Placements choice selected and consent checked when reading overview `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:52-55,180-195`
- Expected fix: Preselect stored consent or clearly require fresh consent on update with disclosure

## G2-13-012-025 [P1] GAP facet F11
- Files: src/modules/placements/tpo-company-domain-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:16-24` single validator used across recruiter, TPO, company setup, admin
- Expected fix: Apply shared mail-domain decision after authorization for privileged company-domain edits

## G2-17-23-018 [P1] GAP facet F04 Status names
- Files: (none, new feature)
- Legacy: JO:69–75 RELEASED/ACCEPTED/DECLINED and acceptanceChannel IN_APP
- Expected fix: Crosswalk RELEASED→ISSUED and legacy SELECTED/PENDING_VERIFICATION separately; never conflate unpublished selection with issued offer

## G2-17-23-085 [P1] GAP facet F22 Legacy table
- Files: (none, new feature)
- Legacy: JO:24–35 MySQL job_offer with BIGINT auto-id and application_id integer, JO:116–118 optimistic version
- Expected fix: Maintain legacy id/type crosswalk in DB08 migration for records, reports and external links; do not cast numeric IDs to UUID

## G2-18-019-010 [P1] GAP facet F04 Block timestamp
- Files: (none, new feature)
- Legacy: LV:23-24 `blocked_till_ts` stored as String; no use in LR:12-14 filtering
- Expected fix: Do not clone arbitrary string lockout; provide exact temporary block/retry time in Faculty UI backed by durable send/verify budget

## G2-18-026-031 [P1] GAP facet F12 Duration shrink
- Files: (none, new feature)
- Legacy: NPS:113-139 uses newMaxSemesters=years*2 and rejects referenced batch/semester beyond cap
- Expected fix: Include historical semester/course and active enrollments in shrink decision; document behavior for partially built future terms

## G2-19-029-036 [P1] GAP facet F10 Missing meta
- Files: (none, new feature)
- Legacy: LB:249-259 exposes domainTotal/domainVerified/domainPrimary/requireVerifiedDomains and recommendedActions
- Expected fix: Add typed domain-specific counts and requireVerifiedDomains flag to compact checklist; enforce consistency with login resolution policy

## G2-13-002-042 [P1] GAP facet F11
- Files: src/app/(authenticated)/hr/home/page.tsx
- Legacy: Legacy SQL filters recruiter_id, college_id and non-deleted jobs (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:35-40`)
- Expected fix: Test imported jobs with deleted/archived/relationship migration states.

## G2-18-021-025 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: Old learner calendar includes jobs visible on Jobs page + jobs applied, deduped by ID (JobServiceImpl:1506-1540)
- Expected fix: Verify public-targeted jobs with future dates included despite no application; preserve applied after deadline

## G2-14-002-010 [P1] MISSING facet F03
- Files: src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy Audit trail row icon; vNext omitted from roster actions — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:974-981,1719-1729`
- Expected fix: Add authorized scoped audit modal and row icon

## G2-14-009-018 [P1] GAP facet F04
- Files: src/modules/attendance/faculty-grid-model.ts
- Legacy: Absences represented by list of absent schedule IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassScheduleServiceImpl.java:866-891`
- Expected fix: Determine policy for excused medical late before counting each as absent

## G2-14-009-025 [P1] GAP facet F05
- Files: src/modules/attendance/faculty-grid-model.ts
- Legacy: Mixed-day ratio only divides by held sessions `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:348-397`
- Expected fix: Exclude future sessions from ratio denominator

## G2-14-019-020 [P1] GAP facet F06
- Files: src/modules/placements/hr-interview-slot-model.ts
- Legacy: Legacy duration defaults60; global min15 max480 configurable `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:78-82` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:58-91` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:275-284`
- Expected fix: Use configured min/max and 60-min default for equivalent direct interview create

## G2-15-014-017 [P1] GAP facet F05
- Files: src/modules/placements/tpo-round-apply-service.ts
- Legacy: Pessimistic write lock specifically at apply results. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobRoundRepository.java:19-22`)
- Expected fix: Use job/round transaction lock or equivalent stage CAS for exactly-once apply.

## G2-15-014-032 [P1] GAP facet F10
- Files: src/modules/placements/tpo-round-apply-service.ts
- Legacy: PESSIMISTIC_WRITE SELECT one round by id. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobRoundRepository.java:19-22`)
- Expected fix: Guarantee apply-once at round scope and all-or-nothing/partial semantics.

## G2-15-014-059 [P1] GAP facet F19
- Files: src/modules/placements/tpo-round-apply-service.ts
- Legacy: Round lock serializes bulk apply. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:74-77`)
- Expected fix: Make a single transaction or robust idempotent request token for whole-round apply.

## G2-15-014-061 [P1] GAP facet F20
- Files: src/modules/placements/tpo-round-apply-service.ts
- Legacy: Two simultaneous apply calls serialize on locked round. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:74-77`)
- Expected fix: Acquire lock and consume all staged rows in one operation or detect concurrent apply.

## G2-15-014-065 [P1] GAP facet F21
- Files: src/modules/placements/tpo-round-apply-service.ts
- Legacy: Result transition applies notification and status history inline. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoResultsService.java:74-145`)
- Expected fix: Audit partial apply, history consistency and actor notifications.

## G2-15-014-071 [P1] GAP facet F23
- Files: src/modules/placements/tpo-round-apply-service.ts
- Legacy: Legacy pessimistic row lock for atomic round apply. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/tpo/JobRoundRepository.java:19-22`)
- Expected fix: Do not call round batch parity complete until apply concurrency is proven.

## G2-15-002-021 [P1] GAP facet F05
- Files: src/modules/placements/college-placement-student-lookup-model.ts, src/app/(authenticated)/admin/placements/student-lookup/page.tsx
- Legacy: Search is autocomplete offering up to ten learners, user selects exactly one (`StudentPlacementLookup.js:45-60,88-95,128-144`).
- Expected fix: Implement 10-result autocomplete and explicit one-student selection, defer detail queries until selection.

## G2-15-002-030 [P1] MISSING facet F06
- Files: src/app/(authenticated)/admin/placements/student-lookup/page.tsx
- Legacy: `Resume` editor stores resumeUrl (`profileSectionSchemas.js:93-95`; `ProfileSectionsPanel.js:205-316`).
- Expected fix: Render secure resume link/editor with storage-reference ownership validation and Save/Cancel.

## G2-15-005-030 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: Legacy visibility fetch rejected: `This drive can't be shown` or `We couldn't load this drive` with Retry and Browse drives (JobDetailContent.jsx:843-875)
- Expected fix: Distinguish revoked/unpublished/malformed/network vs not found and supply exact retry actions

## G2-15-007-024 [P1] GAP facet F12
- Files: src/app/(authenticated)/college/groups/page.tsx
- Legacy: Business decision: generic CRT, club, bus groups have no consumers, hidden 2026-10-04; electives/project teams unaffected (`student-groups.js:6-13`)
- Expected fix: Prevent generic group CRUD from implying student visible workflows; tie release to actual targeting features

## G2-16-002-035 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: `BugTrackerService.java:43-49`: reporter must exist as active access row; otherwise `Select a valid reporter`.
- Expected fix: Ensure reporter identity allowlist maps to valid approved access, or document deliberate authenticated provenance change.
