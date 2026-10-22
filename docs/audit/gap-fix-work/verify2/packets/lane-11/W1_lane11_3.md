# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-002-049 [P1] MISSING facet F08
- Files: src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx
- Legacy: Selection submitted success count with verification warning `docs/legacy-source/frontend/src/pages/recruiter/drives/[jobId].js:717`
- Expected fix: Restore exact receipt

## G2-11-009-015 [P1] MISSING facet F03
- Files: src/app/(authenticated)/tpo/drive-day/page.tsx
- Legacy: Stale error Alert has Retry action and dismiss affordance. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:54`
- Expected fix: Add dismissible stale-state alert with Retry.

## G2-11-012-102 [P1] GAP facet F23
- Files: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx
- Legacy: Original Drives is data-table command list and bulk ActionsWindow. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:439`
- Expected fix: Rebuild old-look table, bulk select and actions.

## G2-17-029-015 [P1] GAP facet F04
- Files: src/components/admin/super-admin-attendance-settings-editor.tsx
- Legacy: legacy TenantSettings.js:238-258 college attendance threshold 1..100 and correction window 1..8760
- Expected fix: Explain new 168h effective cap vs legacy 8760h and reconcile validated range with policy server and historical UI

## G2-17-029-036 [P1] GAP facet F10
- Files: src/components/admin/tenant-settings-other-keys.tsx
- Legacy: legacy TenantSettings.js:733-762 can add any custom setting through same scope PUT
- Expected fix: Make stored-only semantics explicit in user journey and separate operationally effective overrides

## G2-12-005-086 [P1] GAP facet F23
- Files: src/app/(authenticated)/learn/my-placements/placement/page.tsx
- Legacy: Legacy rules shown inline `docs/legacy-source/frontend/src/components/Placements/PlacementCellContent.js:234-237`
- Expected fix: Restore inline preview/full text per owner requirement

## G2-13-010-002 [P1] GAP facet F01
- Files: src/modules/placements/college-stage-action-model.ts
- Legacy: Old frontend admin validator mirrors backend state-machine (`docs/legacy-source/frontend/src/utils/placementApplicationTransitions.js:1-26`)
- Expected fix: Synchronize UI controls with validated server transitions and explain omitted historical edges.

## G2-13-010-015 [P1] GAP facet F05
- Files: src/modules/placements/college-stage-action-model.ts
- Legacy: Old APPLIED next is SHORTLISTED,REJECTED,WITHDRAWN (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:18-19`)
- Expected fix: Remove APPLIED→ASSESSMENT shortcut absent in old, keep separate withdrawal action.

## G2-13-010-017 [P1] GAP facet F05
- Files: src/modules/placements/college-stage-action-model.ts
- Legacy: Old INTERVIEW next SHORTLISTED,ASSESSMENT,OFFERED,WAITLISTED,REJECTED,WITHDRAWN (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:28-32`)
- Expected fix: Restore valid multi-round regressions INTERVIEW→ASSESSMENT/SHORTLISTED after DB/stage checks.

## G2-13-010-018 [P1] GAP facet F05
- Files: src/modules/placements/college-stage-action-model.ts
- Legacy: Old OFFERED next HIRED,REJECTED,INTERVIEW,WITHDRAWN (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobApplicationStatusValidator.java:34-35`)
- Expected fix: Handle OFFERED→INTERVIEW reversal after offer outcome cancellation verification.

## G2-17-23-058 [P1] GAP facet F12 State prerequisite
- Files: (none, new feature)
- Legacy: TS:173–180 only RELEASED offer and nonexpired deadline may respond; JS:1191–1196 requires application OFFERED
- Expected fix: Explicitly map old offer/application dual states to new issued state; detect inconsistent legacy-migrated rows before accepting

## G2-17-028-045 [P1] GAP facet F22 Readiness DTO
- Files: (none, new feature)
- Legacy: LD:7-27 flat readyForSubmission, readinessState, reason, counters, submissionStatus, overrideAt/name
- Expected fix: Publish explicit DTO mapping including readinessState/reason and proofCoverage; avoid UI comparing non-equivalent flags

## G2-18-026-012 [P1] GAP facet F06 Create payload
- Files: (none, new feature)
- Legacy: NPC:60-83 accepts `{name,dept_id,duration_years}` via SnakeCase DTO
- Expected fix: Explicitly adapt snake_case and derive code/terms at legacy-client boundary; do not silently accept missing required code

## G2-19-029-018 [P1] GAP facet F04 Warning headline
- Files: (none, new feature)
- Legacy: LG:223-228 `Can go live, but some things are missing`, login works despite warnings
- Expected fix: Render nonblocking advisory warnings independently; unknown required evidence must still prevent full readiness, not be mixed into advisory list

## G2-13-006-036 [P1] GAP facet F10
- Files: src/modules/placements/learner-placement-alerts-service.ts
- Legacy: GET learner/placement/overview contains placement notices array (`docs/legacy-source/frontend/src/api/Services/TpoHubService.js:169-170`)
- Expected fix: Crosswalk old event categories, source, status and read semantics.

## G2-13-006-042 [P1] GAP facet F12
- Files: src/modules/placements/learner-placement-alerts-service.ts
- Legacy: Legacy filters updates excluding PLACEMENT_ANNOUNCEMENT event to prevent duplicate (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:38-40`)
- Expected fix: Deduplicate official announcement events against announcement list; avoid repeated bell content.

## G2-13-006-054 [P1] GAP facet F15
- Files: src/modules/placements/learner-placement-alerts-service.ts
- Legacy: Old updates represent offer, round, application, request notifications (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:11-14`)
- Expected fix: Verify each legacy event producer still emits in_app_notifications.

## G2-13-006-072 [P1] GAP facet F22
- Files: src/modules/placements/learner-placement-alerts-service.ts
- Legacy: Old placement overview notices have event field and link (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:38-39`)
- Expected fix: Map old event taxonomy and de-duplicate announcement cases.

## G2-13-006-076 [P1] GAP facet F23
- Files: src/modules/placements/learner-placement-alerts-service.ts
- Legacy: Legacy sees announcements just once under this page rather than in overview list (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:11-14`)
- Expected fix: Enforce cross-section de-duplication by event/source key.

## G2-13-013-018 [P1] GAP facet F06
- Files: src/app/(authenticated)/admin/lessons/page.tsx, src/app/(authenticated)/college/lessons/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:65-68` scoped superadmin can supply courseId and requireAccessCourse
- Expected fix: Add authorized global-superadmin lesson search without selected college for parity, with optional college/course filters

## G2-14-003-057 [P1] GAP facet F14
- Files: src/app/api/admin/course-progress/students/export/route.ts
- Legacy: Legacy CSV columns learnerId/name/rollNumber/videos/videoTotal/assignments/assignmentTotal/quizzes/quizTotal/percent; vNext Student/Videos/Assignments/Quizzes/Progress (%) only — `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:212-224`
- Expected fix: Export exact 10-field roster CSV plus IDs and denominators

## G2-18-021-006 [P1] GAP facet F03
- Files: (none, new feature)
- Legacy: Explicit `type` distinguishes screening/technical/application deadlines; independent `label` (DTO:20-29)
- Expected fix: Add optional raw importantDateType and label to model; color/classify by type first

## G2-19-026-007 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: `GET /tree`: collegeId, learnerCount, nodes, canEditCollegeLevel (service:200-205)
- Expected fix: Return visible node entries for all scopes, not solely active override rows

## G2-14-002-028 [P1] GAP facet F05
- Files: src/components/admin/super-admin-student-bulk-access.tsx
- Legacy: Legacy select preserved across pagination and unlimited matching selected; vNext first100 shown, max25 — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:1524-1583`
- Expected fix: Preserve selected IDs across pages and allow all filtered permitted students

## G2-18-031-010 [P1] GAP facet F03
- Files: src/app/(authenticated)/admin/students/page.tsx, src/components/admin/person-membership-actions.tsx
- Legacy: Legacy Students row icon actions Edit, Audit trail, Profile, Clear OTP lockout, SA Impersonate, Suspend/Reactivate, Delete; Students.js:966-1086
- Expected fix: Create explicit per-action parity sheet and surface supported OTP/audit/impersonation actions or document removals
