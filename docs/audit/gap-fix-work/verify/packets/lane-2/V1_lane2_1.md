# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-031-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/tpo/messages/[threadId]/page.tsx
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:18-20` — Recruiter message panel appears on inbox and embedded on drive Discussion.
- Expected fix: Embed scoped conversation component in drive Discussion with quotes.

## G2-19-031-073 [P1] GAP facet F11
- Files: src/modules/placements/tpo-team-internal-create-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoTeamThreadService.java:50-59` — TPO and college admin team users can converse.
- Expected fix: Authorize true college-admin Team members without recruiter access.

## G2-18-023-043 [P1] GAP facet F20
- Files: src/modules/placements/learner-placement-rules-service.ts
- Legacy: Legacy rules calculation uses fixed precedence and `summarySentenceFor` student own batch; PlacementRulesService.java:57-80,142-153
- Expected fix: Define canonical effective-policy lookup with change timestamps and reconciliation test for batch overrides.

## G2-11-007-043 [P1] GAP facet F07
- Files: src/modules/placements/tpo-company-memory-service.ts
- Legacy: Legacy counts failure text `Could not load drive application counts.`; warning `Drive application counts are unavailable`, action `Retry counts`. `docs/legacy-source/frontend/src/pages/tpo/companies.js:64`
- Expected fix: Preserve counts error signal and warning+Retry counts CTA.

## G2-11-007-103 [P1] GAP facet F22
- Files: src/modules/placements/tpo-company-memory-service.ts
- Legacy: Legacy company hiring from job + application and placement rules; year recorded per drive. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoRecruiterLeadsHubService.java:411`
- Expected fix: Compare placed definitions, indexes, year type and distinct applicant keys.

## G2-11-009-023 [P1] GAP facet F05
- Files: src/modules/placements/tpo-live-drive-day-service.ts
- Legacy: SQL filters ON_CAMPUS and current day, no pagination. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduleService.java:346`
- Expected fix: Fetch full today's on-campus round list.

## G2-11-013-083 [P1] GAP facet F21
- Files: src/components/placements/placement-job-create-workspace.tsx
- Legacy: JD, company history, eligibility preview and clone integrations. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:18`
- Expected fix: Restore missing integrations.

## G2-12-005-083 [P1] GAP facet F22
- Files: src/modules/placements/tpo-general-request-model.ts
- Legacy: Legacy StudentRequest type/jobId/applicationId/payload/reason model `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerRequestController.java:29-48`
- Expected fix: Document type mapping including legacy CORRECTION and PAP; preserve request history

## G2-13-001-083 [P1] GAP facet F22
- Files: src/modules/placements/recruiter-company-team-service.ts
- Legacy: Legacy roster uses recruiter_college_access active/expiry and nondeleted recruiter (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:83-94`)
- Expected fix: Confirm nullable expiry, suspension/deletion migration and unique grant cardinality before claiming parity.

## G2-13-002-043 [P1] GAP facet F11
- Files: src/modules/placements/hr-today-action-queue-model.ts
- Legacy: Unshared APPLIED applications are shown as waiting, without action (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterTodayService.java:109-122`)
- Expected fix: Only produce unreviewed shared-applicant CTA when verified positive count.

## G2-19-026-003 [P1] GAP facet F02
- Files: (none, new feature)
- Legacy: Old `/tree` returns whole college grid in single call, all nodes resolved (controller:38-57)
- Expected fix: Add complete academic hierarchy grid including Inherit-only nodes instead of only stored overrides

## G2-14-016-033 [P1] GAP facet F10
- Files: src/modules/placements/tpo-recruiter-grant-write-service.ts
- Legacy: Legacy revoke sets status,revokedAt/by/type and reason `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoRecruiterAccessController.java:127-135`
- Expected fix: Persist reason and role audit

## G2-16-023-033 [P1] GAP facet F12
- Files: src/modules/placements/learner-journey-service.ts
- Legacy: LearnerJourneyService.java:25-26 active statuses and released offer statuses.
- Expected fix: Include DECLINED/EXPIRED/WITHDRAWN released history, never prerelease.

## G2-17-019-013 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: src/modules/courses/assignment-submission-service.ts:711-745 — Current grading uses validated points and feedback payload.
- Expected fix: Require event fields derived from locked DB state, not client.

## G2-17-013-013 [P1] GAP facet F05
- Files: src/modules/placements/learner-jobs-browse-model.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/search/jobs/JobSearchController.java:173-189 — Optional deptId/programId exact int and jobType case-insensitive.
- Expected fix: Support organization-safe dept/program/type facet on relevant admin search.

## G2-18-005-023 [P1] GAP facet F05
- Files: src/modules/placements/learner-dashboard-model.ts, src/components/placements/learner-placements-dashboard.tsx
- Legacy: Legacy prioritizes open released offers first, then registration, then earliest future event, then placed, open drives, opted-out, caught-up. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:80-98`
- Expected fix: Match precedence for *all* released offers and registration, not only expiring <=24h.

## G2-18-005-053 [P1] GAP facet F12
- Files: src/modules/placements/learner-dashboard-model.ts
- Legacy: Legacy offer released > registration > nearest event > placed > eligible drives > opted-out > all-caught-up. `docs/legacy-source/frontend/src/pages/learn/my-placements/index.js:80-98`
- Expected fix: Align full priority state machine and presence of nonurgent offers.

## G2-19-004-043 [P1] GAP facet F10
- Files: src/components/placements/learner-schedule-reschedule.tsx
- Legacy: Legacy POST round request has reason/preferredTimes optional `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:177-179` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:43-47`
- Expected fix: Add optional free-text request payload mapping to new approval workflow.

## G2-20-014-023 [P1] GAP facet F13
- Files: src/modules/placements/saved-job-service.ts
- Legacy: Legacy 503 unavailable if service injection absent `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/JobController.java:764-765`
- Expected fix: Verify numbered Drizzle migration deployed; return 503/disabled toggle rather than 500

## G2-12-024-043 [P1] GAP facet F23
- Files: src/app/(authenticated)/tracker/logs/page.tsx
- Legacy: Legacy known-error triage available with configured service `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:94-110`
- Expected fix: Leave warning until migration registered.

## G2-13-031-083 [P1] GAP facet F04
- Files: src/modules/placements/report-model.ts
- Legacy: Legacy placed percentage rounded one decimal; 0 registrations gives 0. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:103-109`
- Expected fix: Restore precision/empty-population contract.

## G2-13-031-103 [P1] GAP facet F21
- Files: src/modules/placements/report-service.ts
- Legacy: Legacy TPO insights calls rules, academic marks, eligibility and recruiter-leads service. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoInsightsService.java:24-45`
- Expected fix: Trace each dependency for omitted fields/denominators.

## G2-12-027-003 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: LBE/controller/FacultyTeachingAssignmentController.java:193-244: independent faculty, active-faculty, class, class+semester and batch read routes.
- Expected fix: Expose equivalent faculty/class/batch query projections without conflating section-grants and course-grants.

## G2-7-010-003 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/meetings.js:39: useUnsavedFormGuard prevents navigation away with unsaved meeting changes.
- Expected fix: Ensure equivalent unsaved-changes guard for plan editor or explicitly replace workflow.

## G2-7-035-073 [P1] GAP facet F21
- Files: src/app/(authenticated)/admin/projects/templates/[templateId]/page.tsx
- Legacy: overview.js:39-49 9 AdminService APIs (preview/create/edit/lifecycle/duplicate)
- Expected fix: Map each removed REST API into vNext service, with owner decision on omitted workflows
