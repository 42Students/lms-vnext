# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-15-009-047 [P1] GAP facet F10
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: POST /api/v1/faculty/schedules faculty_id,class_id,start_time,end_time,courseSlug/Id (`docs/legacy-source/frontend/src/api/Services/attendanceServices.js:69-74`)
- Expected fix: Map route/payload and datetime offsets safely

## G2-15-009-049 [P1] GAP facet F10
- Files: src/modules/attendance/faculty-service.ts
- Legacy: class_schedule inserted with numeric faculty,class,course,lecture hall links (`docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/ClassScheduleServiceImpl.java:372-379`)
- Expected fix: Crosswalk assignments and preserve conflicts/session ownership

## G2-15-009-051 [P1] GAP facet F11
- Files: src/modules/attendance/faculty-service.ts
- Legacy: Admin and superadmin exempt from teaching assignment checks (`docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:180-205`)
- Expected fix: Verify admin-equivalent marking/correction flow covers original admin exception

## G2-15-009-054 [P1] GAP facet F12
- Files: src/modules/attendance/faculty-service.ts
- Legacy: Front DatePicker explicitly permits past dates (`docs/legacy-source/frontend/src/components/Global/Offcanvas/Attendance/SheduleClassDrawer.js:126-129`)
- Expected fix: Resolve legacy frontend/backend contradiction; explain past booking constraint

## G2-15-009-061 [P1] GAP facet F13
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Schedule unavailable error warning + Retry, separate from no classes (`docs/legacy-source/frontend/src/components/Attendance/TakeAttendanceHeaderFilters/TakeAttendanceHeaderFilters.js:102-138`)
- Expected fix: Distinguish schedule failure from confirmed empty and add retry

## G2-15-009-080 [P1] GAP facet F20
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Failed rows retried only, accepted reloaded; total failure retains draft (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:517-548`)
- Expected fix: Provide reliable all-or-none retry semantics with network uncertainty handling

## G2-15-009-085 [P1] GAP facet F22
- Files: src/modules/attendance/faculty-service.ts
- Legacy: class_schedule numeric IDs, string timestamps, nullable markedAt (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassSchedule.java:15-35`)
- Expected fix: Write historical ID/timezone/status backfill mapping

## G2-15-009-092 [P1] GAP facet F23
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Old unconditionally Ready to mark (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:294-305`)
- Expected fix: Obtain owner policy decision on timed access and document intentional difference

## G2-15-001-018 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: Section grouping key uses `class_id` else batch/year/section fallback (courseListingUtils.js:33-36).
- Expected fix: Map legacy mixed section references to scoped IDs and show fallback grouping for incomplete records.

## G2-15-004-069 [P1] GAP facet F23
- Files: src/app/(authenticated)/learn/projects/page.tsx
- Legacy: Legacy scoped GET paging and recoverable stale-refresh/error UX (ProjectsContent.jsx:195-255)
- Expected fix: Add SQL pagination and recoverable loading/error boundary, enforce role-scope on stale requests

## G2-15-006-067 [P1] GAP facet F22
- Files: src/app/(authenticated)/learn/courses/page.tsx
- Legacy: Legacy learner IDs numeric course/class/semester and course visibility active/enabled/published/locked (courseListingUtils.js:75-123)
- Expected fix: Create documented mapping for class/semester, elective slot, lock state, old route references and course alias

## G2-16-001-026 [P1] GAP facet F07
- Files: (none, new feature)
- Legacy: `audit-findings.js:60-63`: API failure alert shows server message or `Couldn't load findings.`.
- Expected fix: Catch listing failures and display inline `Couldn't load findings.` alert with retry.

## G2-16-005-045 [P1] GAP facet F11
- Files: src/app/(authenticated)/tracker/logs/page.tsx
- Legacy: `logs.js:770-815`: logs gate permits logs-session hint/password under strict API auth; token refresh on mount.
- Expected fix: Document access policy; protect all Cloud Logging routes and potential password-only path.

## G2-16-027-007 [P1] GAP facet F05
- Files: src/modules/attendance/faculty-schedule-mutation-service.ts
- Legacy: ClassScheduleServiceImpl.java:335-370 checks faculty/class/hall overlap.
- Expected fix: Add lecture-hall conflict and global hall lock.

## G2-16-027-010 [P1] GAP facet F06
- Files: src/modules/attendance/faculty-schedule-mutation-service.ts
- Legacy: ClassScheduleServiceImpl.java:57-82 booking grace default5 minutes configurable.
- Expected fix: Reject past starts beyond 5-minute configurable grace.

## G2-16-027-025 [P1] GAP facet F12
- Files: src/modules/attendance/faculty-schedule-mutation-service.ts
- Legacy: ClassScheduleServiceImpl.java:309-314 past booking 5-minute grace.
- Expected fix: Enforce configurable near-now cutoff.

## G2-16-027-027 [P1] GAP facet F12
- Files: src/modules/attendance/faculty-schedule-mutation-service.ts
- Legacy: ClassScheduleServiceImpl.java:335-370 hall/class/faculty conflicts.
- Expected fix: Add hall availability preflight and transaction lock.

## G2-16-027-031 [P1] MISSING facet F15
- Files: src/modules/attendance/faculty-schedule-mutation-service.ts
- Legacy: ClassScheduleServiceImpl.java:381-418 sends class-targeted notice titled supplied title or `New class scheduled`, body `A class has been scheduled for EEE, d MMM at h:mm a.`, best-effort; failures logged only.
- Expected fix: Emit college/section-scoped learner notice after commit with identical title, time rendering, and failure isolation.

## G2-16-027-036 [P1] GAP facet F20
- Files: src/modules/attendance/faculty-schedule-mutation-service.ts
- Legacy: ClassScheduleServiceImpl.java:335-346 locks hall,faculty,class during creation.
- Expected fix: Serialize across halls shared by sections.

## G2-17-006-030 [P1] GAP facet F11
- Files: src/app/(authenticated)/learn/courses/[deliveryId]/[...courseTab]/page.tsx
- Legacy: docs/legacy-source/frontend/src/pages/learn/courses/[courseId]/[...courseTab].js:66-70 hides items with explicit inactive/unpublished and actionable=false locked state from docs/legacy-source/frontend/src/utils/courseUtils/contentAvailability.js:47-84.
- Expected fix: Compare denied/locked course visibility and allow read-only history only as intentional policy.

## G2-17-010-005 [P1] MISSING facet F02
- Files: src/modules/announcements/tpo-notice-delivery-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:48-49 — Shortlist due tomorrow daily 08:00 IST.
- Expected fix: Create next-day shortlist notices with dedupe.

## G2-17-010-010 [P1] MISSING facet F02
- Files: src/modules/announcements/tpo-notice-delivery-service.ts
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/TpoScheduledJobs.java:64-66 — Interview morning 08:00 IST only in app.
- Expected fix: Add morning interview-only in-app job.

## G2-18-009-002 [P1] GAP facet F01
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Legacy teacher multi-class selector updates Redux classId/name then shallow-updates course URL `?cls=` (`AttendanceReport.js:30-42`).
- Expected fix: Offer assigned-section switch/URL deep link with unsaved-draft guard.

## G2-18-009-014 [P1] GAP facet F03
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Legacy Mark panel status pill `Ready to mark` and Schedule Class action (`TakeAttendance.js:279-307`).
- Expected fix: Restore status-pill placement; preserve mandatory current marking lock with clear explanation.

## G2-18-009-019 [P1] GAP facet F04
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Legacy one grid cell per student per day including no class X (`TeacherAttendanceView.jsx:327-419`).
- Expected fix: Restore full calendar day grid including no-class and upcoming cells.

## Chat-18 fast verification triage (2026-10-22)

- G2-15-009-047: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-15-009-049: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-15-009-051: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-15-009-054: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-15-009-061: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-15-009-080: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-15-009-085: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-15-009-092: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-15-001-018: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-15-004-069: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-15-006-067: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-16-001-026: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-16-005-045: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-16-027-007: OK — Schedule writer has configurable grace, tenant transaction advisory lock, hall row locking, and overlap predicates.
- G2-16-027-010: OK — Schedule writer has configurable grace, tenant transaction advisory lock, hall row locking, and overlap predicates.
- G2-16-027-025: OK — Schedule writer has configurable grace, tenant transaction advisory lock, hall row locking, and overlap predicates.
- G2-16-027-027: OK — Schedule writer has configurable grace, tenant transaction advisory lock, hall row locking, and overlap predicates.
- G2-16-027-031: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-16-027-036: OK — Schedule writer has configurable grace, tenant transaction advisory lock, hall row locking, and overlap predicates.
- G2-17-006-030: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-17-010-005: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-17-010-010: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-18-009-002: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-18-009-014: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
- G2-18-009-019: DEFERRED — requires deeper caller, permission, migration or runtime evidence; not certified as parity.
