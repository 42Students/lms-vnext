# Work packet (wave 2): edit src/modules/attendance/learner-service.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/course-attendance.md, docs/audit/gap2/lane-18/course-attendance-report.md, docs/audit/gap2/lane-19/learner-attendance.md, docs/audit/gap2/lane-5/u027-learner-controller.md

## G2-13-009-078  [P2] GAP  facet F22  effort M
- Legacy: Legacy threshold in API attendanceThresholdPercent (`docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/StudentAttendanceView.jsx:85-91`)
- vNext now: New college attendancePolicies row eligibilityThresholdPercent (`src/modules/attendance/learner-service.ts:101-115`)
- Fix: Backfill per-college threshold, default 75 only when absent.

## G2-18-009-052  [P2] GAP  facet F10  effort M
- Legacy: Legacy learner GET attendance list by date range and learnerId plus slug or courseId (`StudentAttendanceView.jsx:19-51`; `attendanceServices.js:76-81`).
- vNext now: New server Drizzle query by authorized delivery membership and half-open month window (`learner-service.ts:59-99,135-245`).
- Fix: Document legacy GET→new query field mapping and preserve partial failure semantics.

## G2-18-009-065  [P2] GAP  facet F12  effort M
- Legacy: Legacy learner headroom `canMiss=floor(present/t-held)`, `mustAttend=ceil((t*held-present)/(1-t))`, threshold fallback75 (`attendanceConstants.js:49-61`; `StudentAttendanceView.jsx:85-109`).
- vNext now: New recovery projection and College attendancePolicy threshold (`learner-attendance-workspace.tsx:217-218,435-443`; `learner-service.ts:39-43,101-115`).
- Fix: Compare both formulas including 100% and floating boundary, reuse exact user-facing guidance.

## G2-18-009-089  [P2] GAP  facet F19  effort M
- Legacy: Legacy learner API reads month one course; no large all-delivery transfer (`StudentAttendanceView.jsx:19-51`).
- vNext now: New server loads all authorized deliveries' rows within month (`learner-service.ts:92-99,128-135,234-245`).
- Fix: Filter at DB by chosen delivery when possible, enforce bounded query for scale.

## G2-18-009-098  [P2] GAP  facet F22  effort M
- Legacy: Legacy learner threshold via response attendanceThresholdPercent or fallback 75 (`StudentAttendanceView.jsx:85-92`; `attendanceConstants.js:5-10`).
- vNext now: New attendance_policies per College threshold 1..100, fallback75, window24h (`attendance.ts:17-60`; `learner-service.ts:39-43,101-115`).
- Fix: Migrate college threshold overrides and validate exposure per tenant.

## G2-19-006-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy faculty accessing route redirected to role-specific faculty courses `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:88-92` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:337`
- vNext now: vNext requires active learner membership and rejects otherwise `src/modules/attendance/learner-service.ts:44-74`
- Fix: Preserve legacy faculty-to-courses redirect only when role routing policy permits.

## G2-19-006-020  [P2] GAP  facet F05  effort M
- Legacy: Legacy course selected by numeric courseId `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:102-105` `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:160-163`
- vNext now: vNext option by UUID deliveryId not courseId, supports same course multiple sections `src/components/attendance/learner-attendance-workspace.tsx:178-197` `src/modules/attendance/learner-service.ts:260-269`
- Fix: Map legacy course selector and subsection disambiguation with stable labels.

## G2-19-006-038  [P2] GAP  facet F10  effort M
- Legacy: Legacy GET courses via getLearnerAttendanceCoursesUrl `docs/legacy-source/frontend/src/api/Services/attendanceServices.js:84-90`
- vNext now: vNext server listLearnerCourseDeliveries + authorization `src/modules/attendance/learner-service.ts:59-100`
- Fix: Document courseId vs deliveryId mapping and historical selection.

## G2-19-006-068  [P2] GAP  facet F19  effort M
- Legacy: Legacy loads one month of selected course only `docs/legacy-source/frontend/src/components/Attendance/AttendanceContent.jsx:146-177`
- vNext now: vNext workspace initially queries all authorized deliveries for month then client filters by delivery `src/app/(authenticated)/learn/attendance/page.tsx:21-25` `src/modules/attendance/learner-service.ts:128-245`
- Fix: Benchmark many deliveries and only request selected-month course where appropriate.

## G2-19-006-075  [P2] GAP  facet F21  effort M
- Legacy: Legacy statuses share attendanceConstants with teacher attendance `docs/legacy-source/frontend/src/utils/attendanceConstants.js:18-46`
- vNext now: vNext typed learnerAttendanceStatus and explicit threshold policy `src/modules/attendance/learner-service.ts:247-299` `src/components/attendance/learner-attendance-workspace.tsx:89-113`
- Fix: Reconcile marked vs unmarked/current class attendance statuses across faculty/learner.

## G2-5-027-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy learner REST controller covers attendance, course stats, personal program summary. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:71-75,151-330`
- vNext now: vNext decomposes into learner attendance/workspace services and delivery-based course pages. `src/modules/attendance/learner-service.ts:59-101`, `src/modules/courses/learner-course-drilldown-service.ts:59-65`
- Fix: Document endpoint-to-workspace route mapping, preserving learner deep links.

## G2-5-027-005  [P2] GAP  facet F01  effort M
- Legacy: Legacy mark/unmark absence and overall/per-course percentage in learner controller. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:801-1003`
- vNext now: vNext separates attendance workspaces, sessions and aggregate summaries. `src/modules/attendance/learner-service.ts:59-125`, `src/components/attendance/learner-attendance-workspace.tsx:34-63`
- Fix: Document faculty attendance writer and per-course percent replacement.

## G2-5-027-010  [P2] GAP  facet F03  effort M
- Legacy: Legacy attendance course options contain course/class IDs; guarded by canAccessCourse. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:151-234`
- vNext now: vNext displays deliveryId plus courseId/name/code/section/period; old integer course option shape is absent. `src/modules/attendance/learner-service.ts:92-100`, `src/components/attendance/learner-attendance-workspace.tsx:34-41`
- Fix: Show course label and optional class code, map to authorized delivery.

## G2-5-027-017  [P2] GAP  facet F04  effort M
- Legacy: Legacy overall and per-course attendance endpoints return primitive Double. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:923-1003`
- vNext now: vNext returns overall/summaries rich objects, with multiple attendance states. `src/modules/attendance/learner-service.ts:117-125`
- Fix: Map denominator/percentage rounding and treatment of EXCUSED/LATE/MEDICAL.

## G2-5-027-051  [P2] GAP  facet F11  effort M
- Legacy: Legacy attendance percent scoped to learner self or admin/assigned faculty. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:923-1003`
- vNext now: vNext learner attendance read is learner-only; admin/faculty views independent. `src/modules/attendance/learner-service.ts:44-99`
- Fix: Map admin/faculty percent endpoint to their scoped views.

## G2-5-027-056  [P2] GAP  facet F13  effort M
- Legacy: Legacy learner attendance service failure explicit 503 `Learner service unavailable`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:151-168`
- vNext now: vNext server-rendered auth/read errors propagate to route boundary. `src/modules/attendance/learner-service.ts:68-99`
- Fix: Provide scoped retry without leaking personal data.

## G2-5-027-065  [P2] GAP  facet F15  effort M
- Legacy: Legacy attendance mark/unmark logs attendance audit, no email. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LearnerController.java:801-896`
- vNext now: vNext learner-facing attendance read does not trigger notices. `src/modules/attendance/learner-service.ts:59-125`
- Fix: Check attendance writer audit and learner absence notifications.
