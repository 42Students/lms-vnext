# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-11-002-058 [P1] MISSING facet F10
- Files: src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx
- Legacy: POST ZIP resumes endpoint `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/RecruiterDriveController.java:131`
- Expected fix: Restore secure ZIP

## G2-11-009-038 [P1] MISSING facet F08
- Files: src/app/(authenticated)/tpo/drive-day/page.tsx
- Legacy: Refresh failure says This refresh failed. Showing the last successful assignments. `docs/legacy-source/frontend/src/pages/tpo/drive-day/index.js:54`
- Expected fix: Preserve stale cards and exact error text.

## G2-11-011-116 [P1] GAP facet F23
- Files: src/app/(authenticated)/tpo/placements/jobs/[jobId]/edit/page.tsx
- Legacy: Legacy same editor serves create/edit, with rich company/pay/policy/rounds. `docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js:41`
- Expected fix: Unify vNext create/edit field coverage; preserve permission differences.

## G2-13-009-019 [P1] GAP facet F04
- Files: src/modules/attendance/learner-service.ts
- Legacy: Legacy student status per session from learnerSessionStatus (includes not held/not marked) (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:154-173`)
- Expected fix: Crosswalk future/held/marked/unmarked/late statuses to legacy label and color.

## G2-13-009-051 [P1] GAP facet F12
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Legacy marked correction can take absence/presence status after initial mark (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TakeAttendance.js:11-15`)
- Expected fix: Verify legacy correction window/permissions, mark explanatory change deliberate.

## G2-13-009-076 [P1] GAP facet F22
- Files: src/modules/attendance/learner-service.ts
- Legacy: Old classSchedule.id, absent ids, attendanceMarked per held class (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:142-155`)
- Expected fix: Crosswalk absent rows and marked session sentinel/late status in DB migrations.

## G2-13-009-077 [P1] GAP facet F22
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Old monthly teacher cohort uses teacher class/course filter, student ids (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:43-66`)
- Expected fix: Map classId/studentId/courseId to member and delivery IDs; audit historical enrollment.

## G2-13-014-002 [P1] MISSING facet F01
- Files: src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/applications/JobApplicationSearchController.java:57-80` GET /api/v2/job-applications/search (query/limit/organizationId)
- Expected fix: Trace all old `/api/v2/job-applications/search` consumers; add compatible scoped API or approved replacement

## G2-17-23-062 [P1] GAP facet F12 Dream/uplift
- Files: (none, new feature)
- Legacy: TS:21–32 documents original broad-withdraw gap; JS:1371–1373 now keeps policy-allowed non-OFFERED siblings
- Expected fix: Create explicit old/new decision matrix for Dream, internship, LOI, placement category and uplift; avoid accidental blanket withdrawal

## G2-18-019-002 [P1] GAP facet F01 Scope
- Files: (none, new feature)
- Legacy: LV:10-16 entity targets faculty only; LS:109-122 looks up Faculty by phone
- Expected fix: Validate faculty membership/tenant before session and correct faculty redirect; never allow membership confusion

## G2-18-026-024 [P1] GAP facet F10 Update/delete audit
- Files: (none, new feature)
- Legacy: NPC:175-176 PROGRAM_UPDATE and 205-206 PROGRAM_DELETE; optional audit dependency
- Expected fix: Ensure old audit consumer maps archived vs deleted and retains college/actor/payload and outcome semantics

## G2-19-029-020 [P1] GAP facet F04 Legacy domain codes
- Files: (none, new feature)
- Legacy: LG:22-59 maps NO_DOMAIN/NO_PRIMARY_DOMAIN/MULTIPLE_PRIMARY_DOMAINS/NO_VERIFIED_PRIMARY_DOMAIN/PRIMARY_DOMAIN_NOT_VERIFIED/NO_VERIFIED_DOMAIN
- Expected fix: Preserve all distinct domain diagnostics (none, no primary, multiple primary, verification policy) in a detailed domain-check adapter

## G2-13-001-044 [P1] GAP facet F10
- Files: src/app/(authenticated)/hr/company/page.tsx
- Legacy: Three fetchers each load only their active tab and allow Retry (`docs/legacy-source/frontend/src/pages/recruiter/company.js:35-48`)
- Expected fix: Lazy-load team/counts only on Team tab to avoid avoidable failure/latency.

## G2-18-021-009 [P1] GAP facet F04
- Files: (none, new feature)
- Legacy: Old type from map[`type`] else map[`dateType`] (JobServiceImpl:1562-1567)
- Expected fix: Store type/dateType in legacyPostingDetails metadata or normalized date rows

## G2-19-026-022 [P1] GAP facet F10
- Files: (none, new feature)
- Legacy: Seven endpoints: GET tree, node, learner-overrides, history, explain; PUT node,bulk (controller:38-220)
- Expected fix: Build endpoint parity matrix, trace all writes/reads, ensure full tree not silently omitted

## G2-14-002-040 [P1] GAP facet F07
- Files: src/modules/people/college-student-csv-service.ts
- Legacy: Legacy bulk validates duplicate phone/email/roll in file and DB with specific row issues; vNext validation service has different status contracts — `docs/legacy-source/frontend/src/pages/superadmin/sections/Students.js:759-806`
- Expected fix: Map duplicate classes to exact errors and row numbers

## G2-14-009-019 [P1] GAP facet F05
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Calendar contains every date in selected month even no-class days `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:257-315` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:327-335`
- Expected fix: Generate all 28–31 date columns and show no-class glyph

## G2-14-009-030 [P1] GAP facet F07
- Files: src/app/(authenticated)/teacher/courses/[deliveryId]/attendanceDetail/page.tsx, src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Fetch failure says Couldn't load attendance data for this month. and offers Retry `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:122-128`
- Expected fix: Catch server fetch failure and show exact Retry state

## G2-14-009-044 [P1] GAP facet F10
- Files: src/modules/attendance/faculty-service.ts
- Legacy: Bulk backend commits independently per learner and reports partial failures `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:39-42` `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AttendanceBulkController.java:123-145`
- Expected fix: Keep safer atomic design but make outcome contract explicit

## G2-14-009-046 [P1] GAP facet F11
- Files: src/modules/attendance/faculty-service.ts
- Legacy: Faculty and admins share attendance report and mark tabs `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:14-19` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/AttendanceReport.js:75-98`
- Expected fix: Provide equivalent admin route and permissions matrix

## G2-14-009-047 [P1] GAP facet F11
- Files: src/modules/attendance/faculty-service.ts
- Legacy: Whole-class legacy GET enforces class and faculty scope, SA exempt `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/ClassScheduleController.java:437-469`
- Expected fix: Crosswalk faculty college-admin and SA authorization

## G2-14-009-055 [P1] GAP facet F13
- Files: src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Fetch failed distinct from valid empty state `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:37-40` `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:122-141`
- Expected fix: Add retryable error boundary

## G2-14-009-057 [P1] GAP facet F14
- Files: src/components/attendance/faculty-attendance-workspace.tsx, src/components/courses/faculty-report-download.tsx
- Legacy: PDF has portrait per-student summary and landscape day-by-day matrix `docs/legacy-source/frontend/src/utils/downloadMonthlyAttendancePdf.js:25-31` `docs/legacy-source/frontend/src/utils/downloadMonthlyAttendancePdf.js:75-138`
- Expected fix: Restore two-part PDF with color-coded daily matrix

## G2-14-009-071 [P1] GAP facet F19
- Files: src/modules/attendance/faculty-service.ts, src/components/attendance/faculty-attendance-workspace.tsx
- Legacy: Legacy fetch is month-scoped and refetches when month changes `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:42-99`
- Expected fix: Add date-scoped DB read for long histories

## G2-14-009-079 [P1] GAP facet F22
- Files: src/modules/attendance/faculty-service.ts, src/db/schema/attendance.ts
- Legacy: Old class_schedule integer IDs and string timestamps plus marked_at `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ClassSchedule.java:10-35`
- Expected fix: Document migration map for class/course/faculty/session
