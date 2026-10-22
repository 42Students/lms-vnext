# Verification packet (P1 round 2): 25 rows

For EACH row: open the vNext file(s) it cites, check that the Fix is really implemented (wording, validation, behaviour, permissions, empty/error states, wiring). If it is missing, partial or wrong, FIX it now in the file (keep valid syntax, no uninstalled packages). In your commit message list the row IDs as OK or FIXED. Rows without a vNext file describe a new feature: search the repo for it; if it does not exist, build it.

## G2-13-017-037 [P1] GAP facet F11
- Files: src/modules/projects/mentor-task-delete-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:23` deletedByWorkspace bool distinguishes deletion source
- Expected fix: Record deletion-source category and template-suppression provenance in durable data

## G2-13-017-038 [P1] GAP facet F12
- Files: src/modules/projects/mentor-task-delete-service.ts, src/db/schema/projects.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:23-24` deletedByWorkspace false and BaseModel isDeleted false are distinct flags
- Expected fix: Preserve distinction between soft-delete and workspace suppression in parity data model

## G2-13-017-057 [P1] GAP facet F22
- Files: src/db/schema/projects.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:20-112` 20+ source fields incl deletion flags, due/sprint labels, assignee snapshot, actor metadata, submittedBy/At
- Expected fix: Build complete column-by-column migration matrix and preserve user-visible snapshots/audit attributes

## G2-13-017-061 [P1] GAP facet F23
- Files: src/db/schema/projects.ts, src/modules/projects/mentor-task-delete-service.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectTask.java:23-24` deletedByWorkspace and `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:36-37` isDeleted flags
- Expected fix: Close template resurrection/suppression parity before shipping workspace task deletion

## G2-13-002-002 [P1] GAP facet F01
- Files: src/app/(authenticated)/hr/home/page.tsx
- Legacy: Recruiter works at one college placement address per session (`docs/legacy-source/frontend/src/pages/recruiter/home.js:14-18`)
- Expected fix: Decide tenant-domain vs multi-grant access contract and test all redirects.

## G2-13-016-019 [P1] GAP facet F10
- Files: src/modules/identity/context-service.ts, src/db/schema/memberships.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/User.java:41-48` eager load USER_ROLES joins Role globally
- Expected fix: Load roles per chosen active membership and system role separately, with no tenant bleed across switch

## G2-13-016-025 [P1] GAP facet F12
- Files: src/modules/identity/constants.ts
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Role.java:12-15` seed roles lowercase admin,user as comments
- Expected fix: Write explicit admin/user fallback mapping and reject UNKNOWN roles instead of silently assigning LEARNER

## G2-13-016-040 [P1] GAP facet F20
- Files: src/modules/identity/context-service.ts
- Legacy: `docs/legacy-source/frontend/src/config/roles.js:56-68` legacy role inference uses userType/facultyType even absent User.roles
- Expected fix: Audit source of truth: legacy stored roles alone may under-represent active account persona

## G2-18-018-005 [P1] GAP facet F03
- Files: src/db/schema/courses.ts
- Legacy: `active`, `enabled` distinct booleans (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:20-23`).
- Expected fix: Decide and document mapping for all four old flag combinations; add independent flags if still needed for legacy semantics.

## G2-18-018-007 [P1] GAP facet F04
- Files: src/db/schema/courses.ts
- Legacy: `courseId` primitive int and optional transient courseSlug (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:18-19,26-28`).
- Expected fix: Document course→offering→learning-path mapping for section/semester contexts; never join numeric legacy id directly to UUID.

## G2-18-018-008 [P1] GAP facet F04
- Files: src/db/schema/courses.ts, src/modules/courses/validation.ts
- Legacy: `sequence` Java long (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:24-25`), legacy may autoallocate from max+1 (`LessonServiceImpl.java:133-142`).
- Expected fix: Specify range shrink and migration/large imported sequence policy; auto-select first free ordinal rather than exposing required number in UI if old create auto-appended.

## G2-18-018-015 [P1] GAP facet F06
- Files: src/db/schema/courses.ts, src/modules/courses/lesson-service.ts
- Legacy: Legacy defaults `active=true`, `enabled=true`; sequence <=0 becomes `max+1` (`LessonServiceImpl.java:133-145`).
- Expected fix: Retain distinct defaults and append ordering; cover omitted and zero sequence in UI API boundary.

## G2-18-018-034 [P1] GAP facet F12
- Files: src/db/schema/courses.ts
- Legacy: Legacy active/enabled independent flags, deleted separate (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:20-37`; BaseModel.java:36-37).
- Expected fix: Create explicit truth table for legacy active/enabled/deleted vs vNext status/visibility, including learner-facing filtering.

## G2-18-018-045 [P1] GAP facet F20
- Files: src/db/schema/courses.ts, src/modules/courses/lesson-service.ts, src/modules/courses/college-lesson-visibility-service.ts
- Legacy: Legacy JPA @Version Long optimistic lock version nullable on new entity; documented merge/persist hazard (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:30-41`).
- Expected fix: Add expectedUpdatedAt/version to edit DTO and conditional update in same transaction, like visibility writer `college-lesson-visibility-service.ts:57-69`; report stale conflict.

## G2-18-018-049 [P1] GAP facet F22
- Files: src/db/schema/courses.ts
- Legacy: Physical `lesson` table: integer PK, `lesson_name`, int `course_id`, boolean `active`,`enabled`,`is_deleted`, bigint `sequence`, bigint `version`, DATETIME timestamps (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:16-41`; docs/legacy-source/backend/src/main/java/com/_42students/lms/model/BaseModel.java:22-37).
- Expected fix: Document per-column mapping or explicit intentional incompatible redesign; resolve independent booleans and version before parity acceptance.

## G2-18-021-011 [P1] GAP facet F05
- Files: (none, new feature)
- Legacy: Old source job importantDates array can include multiple events per job (JobServiceImpl:1546-1573)
- Expected fix: Support stable per-item IDs including index/typed key so multiple dates do not collapse

## G2-19-026-034 [P1] GAP facet F15
- Files: (none, new feature)
- Legacy: Old bulk partitions audit per college, rolls back writes if audit fails (service:699-711)
- Expected fix: Make audit failure semantics explicit; close compliance gap with transactional/batch journal

## G2-14-001-041 [P1] GAP facet F10
- Files: src/components/tpo/tpo-bulk-action-panel.tsx, src/app/(authenticated)/tpo/students/page.tsx
- Legacy: Legacy Actions window covers drive overrides, message, After college, debar/lift, verify/sendback, prep and note; vNext general picker narrower and split controls — `docs/legacy-source/frontend/src/components/tpo/students/StudentActions.jsx:62-83,94-107,302-356`
- Expected fix: Unify all 11 with precise per-action skip and undo semantics

## G2-14-009-080 [P1] GAP facet F22
- Files: src/db/schema/attendance.ts
- Legacy: Legacy attend unique student_id plus class_schedule_id, has reason and marked_by `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Attend.java:10-42`
- Expected fix: Map legacy reason/status/provenance fully

## G2-14-009-082 [P1] GAP facet F22
- Files: src/db/schema/attendance.ts, drizzle/0033_attendance_foundation.sql
- Legacy: No correction policy DB table in legacy report `docs/legacy-source/frontend/src/pages/Dashboard/course/Attendance/TeacherAttendanceView.jsx:143-173`
- Expected fix: Reconcile DDL and schema upper bound

## G2-14-013-066 [P1] GAP facet F22
- Files: src/db/schema/lecture-halls.ts
- Legacy: Legacy lecture_hall has integer college/dept, name,capacity,description,roomType `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:10-27`
- Expected fix: Map integer IDs and roomType enum to UUID and varchar enum

## G2-14-013-068 [P1] GAP facet F22
- Files: src/db/schema/lecture-halls.ts, src/modules/academics/lecture-hall-service.ts
- Legacy: Legacy description can be null and JPA unbounded string declaration `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/LectureHall.java:24-27`
- Expected fix: Plan truncation or explicit reject with preserved long descriptions

## G2-14-014-010 [P1] GAP facet F04
- Files: src/db/schema/db10-announcements.ts
- Legacy: Legacy receiverType enum receiverValue Long `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:23-28`
- Expected fix: Build historical receiver ID crosswalk for all six types

## G2-14-014-060 [P1] GAP facet F22
- Files: src/db/schema/db10-announcements.ts
- Legacy: Legacy announcements table identity Long and receiverValue Long `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:14-28`
- Expected fix: Create per-receiver-type integer to UUID migration map

## G2-14-014-061 [P1] GAP facet F22
- Files: src/db/schema/db10-announcements.ts
- Legacy: Legacy sender string + numeric id, isDeleted, schedules/expiry/pin `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Announcement.java:36-68`
- Expected fix: Map legacy deletion and sender provenance without loss

## Lane-12 fast verification triage (2026-10-22)

No row can be certified OK from the shallow file inspection alone.

DEFERRED — not verified or fixed; needs deeper implementation, policy, API or migration review: G2-13-017-037, G2-13-017-038, G2-13-017-057, G2-13-017-061, G2-13-002-002, G2-13-016-019, G2-13-016-025, G2-13-016-040, G2-18-018-005, G2-18-018-007, G2-18-018-008, G2-18-018-015, G2-18-018-034, G2-18-018-045, G2-18-018-049, G2-18-021-011, G2-19-026-034, G2-14-001-041, G2-14-009-080, G2-14-009-082, G2-14-013-066, G2-14-013-068, G2-14-014-010, G2-14-014-060, G2-14-014-061.
Triage is complete, parity verification is not. Do not interpret deferred rows as completed fixes.
