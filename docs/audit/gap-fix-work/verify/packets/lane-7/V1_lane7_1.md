# Verification packet (P1 sample): 18 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-10-010-023 [P1] GAP facet F10
- Files: src/app/(authenticated)/superadmin/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/index.js:11-14` GET /superadmin triggers HTTP302 Location /superadmin/dashboard
- Expected fix: Make GET response location compatible with legacy destination intent

## G2-10-021-103 [P1] GAP facet F22
- Files: src/modules/placements/super-admin-hr-validation.ts, src/components/admin/super-admin-hr-types.ts
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/RecruiterAccounts.js:136-149; docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminRecruiterController.java:136-149 — Grants keyed collegeId and nullable validUntil.
- Expected fix: Map access policy, expiration behavior and verified relationship constraints.

## G2-11-006-003 [P1] GAP facet F01
- Files: src/components/tpo/tpo-audit-grid.tsx
- Legacy: Context links go to /tpo/drives/:id, /tpo/recruiters/:id, /tpo/students?student=:id. `docs/legacy-source/frontend/src/pages/tpo/audit.js:17`
- Expected fix: Map legacy contexts to working vNext deep links and verify 404/tenant handling.

## G2-11-012-053 [P1] MISSING facet F09
- Files: src/app/(authenticated)/tpo/placements/lifecycle/page.tsx
- Legacy: Close drives consequence requires acknowledgement irreversible. `docs/legacy-source/frontend/src/pages/tpo/drives/index.js:266`
- Expected fix: Add bulk close acknowledgement and count preview.

## G2-13-006-073 [P1] GAP facet F22
- Files: src/modules/placements/learner-placement-announcement-model.ts
- Legacy: Legacy unread/read state in announcement source (`docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:56-68`)
- Expected fix: Connect per-member read receipt to New badge and mark-as-read.

## G2-15-009-053 [P1] GAP facet F12
- Files: src/modules/attendance/faculty-marking-window.ts
- Legacy: Legacy Ready to mark regardless of scheduled time (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:294-297`)
- Expected fix: Resolve product timing policy and align UI/server, including historical marks

## G2-18-011-013 [P1] GAP facet F04
- Files: src/modules/placements/placement-legacy-posting-model.ts
- Legacy: Legacy important_dates can use `type` or `dateType` and UTC time (`JobServiceImpl.java:1545-1577`).
- Expected fix: Migrate `type/dateType` and date fields to canonical calendar event type without losing classification.

## G2-18-004-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/learn/notifications/page.tsx, src/modules/activity/learner-notification-inbox-model.ts
- Legacy: Legacy deep link query uses `?tab=course\\|project\\|general\\|job`. `docs/legacy-source/frontend/src/components/Notifications/NotificationsContent.jsx:532-558`
- Expected fix: Translate old tab query to validated category in authorized compatibility redirect.

## G2-19-007-073 [P1] MISSING facet F20
- Files: src/app/(authenticated)/college/courses/offerings/[offeringId]/page.tsx
- Legacy: Legacy numeric redirect uses router.replace preserving no extra history entry `docs/legacy-source/frontend/src/pages/college-admin/courses/[id].js:103-113`
- Expected fix: Add server redirect/rewrite preserving URL history and old links.

## G2-2-022-023 [P1] GAP facet F07
- Files: src/app/(authenticated)/admin/quizzes/page.tsx
- Legacy: AdminQuizController.java:62-84 scoped Super Admin forbidden messages
- Expected fix: Ensure wrong college within org and wrong org are both explicitly denied.

## G2-2-034-003 [P1] GAP facet F01
- Files: src/lib/report-client-error.ts
- Legacy: docs/legacy-source/frontend/src/utils/clientErrorReporting.js:90-103 captures API, auth, video, upload failures
- Expected fix: Provide redacted categorical API/auth/video/upload event hooks and call sites.

## G2-20-025-003 [P1] MISSING facet F03
- Files: src/app/company-share/[token]/page.tsx
- Legacy: Send code email docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/PublicShareController.java:37-40
- Expected fix: Add email code

## G2-5-009-073 [P1] GAP facet F22 Data/migrations
- Files: (none, new feature)
- Legacy: Attend keyed student_id/class_schedule_id with absence reason (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:11-43)
- Expected fix: Field-by-field migration of old exceptions to new statuses.

## G2-15-025-013 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LBE/dto/tpo/DriveForm.java:15-55 fields jobTitle, companyName/logo/id, jobDescription, jdUrl, location, driveMode, registration details, roleOptions, eligibility, rounds, deadline, seasonId.
- Expected fix: Provide explicit field-by-field DTO map and unambiguous defaults for imported legacy drafts.

## G2-7-015-023 [P1] GAP facet F06
- Files: (none, new feature)
- Legacy: LFE/pages/college-admin/projects/workspaces/[workspaceId]/summary.js:66-85,588-591 status options ACTIVE,IN_PROGRESS,READY,BLOCKED,ARCHIVED disabled
- Expected fix: Define lifecycle migration mapping; preserve legacy status meanings and invalid state warning

## G2-8-027-023 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: Legacy scheduling status requires SHORTLISTED/ASSESSMENT/INTERVIEW/OFFERED/HIRED (docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/InterviewServiceImpl.java:97-99,197-201).
- Expected fix: Reconcile eligible application states, especially assessment/rejected/offer and special cases.

## G2-9-015-003 [P1] GAP facet F01
- Files: src/app/(authenticated)/college/placements/drives/page.tsx
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/all.js:27-36` — No college -> Admin not assigned to a college + contact administrator warning.
- Expected fix: Use legacy contextual unassigned-college warning.

## G2-9-013-103 [P1] GAP facet F23
- Files: src/modules/placements/college-drive-archive-preview-service.ts
- Legacy: `docs/legacy-source/frontend/src/pages/college-admin/jobs/[jobId]/settings.js:145-165` — Delete exposed even for published active drive after metric verification.
- Expected fix: Explain close-before-archive rule and impact; preserve deliberate safety constraint.
