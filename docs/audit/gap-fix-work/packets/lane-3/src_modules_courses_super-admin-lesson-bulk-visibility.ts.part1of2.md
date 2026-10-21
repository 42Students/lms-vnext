# Work packet: edit src/modules/courses/super-admin-lesson-bulk-visibility.ts (part 1 of 2)

20 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-18/u002-superadmin-lessons.md, docs/audit/gap2/lane-2/admin-lesson-bulk-controller.md

## G2-18-002-067  [P1] GAP  facet F10  effort L
- Legacy: Legacy bulk POST `/api/v1/admin/lessons/bulk-status` sets lesson active/enabled Booleans. `docs/legacy-source/frontend/src/api/Services/AdminService.js:530-537`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:346-367`
- vNext now: vNext POST `/api/admin/lessons/bulk-status` toggles published content visibility only, not lesson rows. `src/app/api/admin/lessons/bulk-status/route.ts:6-10`, `src/modules/courses/super-admin-lesson-bulk-visibility.ts:11-70`
- Fix: Resolve semantic mismatch: bulk lesson visibility must change effective lesson-level visibility as single toggle does, or label it bulk content visibility.

## G2-18-002-076  [P1] GAP  facet F12  effort L
- Legacy: Legacy visible iff active and enabled; bulk set both at once. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:56-60`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:346-367`
- vNext now: vNext visibleToStudents independent of status, path publish and item publish; bulk affects item flags only. `src/db/schema/courses.ts:332-334`, `src/components/courses/college-lesson-visibility-controls.tsx:19-45`, `src/modules/courses/super-admin-lesson-bulk-visibility.ts:32-64`
- Fix: Unify effective visibility calculation/UI and bulk semantics to avoid divergent selection outcomes.

## G2-2-018-009  [P1] GAP  facet F04  effort M
- Legacy: AdminLessonBulkController.java:137-142 returns `requested`,`updatedCount`,`failed[{lessonId,reason}]` and exact `Updated N of M lesson(s)`
- vNext now: super-admin-lesson-bulk-visibility.ts:55 returns `selectedLessons`,`matchedContents`,`changed`,`unchanged`,`failures[{id,lessonId,reason}]`
- Fix: Return per-lesson update summary with original requested/updated/failed semantics.

## G2-2-018-017  [P1] GAP  facet F06  effort M
- Legacy: AdminLessonBulkController.java:62-68 request accepts `lessonIds:Integer[]` and nullable independent `active`,`enabled`
- vNext now: super-admin-lesson-bulk-visibility.ts:12-15 requires UUID IDs, `visibleToStudents` boolean and `confirmed:true`
- Fix: Implement two independent lesson status flags with null means preserve; version/ID translation.

## G2-2-018-024  [P1] GAP  facet F07  effort M
- Legacy: AdminLessonBulkController.java:101-106 `Invalid lesson id`,`Lesson not found` in failed list
- vNext now: super-admin-lesson-bulk-visibility.ts:12-15 rejects invalid UUID schema globally; query:29-40 excludes missing IDs without individual failures
- Fix: For each submitted ID, emit explicit validation/not-found failure without blocking valid siblings.

## G2-2-018-032  [P1] GAP  facet F10  effort M
- Legacy: AdminLessonBulkController.java:99-120 resolves each lesson and calls `lessonService.updateLesson` independently
- vNext now: super-admin-lesson-bulk-visibility.ts:19-55 fan-out through published lessonContents to visibility service
- Fix: Write `course_lessons.visible_to_students`/matching lesson status independently per lesson; preserve partial commits.

## G2-2-018-033  [P1] GAP  facet F10  effort M
- Legacy: AdminLessonBulkController.java:113-119 builds LessonDTO with name, course, sequence and flags to retain metadata
- vNext now: super-admin-lesson-bulk-visibility.ts:48-51 sends only content ID/visibility/CAS
- Fix: Preserve lesson name, order and identity on each status write.

## G2-2-018-034  [P1] GAP  facet F10  effort M
- Legacy: AdminLessonBulkController.java:121-128 stores failed entry per lessonId and continues batch
- vNext now: super-admin-lesson-bulk-visibility.ts:43-55 errors per published content item; missing IDs silent
- Fix: Aggregate failures by original lesson ID including zero content.

## G2-2-018-035  [P1] GAP  facet F10  effort M
- Legacy: AdminLessonBulkController.java:130-135 optionally writes one `LESSON_BULK_STATUS_UPDATE` audit with requested/updated/failed
- vNext now: super-admin-lesson-bulk-visibility.ts:43-55 no batch audit call (individual visibility update may emit own activity)
- Fix: Emit single batch audit event with counts and actor/college scope.

## G2-2-018-037  [P1] GAP  facet F11  effort M
- Legacy: AdminLessonBulkController.java:104-111 independently checks `requireAccessCourse` per requested lesson
- vNext now: super-admin-lesson-bulk-visibility.ts:18,27-39 scopes fetched content to acting college
- Fix: Per-ID scope check must report forbidden IDs as individual failures, not omit.

## G2-2-018-038  [P1] GAP  facet F11  effort M
- Legacy: AccessControlService.java:482-499 rejects foreign/not-found/deleted course with audited reason
- vNext now: super-admin-lesson-bulk-visibility.ts:29-39 filters foreign college before update
- Fix: Preserve authorized sibling writes and non-leaking per-ID failure reason.

## G2-2-018-041  [P1] GAP  facet F12  effort M
- Legacy: AdminLessonBulkController.java:65-68,113-119 null active or enabled preserves existing independent flag
- vNext now: super-admin-lesson-bulk-visibility.ts:14,46-50 always sets content.visibleToStudents
- Fix: Allow partial flag changes, preserve untouched flag and distinguish active/enabled.

## G2-2-018-061  [P1] GAP  facet F19  effort M
- Legacy: AdminLessonBulkController.java:97-128 independent service DB calls in one loop
- vNext now: super-admin-lesson-bulk-visibility.ts:43-54 loops over published CONTENT rows and calls service per item
- Fix: Reduce N×content writes; update the parent lesson once per requested lesson.

## G2-2-018-062  [P1] GAP  facet F20  effort M
- Legacy: AdminLessonBulkController.java:35-36,99-128 partial commits by design; one exception does not roll back siblings
- vNext now: super-admin-lesson-bulk-visibility.ts:43-54 partial content writes can leave same lesson mixed visible/invisible
- Fix: Ensure atomic write per lesson and per-lesson retry safety.

## G2-2-018-063  [P1] GAP  facet F20  effort M
- Legacy: Lesson.java:32-39 @Version protects concurrent edits; LessonServiceImpl.java:271-275 transactional save
- vNext now: super-admin-lesson-bulk-visibility.ts:48-51 content CAS only, no parent lesson version update
- Fix: Use lesson optimistic token for bulk writes and report conflict by lesson.

## G2-2-018-070  [P1] GAP  facet F22  effort M
- Legacy: AdminLessonBulkController.java:99-120 changes `lesson.active` and `lesson.enabled` rows
- vNext now: super-admin-lesson-bulk-visibility.ts:20-55 only writes `lesson_contents.visible_to_students` via service
- Fix: Target `course_lessons` row, not `lesson_contents` as replacement.

## G2-2-018-072  [P1] MISSING  facet F23  effort M
- Legacy: AdminLessonBulkController.java:97-128 reports absent or forbidden LESSON row as failure
- vNext now: super-admin-lesson-bulk-visibility.ts:29-40 omission of nonexistent IDs, no matching content => no action/failure
- Fix: Count and list every requested ID, including zero-content lessons.

## G2-2-018-021  [P2] GAP  facet F07  effort S
- Legacy: AdminLessonBulkController.java:81-83 `lessonIds is required and must not be empty`
- vNext now: super-admin-lesson-bulk-visibility.ts:12-15 Zod `min(1)` default issue, surfaced via generic apiErrorResponse route.ts:7-9
- Fix: Add exact empty-array field error.

## G2-2-018-022  [P2] GAP  facet F07  effort S
- Legacy: AdminLessonBulkController.java:84-86 `Maximum N lessons per bulk update`
- vNext now: super-admin-lesson-bulk-visibility.ts:13 hard 25, generic Zod error
- Fix: Match configured cap wording and exposed maximum.

## G2-2-018-023  [P2] MISSING  facet F07  effort S
- Legacy: AdminLessonBulkController.java:87-89 `Set at least one of active or enabled`
- vNext now: super-admin-lesson-bulk-visibility.ts:12-15 uses mandatory single visibleToStudents; no equivalent error
- Fix: Validate either flag set and reject both omitted.
