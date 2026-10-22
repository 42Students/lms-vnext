# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-12-017-025 [P1] GAP facet F07
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/projects/pr-s2-04-task-fields-model.ts
- Legacy: Old comment may store progressValue and snapshot for quick action `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:34-41`
- Expected fix: Extend source-backed command shape for system updates.

## G2-12-017-041 [P1] MISSING facet F12
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/projects/task-comment-service.ts
- Legacy: Task status snapshots record when system updates happen `docs/legacy-source/backend/src/main/resources/db/migration/V77__project_task_comment_actions.sql:1-4,16-24`
- Expected fix: Add status snapshot capture and preserve action causality.

## G2-12-017-062 [P1] GAP facet F23
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/projects/task-comment-service.ts
- Legacy: Old stored historical author and task progress snapshots `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTaskComment.java:22-41`
- Expected fix: Persist immutable author/task event metadata, avoid retroactive history drift.

## G2-12-001-032 [P1] MISSING facet F17 Keyboard/accessibility
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/components/marketing/marketing-layout.tsx
- Legacy: Skip-to-main visible on focus and targets main id `docs/legacy-source/frontend/src/components/marketing/MarketingLayout.jsx:109-114`
- Expected fix: Add skip link with visible focus and target id

## G2-13-012-027 [P1] GAP facet F12
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/placements/public-join/domain-model.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/company/CompanyDomainService.java:94-102` normalized registrable via Guava public suffix, then domain lookup
- Expected fix: Use PSL-backed registrable-domain library and shared normalization across all company gates

## G2-17-23-051 [P1] GAP facet F10 Offer history
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: (none, new feature)
- Legacy: TS:180–187 updates raw offer; JS:1238–1241 publishes ApplicationStatusChangedEvent and JS:1259–1268 closes released offers
- Expected fix: Ensure offer state, application history, timeline and cascade identifier are consistently joined; avoid double historical events on replay

## G2-17-028-027 [P1] GAP facet F11 Superadmin scope
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: (none, new feature)
- Legacy: LR:12-16 uses selectedCollegeId; no-scope branch LR:30-49 keeps shell and college-selection banner
- Expected fix: Render distinct `No college selected` shell/banner on missing selected scope; never suppress nav tabs

## G2-18-019-046 [P1] GAP facet F22 Table name/key
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: (none, new feature)
- Legacy: LV:10-16 `faculty_acct_verification` with BaseModel ID int LB:23-26
- Expected fix: Document legacy row-to-user mapping; deliberate separate-table retirement means no 1:1 PK migration required for expired OTP rows

## G2-18-030-058 [P1] GAP facet F22 Schema mapping
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: (none, new feature)
- Legacy: L:105-109 `college_id` integer and record numeric id, name
- Expected fix: Document legacy int→UUID ID translation, tenant scope and archivedAt vs delete for integrations/export

## G2-13-006-015 [P1] MISSING facet F03
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/placements/learner-placement-announcement-model.ts
- Legacy: Announcement with jobId offers Open the drive link (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:79-83`)
- Expected fix: Expose verified jobId and link authorized drive details where original linked.

## G2-13-006-021 [P1] GAP facet F05
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/app/(authenticated)/learn/my-placements/announcements/page.tsx
- Legacy: Legacy updates list shows all placement overview notices except PLACEMENT_ANNOUNCEMENT (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:38-39`)
- Expected fix: Map overview notice sources fully; do not hide older action updates silently.

## G2-13-006-071 [P1] GAP facet F22
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/placements/learner-placement-announcement-model.ts
- Legacy: Old announcement payload fields pinned, unread, updated, authorName, forYou, showUntil, jobId, linkUrl (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:54-83`)
- Expected fix: Build schema/field migration crosswalk, restore read status + action job mapping.

## G2-13-001-028 [P1] GAP facet F05
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/placements/recruiter-company-reports-service.ts
- Legacy: Reports rows source exclusively recruiter's own drives (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:97-104`)
- Expected fix: Decide owner scope explicitly; if exact parity required constrain to creator/approved owned jobs.

## G2-13-001-050 [P1] GAP facet F12
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/placements/recruiter-company-reports-service.ts
- Legacy: Reports per drive use workspace.funnel(jobId) and SUM totals by stage (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:97-124`)
- Expected fix: Reconcile funnel stage definitions, status inclusion, and own-drive cohort against original model.

## G2-13-001-084 [P1] GAP facet F22
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/placements/recruiter-company-reports-service.ts
- Legacy: Legacy job_offer aggregates RELEASED/ACCEPTED/DECLINED and JOINED (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/recruiter/RecruiterWorkspaceService.java:105-116`)
- Expected fix: Map RELEASED→ISSUED and joined semantics; verify old offer schema and Drizzle enum migrations.

## G2-13-004-014 [P1] GAP facet F04
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/placements/hr-conversation-inbox-service.ts
- Legacy: Legacy unread excludes kind EVENT and counts unread TPO MESSAGE (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:221-226`)
- Expected fix: Exclude non-user message kinds from unread tallies; verify DB message schema.

## G2-13-004-039 [P1] GAP facet F11
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/placements/hr-conversation-inbox-service.ts
- Legacy: College session required by RecruiterSelfController requireSelectedCollege (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterSelfController.java:109-120`)
- Expected fix: Validate no cross-college leakage across all authorized grants.

## G2-13-004-068 [P1] GAP facet F22
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/placements/hr-conversation-inbox-service.ts
- Legacy: Old tables tpo_message_thread/tpo_message, recruiter_id, college_id, job_id, kind, read_at (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:218-226`)
- Expected fix: Verify migrations/status mappings for kind EVENT vs MESSAGE, read receipt and uniqueness.

## G2-13-004-070 [P1] GAP facet F22
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/placements/hr-conversation-inbox-service.ts
- Legacy: Legacy TPO reply unread only kind MESSAGE, not EVENT (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMessagesService.java:223-225`)
- Expected fix: Match messageKind/status filter or explicitly mark events read/non-unread.

## G2-13-011-024 [P1] GAP facet F11
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/messaging/runtime-safety.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationDispatcherServiceImpl.java:114-118` and `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoMailService.java:203-219` STAGE nonprod DEV_MAIL_ALLOW supports email or @domain
- Expected fix: Reconcile dev allowlist contracts; choose safe centralized config and migration path for test-domain allowlists

## G2-14-007-037 [P1] GAP facet F20
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/app/(authenticated)/college/groups/[groupId]/page.tsx
- Legacy: Legacy groupId any string (including invalid/removed) still reaches People; vNext group details missing ID triggers notFound — `docs/legacy-source/frontend/src/pages/college-admin/student-groups/[id].js:6-12`
- Expected fix: Catch all legacy group ID forms, ignore group data, redirect consistently

## G2-18-029-007 [P1] MISSING facet F07
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: (none, new feature)
- Legacy: Required messages plus red Alert with server field mappings and Retry delete (legacy:168-207,506-516)
- Expected fix: Field-level errors, red alert headings, sticky failed-record Retry delete

## G2-14-001-026 [P1] GAP facet F06
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/app/(authenticated)/tpo/students/page.tsx
- Legacy: Legacy bulk message ready chips, textarea rows4 max1000; vNext nudge separate from bulk picker — `docs/legacy-source/frontend/src/components/tpo/students/StudentActions.jsx:23-30,62-77`
- Expected fix: Restore all five ready messages and textarea within unified actions

## G2-14-009-015 [P1] GAP facet F04
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/attendance/faculty-learner-attendance-detail.ts, src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Sessions and Active days count held sessions only `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:142-165`
- Expected fix: Exclude future sessions from those legacy counts

## G2-14-009-051 [P1] GAP facet F12
- Verification: DEFERRED — Full source-to-legacy behavior and dependency checks remain outstanding; no parity claim made.
- Files: src/modules/attendance/faculty-learner-attendance-detail.ts
- Legacy: Held-only session count `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:142-173`
- Expected fix: Align held-only legacy label
