# Work packet: edit src/db/schema/courses.ts (part 2 of 6)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u001-teacher-courses.md, docs/audit/gap2/lane-15/u003-superadmin-lessons.md, docs/audit/gap2/lane-17/college-admin-lessons.md, docs/audit/gap2/lane-17/teacher-courses-courseid-index.md, docs/audit/gap2/lane-18/college-admin-lesson-content.md, docs/audit/gap2/lane-18/learner-calendar.md

## G2-15-001-063  [P1] GAP  facet F20  effort L
- Legacy: Duplicate/invalid mapping IDs shown as disabled cards and warning (courseListingUtils.js:125-159; CoursesContent.jsx:483-485,549-560).
- vNext now: Orphan/duplicate rows blocked by joins/active unique constraints, not visible as diagnostics (faculty-course-service.ts:128-176; courses.ts:263-275).
- Fix: Surface invalid assignment diagnostics in a stable, non-clickable form rather than silent loss.

## G2-15-003-030  [P1] MISSING  facet F06  effort M
- Legacy: Visible to students switch defaults on; help `Off hides this lesson and its content from students; staff still see it.` (`sections/Lessons.js:56-61,423-425`).
- vNext now: No visibility switch on create; backend default visible true (`super-admin-lesson-create.tsx:42-64`; `courses.ts:332-335`).
- Fix: Add default-on switch with exact help and map active/enabled/visible fields.

## G2-15-003-051  [P1] GAP  facet F10  effort L
- Legacy: Delete `DELETE /api/v1/lesson/delete/{id}` and recoverability via `/deleted`,`/restore/{id}` (`AdminService.js:579-588`; `LessonController.java:573-643`).
- vNext now: DELETE `/api/courses/lessons/{id}` creates ARCHIVED status (`admin-learning-structure-actions.tsx:612-630`; `courses.ts:332-334`).
- Fix: Add archive restore workflow and exact retention semantics; ensure content/work history recoverable.

## G2-15-003-057  [P1] GAP  facet F12  effort L
- Legacy: Legacy lesson active+enabled are separately persisted flags and both gate learner visibility (`sections/Lessons.js:56-61`; `Lesson.java:19-28`).
- vNext now: Lesson status ACTIVE/ARCHIVED plus visibleToStudents Boolean (`courses.ts:320-359`).
- Fix: Specify translation of active/enabled to status+visibility; preserve independent hidden vs archived distinction.

## G2-15-003-058  [P1] GAP  facet F12  effort M
- Legacy: Create legacy defaults active:true enabled:true; visible field allows off at creation (`sections/Lessons.js:423-425,59-60`).
- vNext now: New lesson defaults visible true only; no create switch (`courses.ts:332-335`; `super-admin-lesson-create.tsx:42-64`).
- Fix: Expose off at creation with correct persistent value, do not require post-create hide.

## G2-15-003-084  [P1] GAP  facet F22  effort L
- Legacy: Legacy `lesson` table integer course_id, lesson_name, active, enabled, sequence long, nullable optimistic version (`Lesson.java:13-39`).
- vNext now: `course_lessons` UUID learningPathId, name, description, sequence int, status, visibleToStudents, updatedAt timestamps (`courses.ts:320-345`).
- Fix: Provide mapping of course/lesson ID, version, active/enabled/status and sequence semantics before claiming parity.

## G2-15-003-085  [P1] GAP  facet F22  effort M
- Legacy: Legacy edit/update uses optimistic `@Version Long` (`Lesson.java:32-39`).
- vNext now: No version column, uses updatedAt and reorder expectedSequence from client (`courses.ts:336-345`; `college-lesson-reorder-actions.tsx:25-34`).
- Fix: Verify compare-and-swap token on PATCH/DELETE/reorder, preserve conflict feedback.

## G2-15-003-087  [P1] GAP  facet F22  effort L
- Legacy: Legacy `is_deleted` inherited soft deletion and restore exists (`LessonController.java:573-643`; `Lesson.java:18-28`).
- vNext now: `status=ARCHIVED` excludes default ACTIVE filter; no restore in displayed list actions (`courses.ts:332-335`; `admin/lessons/page.tsx:70-75,102-111`).
- Fix: Expose archived restore workflow with original path/sequence and content retention.

## G2-17-007-052  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:59-60 — Visible if `active !== false && enabled !== false`; switch changes both.
- vNext now: src/db/schema/courses.ts:332-336 — One `visibleToStudents` column plus `ACTIVE/ARCHIVED` lifecycle.
- Fix: Document legacy flag to visibility+status mapping and use it for migration/restore decisions.

## G2-17-007-053  [P1] GAP  facet F12  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:19-39 — Lesson belongs directly to legacy numeric course and has optimistic version.
- vNext now: src/db/schema/courses.ts:320-358 — UUID lesson belongs to learning path with active-name and sequence uniqueness constraints.
- Fix: Map course->offering->path; preserve version-fence semantics and identify duplicate-name/order import policy.

## G2-17-007-080  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:14-39 — Legacy `lesson`: integer course_id, lesson_name, active, enabled, long sequence, version.
- vNext now: src/db/schema/courses.ts:320-358 — vNext `course_lessons`: UUID learning_path_id, name, description, integer sequence, status, visibleToStudents.
- Fix: Provide explicit field/migration mapping (incl version and dual visibility flags).

## G2-17-001-043  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Course.java:17-43 models integer course with unique slug, active/enabled and allowed_for_display; docs/legacy-source/frontend/src/utils/facultyCourseDetail.js:50-60 canonicalizes to course slug.
- vNext now: src/db/schema/courses.ts:34-85 stores UUID courses with name, code, status, no slug; src/db/schema/courses.ts:153-194 uses delivery UUID.
- Fix: Record deliberate UUID delivery identity versus old course slug and decide old-link compatibility; do not try to reuse old integer IDs without mapping.

## G2-18-007-059  [P1] GAP  facet F12  effort M
- Legacy: Old student visibility uses active+enabled, default true (`AdminResources.js:179-200,265-284`).
- vNext now: New separate DRAFT/PUBLISHED/ARCHIVED and visibleToStudents (`courses.ts:400-404`).
- Fix: Define exact legacy-active+enabled to vNext status/visibility mapping.

## G2-18-007-083  [P1] GAP  facet F22  effort L
- Legacy: Old DB LessonContents has int lesson/course/class/faculty refs, content_data JSON, active/enabled, deleted_with_lesson and version (`LessonContents.java:17-75`).
- vNext now: New UUID lesson/delivery, normalized URL/storage/notes/time, status/visibleToStudents (`courses.ts:371-420`).
- Fix: Specify lossless migration of each field, optimistic version, deleted-with-lesson marker and tenant scope.

## G2-18-007-084  [P1] GAP  facet F22  effort L
- Legacy: Old Resource `resource_materials`, html_content and text stored in JSON (`AdminResources.js:265-284`; `LessonContents.java:39-41`).
- vNext now: New notes/externalUrl plus gated material table (`courses.ts:387-391`; `college-content-aggregate-service.ts:160-172`).
- Fix: Migrate JSON material array/HTML, preserve file keys and counts.

## G2-18-007-085  [P1] GAP  facet F22  effort L
- Legacy: Old class-specific ordering managed separately from content sequence (`LessonContent.js:940-965`).
- vNext now: New content sequence global per lesson, no class reorder UI (`college-content-authoring-control.tsx:116-131,251-269`; `courses.ts:400`).
- Fix: Introduce section-specific ordered content mapping and concurrency token.

## G2-18-006-065  [P1] GAP  facet F22  effort L
- Legacy: Old class_schedule stores int class/course/faculty/hall refs, text times, title, attendance_marked_at (`ClassSchedule.java:10-35`).
- vNext now: New UUID section_schedule_events, timestamptz, facultyMembershipId, status, location and separate course link (`academics.ts:450-505`; `courses.ts:202-225`).
- Fix: Write migration crosswalk including hall, attendance marking and timezone.

## G2-18-008-068  [P1] GAP  facet F22  effort L
- Legacy: Old live session timing and link nested in `contentDataDTO.start_time/end_time/link`, int contentId, `active/enabled` (`syllabus/liveclass.js:40-54,67-71`; `LessonContents.java:23-45`).
- vNext now: New lessonContents stores UUID, externalUrl, startsAt/endsAt timestamptz, DRAFT/PUBLISHED status, visibleToStudents (`courses.ts:371-405`).
- Fix: Document migration of link, timing/timezone/role fields; preserve missing-end cases and IDs.

## G2-18-002-023  [P1] GAP  facet F04  effort M
- Legacy: Legacy active+enabled Boolean controls student visibility. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:56-60`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:397-398`
- vNext now: vNext has status ACTIVE/ARCHIVED and `visibleToStudents` Boolean, plus path/offering/published content statuses. `src/db/schema/courses.ts:320-341`, `src/app/(authenticated)/admin/lessons/page.tsx:94-101`, `src/components/courses/college-lesson-visibility-controls.tsx:19-45`
- Fix: Define effective old active&&enabled to new lesson visible flag and archive semantics; avoid exposing unpublished lessons.

## G2-18-002-035  [P1] GAP  facet F06  effort M
- Legacy: Legacy Create has one student visibility switch default ON and explanatory helper `Off hides this lesson and its content...`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:56-60`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:423-425`
- vNext now: vNext Create has no visibility switch; status/visibility defaults DB ACTIVE/true. `src/components/courses/super-admin-lesson-create.tsx:42-63`, `src/db/schema/courses.ts:332-334`
- Fix: Expose default ON toggle and pass explicit visibility at creation when user switches it off.
