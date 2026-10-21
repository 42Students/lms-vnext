# Verification packet (P1 sample): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-1-001-023 [P1] GAP facet F10
- Files: src/modules/people/college-faculty-lifecycle-service.ts
- Legacy: `AdminUserLifecycleController.java:178-204` bumps learner/faculty `token_version` and revokes each session on suspension.
- Expected fix: Add device-session revocation to faculty-specific route or route both entrypoints through one shared lifecycle transaction; verify stale-session denial.

## G2-1-002-013 [P1] GAP facet F04
- Files: src/app/api/auth/memberships/route.ts
- Legacy: `AuthController.java:343-356` POST `/switch` returns `accessToken`, `refreshToken`, `expiresIn`, `targetHost`, `hostChange`, `switchType`, `targetKey`, `collegeId`, `organizationId`, optional `handoffToken`.
- Expected fix: Rewrite all consumers expecting token-pair/host-change fields; use safe host-aware navigation and no raw auth tokens.

## G2-11-031-033 [P1] GAP facet F11
- Files: src/components/profile/learner-profile-workspace.tsx
- Legacy: docs/legacy-source/frontend/src/components/profile/about/contacts.js:27: current contacts tied to loginUser; form can alter primary mobile.
- Expected fix: Clarify secure primary-mobile update path.

## G2-1-004-003 [P1] GAP facet F01
- Files: src/components/profile/learner-profile-workspace.tsx
- Legacy: `LearnerProfileController.java:1110-1146,1177-1237` defines video intro, job-preferences and default resume GET/PUT separately.
- Expected fix: Map video and default resume lifecycle or explicitly document approved removal.

## G2-1-032-063 [P1] MISSING facet F17
- Files: src/components/auth/login-form.tsx
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:603: chooser radiogroup, buttons with aria-label role/college/status.
- Expected fix: Restore accessible chooser keyboard and announcements.

## G2-1-032-073 [P1] GAP facet F20
- Files: src/components/auth/login-form.tsx
- Legacy: docs/legacy-source/frontend/src/loginPages/Login.js:193-210: per-host 5min resume prevents account mix.
- Expected fix: Add host check and clear on mismatch.

## G2-10-002-043 [P1] GAP facet F10
- Files: src/components/announcements/super-admin-college-broadcast-form.tsx, src/app/api/admin/announcements/broadcast/route.ts
- Legacy: Legacy POST one broadcast to /api/v1/superadmin/announcements with title body pinned link showUntil audience collegeIds `docs/legacy-source/frontend/src/pages/superadmin/announcements.js:44-55` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAnnouncementController.java:40-44`
- Expected fix: Define migration-compatible broadcast contract and map fields exactly including immutable target semantics

## G2-10-002-053 [P1] GAP facet F12
- Files: src/modules/announcements/placement-cell-receipt-service.ts
- Legacy: Legacy read counted when any faculty in a target college marks viewed `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:338-349` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:408-417`
- Expected fix: Align college-read definition and explicitly distinguish first reader from per-user bell receipts

## G2-10-019-023 [P1] GAP facet F05
- Files: src/app/(authenticated)/admin/features/[collegeId]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/ModuleAccess.js:65-87,698-703 — Hierarchical tree expandable by parent, no pagination.
- Expected fix: Include every academic node even with no override; support parent expand/collapse.

## G2-19-024-023 [P1] GAP facet F09
- Files: src/components/announcements/announcement-admin-workspace.tsx
- Legacy: Legacy deletion via card Popconfirm `Delete this announcement?` with consequence text; AnnouncementList.jsx:93-104
- Expected fix: Make confirmation delete entire broadcast and withdraw all target notices atomically.

## G2-18-026-023 [P1] GAP facet F10 Audit creation
- Files: (none, new feature)
- Legacy: NPC:80-83 calls admin audit PROGRAM_CREATE on success; audit helper:52-57 may be null
- Expected fix: Crosswalk action/event taxonomy, entity and actor fields; confirm same admin audit screen can discover new records

## G2-14-009-043 [P1] GAP facet F10
- Files: src/components/attendance/faculty-attendance-workspace.tsx, src/modules/attendance/faculty-service.ts
- Legacy: Legacy mark POST bulk uses classScheduleId and learner IDs `docs/legacy-source/frontend/src/api/Services/attendanceServices.js:13-24` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:488-501`
- Expected fix: Map legacy and new ID semantics and reconcile API clients

## G2-14-014-033 [P1] GAP facet F11
- Files: src/modules/announcements/service.ts
- Legacy: Legacy global search disallows org-scoped and college-scoped SA `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:45-53`
- Expected fix: Decide whether global search is intentionally retired or offered only to true global SA

## G2-18-031-033 [P1] GAP facet F07
- Files: src/modules/people/college-student-csv-service.ts
- Legacy: Legacy CSV pre-validates mobile/email/roll duplicates, blocks create if validationKey stale or any duplicate; Students.js:759-865
- Expected fix: Keep preflight validation cache linked to exact CSV/selected academic options, indicate per-row post-preflight races

## G2-18-031-043 [P1] GAP facet F10
- Files: src/app/api/people/[membershipId]/lifecycle/route.ts, src/modules/people/membership-service.ts
- Legacy: Legacy suspend PUT /api/v1/admin/users/{userType}/{id}/suspend and reactivate; AdminUserLifecycleController.java:83-167
- Expected fix: Explicitly distinguish account-wide vs college membership effects and user ID vs membership ID in API clients

## G2-15-011-043 [P1] GAP facet F12
- Files: src/modules/announcements/tpo-notice-delivery-service.ts
- Legacy: SCHEDULED/SENT/FAILED status constants; future time only schedules. (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/NotificationServiceImpl.java:98-104`)
- Expected fix: Preserve common status and release semantics across all notification producers.

## G2-15-005-033 [P1] GAP facet F08
- Files: (none, new feature)
- Legacy: Legacy withdrew success toast `Application withdrawn successfully`; application closes immediately (JobDetailContent.jsx:448-472)
- Expected fix: Document approval-workflow change; use accurate copy and state; if parity required support direct eligible withdrawal

## G2-19-009-023 [P1] GAP facet F08
- Files: src/modules/attendance/faculty-service.ts, src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Old partial failure specifies N recorded / M failed, names and retry failed only `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:503-536`
- Expected fix: Explain atomic rejection and list offending learner IDs without replay.

## G2-19-009-033 [P1] GAP facet F12
- Files: src/components/attendance/faculty-attendance-workspace.tsx, src/modules/attendance/faculty-service.ts
- Legacy: Old reason sent as static Mark Absent `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:493-501`
- Expected fix: Explain written correction policy; differentiate first mark.

## G2-2-006-033 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: LS:207-321 @Transactional save updates old content row, class, resources, submissions and flags
- Expected fix: Persist resource structures atomically with assignment metadata, preserve legacy edit semantics.

## G2-2-019-033 [P1] MISSING facet F10
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: AdminNotificationDeliveryController.java:94-97 audit event `NOTIFICATION_RESEND` with classId metadata
- Expected fix: Add audit event for operator resend with college/actor/status.

## G2-2-019-043 [P1] MISSING facet F12
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: NotificationRepository.java:163-170 due query selects live scheduled rows only
- Expected fix: Never fan out CANCELLED/DELETED/FAILED until explicit retry, and respect due boundary.

## G2-2-019-063 [P1] MISSING facet F21
- Files: src/modules/announcements/super-admin-college-broadcast-service.ts
- Legacy: NotificationSchedulerService.java:102-150 scheduled fixed-delay job, distributed lease, SSE push
- Expected fix: Implement claimed/fenced background worker, idempotent recipient fanout and event notification.

## G2-2-027-053 [P1] GAP facet F12
- Files: src/modules/attendance/faculty-service.ts
- Legacy: AttendanceBulkController.java:127-146 allows per-student partial processing and independent errors.
- Expected fix: Decide explicit business semantic change and update retry/partial messaging, support per-row failure preview if desired.

## G2-2-034-033 [P1] GAP facet F12
- Files: src/modules/log-alerts/client-report.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClientErrorReportController.java:35-37 8 accepted error types
- Expected fix: Define mapping for each eight failure types and sampling/retention.
