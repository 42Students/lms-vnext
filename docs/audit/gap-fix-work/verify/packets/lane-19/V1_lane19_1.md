# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-19-020-023 [P1] GAP facet F11
- Files: src/modules/bug-tracker/report-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/BugTrackerService.java:43-48 — only active named reporter may submit legacy issue.
- Expected fix: Document deliberate requirement to authenticate platform user.

## G2-19-027-003 [P1] MISSING facet F01
- Files: src/app/api/courses/[courseId]/route.ts
- Legacy: GET `/by-slug/{slug}` preferred; `/fetchCourse?courseId` marked deprecated and `/{courseId}/slug` lookup; CourseController.java:195-198,233-261,267-285
- Expected fix: Add authorized slug read/resolve alias or explicit validated permanent redirects; never expose guessed cross-tenant UUID mappings.

## G2-19-027-053 [P1] GAP facet F20
- Files: src/app/api/courses/[courseId]/route.ts
- Legacy: Legacy `CourseSlugResolver` rejects mismatch between courseSlug and numeric courseId and ID enumeration; CourseSlugResolver.java:19-53; CourseController.java:195-319
- Expected fix: Support validated alias resolution with tenant-safe 404; never accept slug & UUID that disagree.

## G2-11-011-073 [P1] MISSING facet F11
- Files: src/modules/placements/tpo-drive-edit-service.ts
- Legacy: Recruiter ownership detected for conditional UI copy. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:91`
- Expected fix: Include recruiter ownership and render protected fields.

## G2-11-011-113 [P1] GAP facet F22
- Files: src/modules/placements/tpo-drive-edit-service.ts
- Legacy: Legacy eligibility has verifiedMarksOnly and per-level percentages. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:264`
- Expected fix: Add missing policy columns/edit contract.

## G2-13-017-033 [P1] GAP facet F10
- Files: src/modules/projects/learner-own-task-service.ts, src/db/schema/projects.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:97-104` createdByType disambiguates int actor IDs
- Expected fix: Guarantee every create/edit activity event carries durable actor and original role type

## G2-14-007-003 [P1] GAP facet F01
- Files: src/proxy.ts
- Legacy: Legacy router.replace history, no back entry to retired group; vNext missing legacy redirect risks 404/back-loop — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:9-12`
- Expected fix: Use replace/temporary server redirect without preserving old page in history

## G2-14-007-043 [P1] MISSING facet F23
- Files: src/proxy.ts
- Legacy: vNext has no old /college-admin/student-groups/:id bookmark redirect while legacy explicitly preserved links to People — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:6-12`
- Expected fix: Add old URL redirect to People/Contacts and use temporary replace semantics

## G2-18-021-003 [P1] GAP facet F02
- Files: (none, new feature)
- Legacy: DTO represents one date of any job importantDates array: application deadline, screening etc (DTO:8-19)
- Expected fix: Include all configured important date events with type and label, not just deadline+scheduled rounds

## G2-15-007-023 [P1] GAP facet F11
- Files: (none, new feature)
- Legacy: Old group page disabled regardless of admin role or module enablement (`student-groups.js:6-13`)
- Expected fix: Restore global hide until owner authorizes group consumer

## G2-19-006-073 [P1] GAP facet F20
- Files: src/modules/attendance/learner-attendance-calendar-model.ts
- Legacy: Legacy date range uses moment().start/endOf month in user timezone `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:158-163`
- Expected fix: Test timezone boundary differences for learners outside IST and DST devices.

## G2-2-011-053 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LC:32-45 individual failure semantics
- Expected fix: Add per-date fault isolation while preserving conflict preview.

## G2-13-028-023 [P1] GAP facet F06
- Files: src/components/projects/project-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/components/admin/projects/projectSectionFieldConfigs.js:99-103 Sprint picker with empty backlog default
- Expected fix: Enable admin plan sprint linking including unassigned backlog tasks.

## G2-3-001-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/quizzes/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/quizzes.js:7-17`
- Expected fix: Show legacy college-unassigned warning and contact-administrator guidance, not only generic scope component.

## G2-3-015-023 [P1] GAP facet F10
- Files: src/modules/placements/tpo-delete-draft-service.ts, src/modules/placements/job-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/JobRepository.java:156-158`
- Expected fix: Legacy softDeleteById sets isActive false,isDeleted true,version+1 on any matching ID; vNext archives DRAFT or stops nonpublished under guarded lifecycle. Reconcile deletion policies including published-with-applications.

## G2-3-003-033 [P1] GAP facet F10
- Files: src/components/courses/learner-quiz-attempt.tsx, src/app/api/courses/quizzes/[quizId]/my-attempts/route.ts
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:11-20`; `docs/legacy-source/frontend/src/api/Services/quizServices.js:39-52`
- Expected fix: Legacy `/api/v1/quizzes/:id/attempt`, `/my-submissions`; vNext uses scoped GET quiz and own attempts with mandatory deliveryId; repair bookmarked old `/quiz?quizId=` lacking deliveryId via scope resolve.

## G2-4-021-003 [P1] GAP facet F01
- Files: src/modules/bug-tracker/report-service.ts
- Legacy: Legacy reporters access issue using BugTrackerAccess association. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugReport.java:21-23`)
- Expected fix: Provide approved reporter-specific status view without exposing manager notes.

## G2-14-028-063 [P1] GAP facet F22
- Files: src/modules/projects/college-project-summary-model.ts, src/modules/projects/college-project-summary-service.ts
- Legacy: Legacy workspace scalar project status/progress/classId plus detailsToken. `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/[workspaceId]/summary.js:230-249`
- Expected fix: Field-by-field migration; preserve null/date semantics.

## G2-5-003-043 [P1] GAP facet F10 Actions/side effects
- Files: src/modules/academics/college-section-mutation-service.ts
- Legacy: PUT /api/v1/class/update/:id allows reassignment with college/program validation. (docs/legacy-source/frontend/src/pages/superadmin/sections/Classes.js:274-285; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassController.java:181-216)
- Expected fix: Add explicit safe migration/reassignment pathway if parity required.

## G2-5-016-023 [P1] GAP facet F10
- Files: src/app/api/skills/route.ts
- Legacy: Loader runs ordered after skill seed and inserts absent synonyms `docs/legacy-source/backend/src/main/java/com/_42students/lms/config/SynonymDataLoader.java:13-20,109-160`
- Expected fix: Replay curated synonym seed after parent skills migration.

## G2-5-032-033 [P1] GAP facet F10
- Files: src/modules/placements/placement-offer-expiry-sweep-service.ts
- Legacy: Legacy digest and overdue offers are scheduled repeatedly. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:69-73`
- Expected fix: Schedule sweep in deploy infrastructure with at-least-once and idempotent audit.

## G2-6-028-013 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Workload groups projectMentorMember userId or Unassigned, counts and at-risk derived from fetched active projects (reassign-mentor.js:120-155).
- Expected fix: Align active/completed inclusion and at-risk evaluator; define count denominator consistently.

## G2-7-006-023 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: LBE/controller/AdminProjectTemplateController.java:70-92: errors 401/400/403/500 differentiated.
- Expected fix: Separate authorization/no-scope from transient DB error.

## G2-7-012-003 [P1] GAP facet F01
- Files: src/components/projects/project-workspace.tsx
- Legacy: readiness.js:78-82 Manage override links college-admin/projects/readiness?projectId
- Expected fix: Use /college/projects/readiness and keep projectId

## G2-7-030-003 [P1] GAP facet F01
- Files: src/components/projects/project-admin-audit-page.tsx
- Legacy: audit/index.js:398-404 entity workspace Open goes to /superadmin/projects/workspaces/{id}/summary?from=audit
- Expected fix: Add direct workspace Open link with from=audit and UUID crosswalk
