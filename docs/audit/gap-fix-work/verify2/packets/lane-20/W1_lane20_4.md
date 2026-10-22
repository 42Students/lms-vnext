# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-18-004-095 [P1] GAP facet F21
- Files: src/app/(authenticated)/learn/notifications/page.tsx
- Legacy: Legacy page uses notificationService and announcement API; no email templates rendered here. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:22-24`
- Expected fix: Enable announcement feature when migration complete; show accurate source unavailable warning.

## G2-19-004-040 [P1] MISSING facet F10
- Files: src/app/(authenticated)/learn/my-placements/schedule/page.tsx
- Legacy: Legacy GET `/api/v1/jobs/all/{learnerId}` for visible application deadlines `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:81-87`
- Expected fix: Add authorized un-applied active job deadline source to calendar aggregation.

## G2-19-004-080 [P1] GAP facet F21
- Files: src/app/(authenticated)/learn/my-placements/schedule/page.tsx, src/components/placements/learner-round-confirm-attendance.tsx, src/components/placements/learner-schedule-reschedule.tsx
- Legacy: Legacy ScheduleCards call TpoHub journey, confirm and reschedule and legacy Interviews service `docs/legacy-source/frontend/src/pages/learn/my-placements/schedule.js:9-14` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:3-4` `docs/legacy-source/frontend/src/api/Services/TpoHubService.js:171-179` `docs/legacy-source/frontend/src/api/Services/interviewService.js:49-61`
- Expected fix: Map old interview/assessment adapters, status and notification contracts to new services.

## G2-2-006-024 [P1] MISSING facet F07
- Files: (none, new feature)
- Legacy: LS:153-156 'Assignment requires 1 to 30 resources'
- Expected fix: Fail missing-resource saves with exact message on legacy-compatible path.

## G2-2-008-001 [P1] GAP facet F01
- Files: (none, new feature)
- Legacy: LC:41-46 admin assignment POST /{lessonContentId}/publish-grades
- Expected fix: Add guarded server bulk publish endpoint or document batch client semantics.

## G2-2-011-009 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: LC:148-156 generates inclusive matching date range, capped 200 occurrences
- Expected fix: Align recurrence cap semantics; 93 calendar-day max can reject valid ≤200-occurrence semester series.

## G2-2-013-038 [P1] GAP facet F22
- Files: (none, new feature)
- Legacy: LC:76-102 nullable counts on failures
- Expected fix: Return partial counts and carry null per failing dimension.

## G2-2-014-050 [P1] GAP facet F23
- Files: (none, new feature)
- Legacy: LF:595-620 cross-page selection
- Expected fix: Restore selection across paginated catalog while isolating acting-college scopes.

## G2-2-020-011 [P1] GAP facet F03
- Files: src/modules/projects/instance-restore-service.ts
- Legacy: Legacy frontend workspaces/deleted.js:83-89 warns mentor may not recover on restore
- Expected fix: Expose mentor-missing condition and recovery guidance; reconcile reject-versus-blocked behavior.

## G2-2-020-040 [P1] GAP facet F10
- Files: src/modules/projects/college-project-roster-service.ts
- Legacy: AdminProjectController.java:527-553 assigns learners without replacing whole roster
- Expected fix: Offer additive membership mode; prevent accidental removal of existing members.

## G2-2-024-002 [P1] MISSING facet F01
- Files: src/app/(authenticated)/admin/audit/page.tsx
- Legacy: AdminSmsLogController.java:49-57 endpoint query recipientSuffix,purpose,page,size
- Expected fix: Expose dedicated SMS attempt query API.

## G2-14-025-055 [P1] GAP facet F20
- Files: src/modules/placements/recruiter-calendar-service.ts
- Legacy: RecruiterDriveController.java:64-71 UTC ISO instants and exclusive end
- Expected fix: Test precise midnight inclusivity and UTC conversion.

## G2-2-001-022 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LD:229-234 fixed repo select lms,lms2-fe,both,infra,other and SHA 7-40 lowercase
- Expected fix: Map legacy repo whitelist to accepted repository values and set legacy default lms2-fe; validate sha format.

## G2-2-003-016 [P1] MISSING facet F10
- Files: (none, new feature)
- Legacy: LC:30 @PostConstruct validates all events at startup
- Expected fix: Add startup readiness audit and operational health metric, respecting non-production send restrictions.

## G2-20-030-059 [P1] GAP facet F12
- Files: src/app/(authenticated)/teacher/profile/contacts/page.tsx
- Legacy: Legacy contact profile allows alternate phone/email edits with required primary phone (`docs/legacy-source/frontend/src/components/profile/about/contacts.js:15-22`, `docs/legacy-source/frontend/src/components/profile/about/contacts.js:63-94`)
- Expected fix: Restore intentional contact editing after schema/authorization readiness

## G2-3-001-048 [P1] GAP facet F10
- Files: src/app/api/courses/quizzes/[quizId]/route.ts, src/app/api/courses/quizzes/[quizId]/transition/route.ts, src/app/api/courses/quizzes/[quizId]/results/route.ts
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:15-20`; `docs/legacy-source/frontend/src/api/Services/quizServices.js:27-36`
- Expected fix: Map PUT/update, PATCH publish, PATCH results, DELETE to vNext PATCH/POST transition/POST results; check method/payload/status semantics.

## G2-11-016-075 [P1] GAP facet F22
- Files: src/modules/placements/tpo-messages-service.ts
- Legacy: `docs/legacy-source/frontend/src/components/tpo/MessagesPanel.js:208-245`
- Expected fix: Legacy per-drive or general recruiter thread, changeRequest quote, delivery via email, unread/seen; vNext normalized message threads and recipient membership table, migrate thread IDs/permissions.

## G2-11-028-025 [P1] GAP facet F07
- Files: src/modules/projects/instance-restore-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:69-75`
- Expected fix: Legacy restore can return BLOCKED due to missing mentor and warns to assign one; vNext refuses restoration unless active primary mentor exists, surfaces PROJECT_INVALID_STATE.

## G2-11-028-041 [P1] GAP facet F12
- Files: src/modules/projects/instance-restore-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:70-74`
- Expected fix: Legacy soft-deleted workspace restores to BLOCKED mentorless if membership missing; vNext ARCHIVED returns PLANNED/ACTIVE/COMPLETED previous status only when primary mentor is active.

## G2-11-028-071 [P1] GAP facet F23
- Files: src/modules/projects/instance-restore-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/projects/workspaces/deleted.js:69-83`
- Expected fix: Legacy destructive delete/restore semantics require product decision or explicit separate UI; do not silently claim archive/restore is parity.

## G2-12-014-004 [P1] MISSING facet F01
- Files: src/app/api/admin/placements/applications/export/route.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:106-115`
- Expected fix: Legacy POST `/refresh` for global Super Admin cache rebuild; no corresponding vNext app search-cache refresh endpoint (SQL read has no cache). Document intentional removal.

## G2-18-017-050 [P1] GAP facet F23
- Files: src/modules/projects/instance-restore-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMember.java:38-39`
- Expected fix: Workspace deletion owner-marked members not restored with old deletedByWorkspace semantics; explicit migration/business decision.

## G2-3-005-056 [P1] GAP facet F20
- Files: src/app/(authenticated)/admin/quizzes/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:128-155`
- Expected fix: Must key/invalidate all dialogs when active college changes, not only server directory list.

## G2-4-016-040 [P1] GAP facet F11
- Files: src/modules/messaging/receipt-detail-service.ts
- Legacy: Legacy controller requireSuperAdmin, global support sees all attempts. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:29-31`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminSmsLogController.java:58-60`)
- Expected fix: Implement globally privileged support access while respecting privacy and audit.

## G2-4-007-045 [P1] GAP facet F14
- Files: src/app/(authenticated)/admin/assignments/page.tsx
- Legacy: Export filename assignments-college-ID-page-P.csv with 8 columns. (`docs/legacy-source/frontend/src/pages/superadmin/sections/Assignments.js:329-341`)
- Expected fix: Match per-page CSV name, columns, timezone and disabled state.
