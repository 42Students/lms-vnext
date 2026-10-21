# Work packet: edit src/modules/courses/lesson-service.ts

14 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/lesson-search-controller.md, docs/audit/gap2/lane-14/l18-u018-lesson.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md, docs/audit/gap2/lane-20/lesson-controller.md

## G2-13-013-029  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:53-68` GLOBAL only unrestricted; all other actors must pass courseId with requireAccessCourse
- vNext now: `src/modules/courses/college-learning-directory-service.ts:36-58` only selected superadmin college or college admin membership; `src/modules/courses/lesson-service.ts:62-91` course offering read roles
- Fix: Restore role-specific global-superadmin search and narrow course-scoped access, including learners/faculty if legacy allowed

## G2-13-013-031  [P1] GAP  facet F11  effort S
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/lessons/LessonSearchController.java:96-101` POST refresh requireSuperAdmin, NOT necessarily global
- vNext now: `src/app/api/courses/lessons/route.ts:30-45` POST lesson create uses courses.manage permission via `src/modules/courses/lesson-service.ts:132-135`
- Fix: Never treat refresh and lesson-create as same privileged operation; preserve separate authorization

## G2-18-018-002  [P1] GAP  facet F01  effort M
- Legacy: `GET /api/v1/lesson/fetch?courseSlug/courseId` supports both and slug precedence (`LessonController.java:174-184`).
- vNext now: New `src/modules/courses/lesson-service.ts:52-70` accepts learningPath UUID.
- Fix: Map old course slug + numeric id deep links into vNext course-offering-path resolution; document intentional URL compatibility policy.

## G2-18-018-013  [P1] GAP  facet F05  effort M
- Legacy: Lesson `getMaxSequenceByCourseId` ignores soft-deleted (`LessonRepository.java:30-33`).
- vNext now: `src/modules/courses/lesson-service.ts:132-150` inserts explicit input.sequence; unique index `src/db/schema/courses.ts:357-359`.
- Fix: Compute next sequence from active lessons automatically where old form omitted sequence; avoid accidental 0 duplicate.

## G2-18-018-015  [P1] GAP  facet F06  effort M
- Legacy: Legacy defaults `active=true`, `enabled=true`; sequence <=0 becomes `max+1` (`LessonServiceImpl.java:133-145`).
- vNext now: `src/db/schema/courses.ts:332-335` status ACTIVE and visibleToStudents true, create explicit sequence (`lesson-service.ts:139-148`).
- Fix: Retain distinct defaults and append ordering; cover omitted and zero sequence in UI API boundary.

## G2-18-018-025  [P1] GAP  facet F10  effort L
- Legacy: POST create persists lesson and optional multiple child contents in one DB transaction (`LessonServiceImpl.java:110-170`).
- vNext now: `src/modules/courses/lesson-service.ts:134-167` inserts only `courseLessons`; content via separate `lesson-content-service.ts`.
- Fix: Support atomic multi-content create when legacy form sends contents, or explicitly split with recovery path and no orphaned lesson.

## G2-18-018-026  [P1] GAP  facet F10  effort L
- Legacy: PATCH/update can modify name, flags, course, sequence (`LessonServiceImpl.java:268-350`).
- vNext now: `src/modules/courses/lesson-service.ts:170-233` updates name,description,sequence only.
- Fix: Close remaining active/enabled and cross-course move parity; avoid accidental data loss on DTO remap.

## G2-18-018-027  [P1] GAP  facet F10  effort M
- Legacy: Delete soft-archives lesson AND active child rows with deletedWithLesson=true (`LessonServiceImpl.java:354-371`).
- vNext now: `src/modules/courses/lesson-service.ts:248-298` archives only `course_lessons` status, child `lesson_contents` not individually archived.
- Fix: Confirm descendants inaccessible while parent archived and restoring restores exactly parent-deleted child subset; consider provenance marker for independently archived content.

## G2-18-018-045  [P1] GAP  facet F20  effort M
- Legacy: Legacy JPA @Version Long optimistic lock version nullable on new entity; documented merge/persist hazard (`docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Lesson.java:30-41`).
- vNext now: `src/db/schema/courses.ts:320-365` has NO version column; `lesson-service.ts:201-215` does not condition UPDATE on updatedAt.
- Fix: Add expectedUpdatedAt/version to edit DTO and conditional update in same transaction, like visibility writer `college-lesson-visibility-service.ts:57-69`; report stale conflict.

## G2-18-002-043  [P2] GAP  facet F07  effort S
- Legacy: Legacy backend DTO NotBlank `Lesson name is required`, Size max255 `Lesson name must not exceed 255 characters`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonDTO.java:10-22`
- vNext now: vNext input name max length through route/service validation, errors surfaced generic Alert. `src/modules/courses/lesson-service.ts:120-135`, `src/components/courses/super-admin-lesson-create.tsx:30-36`
- Fix: Map vNext server validation codes to exact frontend required/max message; do not rely only on input maxLength.

## G2-18-002-044  [P2] GAP  facet F07  effort S
- Legacy: Legacy duplicate lesson name exact `A lesson with this name already exists in the course`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:120-127`
- vNext now: vNext DB uniqueness per learningPath and error maps `course_lessons_active_name_uq`. `src/modules/courses/lesson-service.ts:37-49`, `src/db/schema/courses.ts:351-357`
- Fix: Specify same duplicate text while clarifying new uniqueness scope per offering.

## G2-18-002-052  [P2] GAP  facet F08  effort S
- Legacy: Legacy delete success `Deleted “NAME”. Its uploaded files are kept, so it can be restored if needed.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:334-344`
- vNext now: vNext action archives with generic toast and archives rather than soft-deletes, without this copy. `src/components/courses/admin-learning-structure-actions.tsx:615-629`, `src/modules/courses/lesson-service.ts:238-299`
- Fix: Use accurate `Archived` wording and preservation info; never claim files were deleted.

## G2-20-026-007  [P2] GAP  facet F07  effort S
- Legacy: Exact 'courseId and lessonIds are required' docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:98-102
- vNext now: New Zod validation and error codes src/modules/courses/lesson-service.ts:29-43
- Fix: Restore required-fields message

## G2-20-026-009  [P3] GAP  facet F08  effort S
- Legacy: Reorder success 'Lesson order updated' docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/LessonController.java:118-129
- vNext now: New service returns updated records src/modules/courses/lesson-service.ts:120-167
- Fix: Map toast exact copy
