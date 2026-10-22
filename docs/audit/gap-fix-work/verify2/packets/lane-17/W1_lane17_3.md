# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-019-009 [P1] GAP facet F04 Attempts
- Files: (none, new feature)
- Legacy: LV:21-22 `incorrect_attempts`, LS:117 initializes 1 but LS:148-168 never increments
- Expected fix: Retain shared max-five attempt budget for all channels; record legacy field semantics and no migration needed for spent OTPs

## G2-18-026-030 [P1] GAP facet F12 Dependency delete
- Files: (none, new feature)
- Legacy: NPS:149-178 rejects structures, batches, semesters, learners then physical delete
- Expected fix: Verify all legacy relationships (including classes and references) map to vNext dependency checks and show blocker-specific messages

## G2-19-029-035 [P1] GAP facet F10 Legacy read API
- Files: (none, new feature)
- Legacy: LA:15-16 GET `/api/v1/superadmin/tenant/onboarding/readiness/{collegeId}`; LB:154-265 computes domain+branding+academic DTO
- Expected fix: Provide dual domain-login/advisory and full setup readiness DTOs or explicit contract mapping, never claim semantic equivalence for unlike outputs

## G2-13-001-051 [P1] GAP facet F12
- Files: src/modules/placements/recruiter-company-funnel-model.ts
- Legacy: Funnel labels Applied, Shortlisted, Test, Interview, Offered, Placed (`docs/legacy-source/frontend/src/pages/recruiter/company.js:17-32`)
- Expected fix: Restore exact legacy labels where metrics are semantically equal; mark semantic change explicitly.

## G2-13-001-076 [P1] GAP facet F20
- Files: src/modules/placements/recruiter-company-funnel-model.ts
- Legacy: Legacy `funnelSteps` treats invalid/missing counts as zero and protects 0 denominator (`docs/legacy-source/frontend/src/pages/recruiter/company.js:22-32`)
- Expected fix: Test negative/backward funnel stage values; do not silently saturate if legacy diagnostic count matters.

## G2-13-002-018 [P1] GAP facet F04
- Files: src/modules/placements/recruiter-today-week-events-model.ts
- Legacy: Folds round+matching slot on job/day/title and counts slots (`docs/legacy-source/frontend/src/components/recruiter/RecruiterToday.jsx:20-33`)
- Expected fix: Fold before sort/limit, avoid duplicate-looking weekly rows.

## G2-13-002-038 [P1] GAP facet F10
- Files: src/app/(authenticated)/hr/home/page.tsx
- Legacy: Today GET `/api/v1/recruiter/colleges/{collegeId}/today` (`docs/legacy-source/frontend/src/api/Services/RecruiterService.js:73-75`)
- Expected fix: Build per-task output contract tests from legacy controller and SQL.

## G2-13-011-002 [P1] GAP facet F01
- Files: src/modules/notifications/zeptomail-email.ts, src/modules/messaging/providers.ts, src/modules/placements/recruiter-message-email-provider.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:22-35` one template-send API with four overloads, including sender/Reply-To/from override
- Expected fix: Provide one reusable transactional template-mail adapter with explicit per-send sender, reply-to and verified from override as needed

## G2-13-011-007 [P1] GAP facet F04
- Files: src/modules/notifications/zeptomail-email.ts, src/modules/messaging/providers.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:137` null mergeInfo emits empty object
- Expected fix: Unify templated mail merge model and preserve optional arbitrary template variables for non-OTP transactions

## G2-18-021-021 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: Old learner GET `/calendar-dates/learner/{learnerId}` includes all visible and applied jobs (JobController:942-972; JobServiceImpl:1506-1541)
- Expected fix: Merge targeted-visible un-applied job dates AND past applied-job dates in learner calendar

## G2-14-002-004 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/students/page.tsx
- Legacy: Legacy edit/profile/audit accessible per row; vNext links to generic People management for some — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:965-989`
- Expected fix: Put authorized student-specific actions on roster itself

## G2-14-012-002 [P1] GAP facet F01
- Files: src/modules/notifications/zeptomail-email.ts, src/modules/messaging/providers.ts
- Legacy: Legacy dispatcher sends OTP/email and notification event emails through central abstraction `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:5-9` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-155`
- Expected fix: Map every legacy NotificationEvent to new template/recipient path

## G2-14-012-009 [P1] GAP facet F04
- Files: src/modules/notifications/zeptomail-email.ts, src/modules/messaging/providers.ts
- Legacy: Legacy mergeInfo Map String String passes through or empty `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:137-137`
- Expected fix: Ensure each old merge variable has equivalent event-specific schema

## G2-14-012-022 [P1] GAP facet F08
- Files: src/modules/notifications/zeptomail-email.ts
- Legacy: Legacy warning blank token uses default fallback warning `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:109-114`
- Expected fix: Never fallback to code-embedded secrets; provide safe config validation diagnostics

## G2-14-012-035 [P1] GAP facet F12
- Files: src/modules/notifications/zeptomail-email.ts, src/modules/messaging/providers.ts
- Legacy: Legacy dispatcher retries up to 3 sends with 500ms times attempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:123-149`
- Expected fix: Document deliberate no retry safety and add provider-idempotency aware outbox if repeat needed

## G2-14-012-041 [P1] GAP facet F15
- Files: src/modules/notifications/zeptomail-email.ts, src/modules/messaging/providers.ts, src/modules/placements/recruiter-message-email-provider.ts
- Legacy: Interface used for OTP and dispatcher event emails `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/ZeptoMailService.java:5-9` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:105-155`
- Expected fix: Inventory every legacy NotificationEvent template and recipient timing

## G2-14-012-050 [P1] GAP facet F19
- Files: src/modules/notifications/zeptomail-email.ts, src/lib/outbound.ts
- Legacy: Legacy synchronous RestTemplate POST, dispatcher may retry 3 times `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ZeptoMailServiceImpl.java:147-157` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:127-149`
- Expected fix: Set bounded timeout and outbox retry visibility; no blind duplicate sends

## G2-14-013-032 [P1] GAP facet F10
- Files: src/app/api/lecture-halls/route.ts, src/modules/academics/lecture-hall-service.ts
- Legacy: Legacy GET search uses cache.search(query,min(limit,200)), filters in JVM after search `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lecturehalls/LectureHallSearchController.java:76-94`
- Expected fix: Preserve relevant match ranking while performing tenant-safe DB filtering

## G2-20-031-018 [P1] GAP facet F06
- Files: src/components/tpo/recruiter-invite-landing.tsx
- Legacy: Legacy recruiter invite required Work email and Your name, optional designation/mobile, then 6-digit OTP; read-only email after send `recruiter-invite/[token].js:185-216`.
- Expected fix: Preserve read-only email for fixed invites, but make work-email editability conditional to legacy invite payload and confirm backend constraint.

## G2-15-002-029 [P1] MISSING facet F06
- Files: src/app/(authenticated)/admin/placements/student-lookup/page.tsx
- Legacy: `Job Preferences` has six fields rolePreference, specificRolePreference, workShiftPreference, preferredEmploymentCity, examSlotPreference, jobNotificationsEnabled boolean (`profileSectionSchemas.js:85-92`).
- Expected fix: Add six schema-validated, prefilled inputs and Save/Cancel on selected learner.

## G2-15-005-029 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: Legacy /applied malformed/unknown blocks all apply and shows Check status again (VerifiedJobDetailContent.jsx:60-90; placementsAppliedLookup.js:1-8)
- Expected fix: Add scoped error/loading boundary and fail-closed Retry with explicit no-reapply message

## G2-15-007-020 [P1] GAP facet F10
- Files: src/app/(authenticated)/college/groups/page.tsx
- Legacy: Only browser navigation router.replace to People; no backend API call (`student-groups.js:15-19`)
- Expected fix: Keep old route purely redirect/no group query; classify new CRUD as independent feature

## G2-16-002-015 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: `BugTrackerService.java:71-75`: ID `LMS-%04d` derived from DB-generated sequential ID.
- Expected fix: Decide backwards-compatible display/lookup ID contract; if exact parity essential, restore sequential public reference without exposing DB keys.

## G2-16-006-021 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: `[...courseTab].js:60-76`: target resolves course by slug/numeric ID and may canonicalize to slug.
- Expected fix: Provide documented legacy courseId/slug-to-deliveryId resolution or redirect compatibility map so older links work.

## G2-16-007-030 [P1] GAP facet F07
- Files: src/modules/academics/college-term-mapping-service.ts
- Legacy: `SemesterCourseMapping.js:387-393`: mapping fetch error preserves stale rows for same semester; staffing failure separate with retry.
- Expected fix: Separate staffing read from mapping, show stale data with nonblocking staffing warning and retry.
