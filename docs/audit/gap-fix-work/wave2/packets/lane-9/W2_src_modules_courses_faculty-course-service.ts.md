# Work packet (wave 2): edit src/modules/courses/faculty-course-service.ts

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l19-u019-faculty-teaching-assignment.md, docs/audit/gap2/lane-18/u001-faculty-course-tab.md

## G2-19-019-049  [P2] GAP  facet F20  effort M
- Legacy: FacultyTeachingAssignment.java:49-53 java.sql.Date start/end
- vNext now: src/db/schema/courses.ts:243-250 timestamptz startedAt/endedAt and faculty-course-service.ts:180-198 active gating
- Fix: Validate Asia/Kolkata date-only mapping, midnight and date range inclusivity, avoid treating date as instant incorrectly

## G2-18-001-016  [P2] GAP  facet F03  effort S
- Legacy: Legacy Next action CTA is a single primary Button with icon, disabled when course context absent. `docs/legacy-source/frontend/src/pages/Dashboard/course/Home/Home.js:369-396`
- vNext now: vNext Next action is styled Link, enabled only when server-resolved authorized delivery renders. `src/components/courses/faculty-course-home-signals.tsx:47-89`, `src/modules/courses/faculty-course-service.ts:204-241`
- Fix: Match button icon, caption, sizing, pending/disabled treatment; keep server auth guard.

## G2-18-001-022  [P2] GAP  facet F04  effort S
- Legacy: Legacy class selector entries are `className` or `Class <id>`, numerically sorted class IDs. `docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:27-46`
- vNext now: vNext label combines sectionName plus academicPeriodName; sorted by period desc, course asc, section asc. `src/app/(authenticated)/teacher/courses/[deliveryId]/layout.tsx:20-25`, `src/modules/courses/faculty-course-service.ts:197-201`
- Fix: Offer legacy concise class labels where mapping exists; match deterministic class sort per course.

## G2-18-001-055  [P2] GAP  facet F10  effort M
- Legacy: Legacy faculty lesson-content create POST `/api/v1/faculty/lesson-contents/create` with lesson/class IDs and active teaching assignment. `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/FacultyLessonContentController.java:31-97`
- vNext now: vNext authoring uses delivery-specific `FacultyLessonAuthoring` and centralized workspace ownership. `src/components/courses/faculty-course-workspace.tsx:632-643`, `src/modules/courses/faculty-course-service.ts:204-247`
- Fix: Check payload/state transition parity on every type in dedicated content audit; map old lesson IDs securely.

## G2-18-001-098  [P2] GAP  facet F21  effort M
- Legacy: Legacy assignment/class/course endpoints use Spring services; frontend polls teaching authorization. `docs/legacy-source/frontend/src/api/Services/FacultyAssignmentService.js:30-33`, `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:137-203`
- vNext now: vNext reads PostgreSQL via Drizzle on server and refreshes route state. `src/modules/courses/faculty-course-service.ts:60-202`, `src/components/courses/faculty-course-tab-navigation.tsx:29-42`
- Fix: Record integration switch explicitly; provide compatibility only for old deep links and downstream callbacks.

## G2-18-001-101  [P2] GAP  facet F22  effort L
- Legacy: Legacy faculty_teaching_assignment keys numeric faculty_id/course_id/class_id; is_active flag, semester/year, role, dates. `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/FacultyTeachingAssignment.java:18-52`
- vNext now: vNext course_teaching_assignments keys UUID membership_id+delivery_id, uses started_at/ended_at and joins cohort/academic period. `src/db/schema/courses.ts:228-283`, `src/modules/courses/faculty-course-service.ts:103-201`
- Fix: Document migration equivalence and old link mapping; retain active scope/tenant rules and role semantics.

## G2-18-001-109  [P2] GAP  facet F23  effort M
- Legacy: Legacy course identifier is public slug with numeric fallback; vNext intentionally moved to delivery UUID and no migration required per owner. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:89-115`
- vNext now: vNext delivery UUID is canonical for all course routes. `src/modules/courses/faculty-course-navigation.ts:16-18`, `src/modules/courses/faculty-course-service.ts:204-211`
- Fix: Keep vNext data model; only introduce bounded authorized redirect shim for any preserved legacy bookmarks.

## G2-18-001-021  [P3] GAP  facet F04  effort S
- Legacy: Course selected name falls back `course_name`, `courseName`, `name`, then `Unnamed Course`. `docs/legacy-source/frontend/src/pages/teacher/courses/[courseId]/[...courseTab].js:117-125`
- vNext now: vNext courseName is DB `courses.name` from active assignment join. `src/modules/courses/faculty-course-service.ts:76-86`
- Fix: Use `Unnamed Course` fallback only for nullable or corrupt migrated records; preserve intended display name.
