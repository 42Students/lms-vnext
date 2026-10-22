# Legacy course and lesson link policy

The legacy frontend routed course pages by old `courseSlug` and sometimes
numeric course/lesson/class IDs. The native vNext learner and faculty
workspaces intentionally use an authorized **course offering, section
delivery, learning path and lesson UUID**. The old route strings are not
supported API aliases and must not be interpreted as UUIDs.

## Supported migration resolution

- Old numeric **course** IDs are import provenance on
  `courses.legacy_course_id`. A college-scoped authorized report may resolve
  them via `resolveLegacyCourseProgressScope` in
  `src/modules/courses/super-admin-student-course-progress.ts`. A missing
  mapping or ambiguous active offering yields no redirect rather than the
  first database match.
- A public catalogue slug can identify a course only after joining its
  department's authorized college, actual offering and current delivery.
  Slug equality alone does not give a learner access.
- Numeric **lesson** IDs have no authoritative mapping in
  `course_lessons`. Existing links must be replaced with UUID-based
  destinations from an authenticated curriculum read. Do **not** redirect
  by matching lesson name or sequence, which need not be unique over
  time/campus. Until a versioned, tenant-scoped old lesson ID ledger is
  imported and reconciled, reject an unresolved legacy lesson link.
- Old `classId=0` in a lesson-content create means course-wide content,
  represented by `delivery_id IS NULL`. A positive old class ID must map to
  an actual authorized `course_section_deliveries` row for the same offering;
  it is not accepted as a freeform UUID.

## Legacy combined lesson create

`createCourseLesson` accepts the old optional `contentsDTOs` alongside
the canonical lesson fields. The service validates each child and inserts
all children, the parent lesson, and the event into **one database
transaction**. A missing content field, conflicting course/class
association, invalid video URL, or nested ID that names another lesson
causes rollback. There is no orphan parent on a failed combined create.

The separate `createLessonContent` API is the preferred editable workflow
for new authors; its own classroom/delivery permission and ancestor locks
are mandatory. This separation is intentional and does not silently copy
a legacy class-specific media file to every college learner.
