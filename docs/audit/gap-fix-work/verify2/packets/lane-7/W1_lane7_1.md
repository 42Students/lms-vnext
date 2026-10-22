# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-029-011 [P1] GAP facet F03
- Files: src/app/company-share/[token]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:156-160: ZIP+Download list buttons in Card extra.
- Expected fix: Restore authorized ZIP or formally retire with clear capability notice.

## G2-1-029-028 [P1] MISSING facet F06
- Files: src/app/company-share/[token]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:151: optional email send action after info.emailCodeAvailable.
- Expected fix: Add conditional Send code action only for verified recipient.

## G2-1-029-038 [P1] GAP facet F10
- Files: src/app/company-share/[token]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:90: sendShareCode(token) provider side effect.
- Expected fix: Reconnect verified code delivery with anti-pumping caps.

## G2-1-029-067 [P1] GAP facet F21
- Files: src/app/company-share/[token]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/company-share/[token].js:90-100: resend provider status TOO_SOON/LIMIT and 15minute code.
- Expected fix: Link provider with per-recipient rate limits and no PII leakage.

## G2-12-022-052 [P1] GAP facet F19
- Files: src/app/(authenticated)/tpo/placements/jobs/[jobId]/rounds/[roundId]/results/page.tsx
- Legacy: docs/legacy-source/frontend/src/components/tpo/drive/ResultsEntryModal.jsx:185-189 — grid 420px viewport and table virtualization
- Expected fix: Provide multi-page eligible roster/bulk operations for large campus drives

## G2-18-024-015 [P1] GAP facet F05
- Files: src/app/(authenticated)/activity/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:110-112,175-183 — category important/setup/people/teaching/projects overrides actionKey/entity filters.
- Expected fix: Reproduce legacy category feed classification with a category→event mapping.

## G2-19-020-027 [P1] GAP facet F13
- Files: src/modules/bug-tracker/readiness.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BugTrackerAccess.java:27-28 — legacy seeded active accounts accessible to reporting.
- Expected fix: Ensure migration applied and acceptance tested.

## G2-10-001-036 [P1] MISSING facet F17
- Files: src/components/marketing/marketing-layout.tsx
- Legacy: Focus-only Skip to main content link and main-content target `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:109-115` `docs/legacy-source/frontend/src/components/marketing/marketing.module.scss:32-45`
- Expected fix: Add focus-visible skip link and main landmark id

## G2-10-025-055 [P1] GAP facet F11
- Files: src/modules/placements/recruiter-profile-service.ts, src/app/(authenticated)/hr/profile/page.tsx
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:137-141 — Scoped /me must show only selected-college grant.
- Expected fix: Restrict scoped view to selected grant or explicit safe global mode

## G2-10-025-095 [P1] GAP facet F22
- Files: src/modules/placements/recruiter-profile-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:123-129 — Recruiter entity firstName,lastName,designation,contactMail,contactMobile.
- Expected fix: Document field split, login phone vs public contact

## G2-10-008-001 [P1] GAP facet F01
- Files: src/app/(authenticated)/admin/placements/hiring/page.tsx, src/app/(authenticated)/admin/placements/analytics/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/hiring-dashboard.js:11-37` /superadmin/hiring-dashboard under SuperAdminLayout, college-scoped
- Expected fix: Make the Analytics page the primary hiring-dashboard equivalent and preserve legacy deep link/active tab to it

## G2-10-016-054 [P1] MISSING facet F13
- Files: src/app/(authenticated)/admin/placements/drives/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Jobs.js:812-825 — Stale refresh warning retains previous rows and allows Retry.
- Expected fix: Preserve last success when safe/authorized, show warning.

## G2-10-018-039 [P1] GAP facet F08
- Files: src/app/(authenticated)/admin/lecture-halls/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/LectureHalls.js:411-412 — Alert 'Could not load lecture halls' with Retry above table.
- Expected fix: Render list-level Retry without losing create form.

## G2-10-021-030 [P1] GAP facet F06
- Files: src/modules/placements/super-admin-hr-validation.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:513-518 — Scoped creation requires >=1 college; global can create without grants.
- Expected fix: Preserve global no-college creation if backend permits, or flag policy change explicitly.

## G2-10-023-009 [P1] GAP facet F02
- Files: src/app/(authenticated)/admin/tenants/setup/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/TenantsHub.js:123-133 — Scoped Structure hides all global lists after warning.
- Expected fix: Suppress platform tenant listing/actions when non-global scope selected

## G2-17-026-001 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: Nine endpoints under `/api/v1/notification` including class/course and personal feeds; NotificationController.java:35,59,88,108,125,142,158,179,214,244,272
- Expected fix: Map each legacy operation to a role-specific vNext endpoint or explicitly record deprecated contract; do not claim old REST paths remain.

## G2-17-026-010 [P1] GAP facet F05
- Files: src/modules/activity/learner-notification-inbox-model.ts
- Legacy: Class/course filter: classId plus `courseSlug` precedence over `courseId`; NotificationController.java:125-139
- Expected fix: Add course-scoped navigation/filter if required by old course inbox; retain URL validation.

## G2-17-030-035 [P1] GAP facet F10
- Files: src/components/placements/super-admin-drive-deadline.tsx
- Legacy: Legacy `extendJobDeadline` uses current selected collegeId, refreshes jobs/attention; DrivesLanding.js:74-88
- Expected fix: Verify selected-SuperAdmin college authorization for endpoint; avoid use of college-only action without acting-scope.

## G2-11-003-100 [P1] GAP facet F22
- Files: src/app/(authenticated)/hr/drives/page.tsx
- Legacy: Legacy drive_change_request.direction row `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/RecruiterDriveWorkService.java:55`
- Expected fix: Migrate direction/target and OPEN statuses

## G2-11-006-034 [P1] GAP facet F08
- Files: src/app/(authenticated)/tpo/audit/error.tsx
- Legacy: Failed refetch with last rows shows `This refresh failed. Showing the last successful load.` and Retry. `docs/legacy-source/frontend/src/pages/tpo/audit.js:117`
- Expected fix: Keep stale data and display retryable inline alert.

## G2-11-007-059 [P1] GAP facet F10
- Files: src/components/tpo/tpo-company-team-conversation.tsx
- Legacy: Legacy company Team chat uses GET about `kind=COMPANY&key=normalized name`; messages POST by about name. `docs/legacy-source/frontend/src/pages/tpo/companies.js:188`
- Expected fix: Ensure name-keyed legacy threads remain reachable after canonical ID migration.

## G2-11-012-066 [P1] GAP facet F12
- Files: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx
- Legacy: Reminders exclude recordedOutside and deadline-passed. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:243`
- Expected fix: Hide/disable invalid reminder early with reason.

## G2-12-006-069 [P1] GAP facet F22
- Files: src/app/(authenticated)/learn/my-placements/applications/page.tsx
- Legacy: Logo/pay/jobType/offer/cancelReason fields present `docs/legacy-source/frontend/src/pages/learn/my-placements/applications.js:126-155`
- Expected fix: Extend safe projection

## G2-12-017-019 [P1] GAP facet F06
- Files: src/modules/projects/pr-s2-04-task-fields-model.ts
- Legacy: Old write DTO message @NotBlank, progressValue/int optional, commentType,taskStatusSnapshot `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectTaskCommentUpsertDTO.java:7-14`
- Expected fix: Preserve optional typed progress and status data in mutation contract.

## G2-12-017-024 [P1] MISSING facet F07
- Files: src/modules/projects/pr-s2-04-task-fields-model.ts
- Legacy: Old comment types treated as string, system types explicitly supported `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/projects/ProjectTaskCommentUpsertDTO.java:11-14` `docs/legacy-source/frontend/src/components/Projects/modals/TaskDetailsModal.jsx:21-35`
- Expected fix: Accept system events only from trusted task state actions, not human composer.
