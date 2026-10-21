# Work packet: edit src/components/courses/super-admin-lesson-create.tsx

12 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u003-superadmin-lessons.md, docs/audit/gap2/lane-18/u002-superadmin-lessons.md

## G2-15-003-030  [P1] MISSING  facet F06  effort M
- Legacy: Visible to students switch defaults on; help `Off hides this lesson and its content from students; staff still see it.` (`sections/Lessons.js:56-61,423-425`).
- vNext now: No visibility switch on create; backend default visible true (`super-admin-lesson-create.tsx:42-64`; `courses.ts:332-335`).
- Fix: Add default-on switch with exact help and map active/enabled/visible fields.

## G2-15-003-049  [P1] GAP  facet F10  effort L
- Legacy: Create `POST /api/v1/lesson/create` payload courseId, name, active/enabled true, sequence0 (`AdminService.js:560-564`; `sections/Lessons.js:255-269`).
- vNext now: POST `/api/courses/lessons` with learningPathId, name, description, computed sequence (`super-admin-lesson-create.tsx:26-34`).
- Fix: Map legacy course→eligible offering/path and student visibility; avoid race in sequence append.

## G2-15-003-058  [P1] GAP  facet F12  effort M
- Legacy: Create legacy defaults active:true enabled:true; visible field allows off at creation (`sections/Lessons.js:423-425,59-60`).
- vNext now: New lesson defaults visible true only; no create switch (`courses.ts:332-335`; `super-admin-lesson-create.tsx:42-64`).
- Fix: Expose off at creation with correct persistent value, do not require post-create hide.

## G2-15-003-089  [P1] GAP  facet F23  effort L
- Legacy: Legacy create/edit requires visibility switch, edit course move, typed delete; details as described (`sections/Lessons.js:37-63,284-344,531-555`).
- vNext now: VNext create default active, edit only name/description/sequence, archive confirm without typing (`super-admin-lesson-create.tsx:21-64`; `admin-learning-structure-actions.tsx:469-635`).
- Fix: Make owner decision matrix and implement missing lifecycle/edit safeguards before marking parity.

## G2-18-002-035  [P1] GAP  facet F06  effort M
- Legacy: Legacy Create has one student visibility switch default ON and explanatory helper `Off hides this lesson and its content...`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:56-60`, `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:423-425`
- vNext now: vNext Create has no visibility switch; status/visibility defaults DB ACTIVE/true. `src/components/courses/super-admin-lesson-create.tsx:42-63`, `src/db/schema/courses.ts:332-334`
- Fix: Expose default ON toggle and pass explicit visibility at creation when user switches it off.

## G2-18-002-073  [P1] GAP  facet F12  effort M
- Legacy: Legacy new lesson auto-appends per course when sequence=0. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:264-268`, `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/LessonServiceImpl.java:130-136`
- vNext now: vNext computes max sequence client-side after GET path then POST explicit sequence. `src/components/courses/super-admin-lesson-create.tsx:21-35`
- Fix: Make sequence allocation atomic in DB transaction to avoid duplicate-sequence race on simultaneous creates.

## G2-15-003-034  [P2] GAP  facet F07  effort M
- Legacy: Create uses client field mapping from server `lesson_name→lessonName`, `course_id→courseId` (`sections/Lessons.js:272-277`).
- vNext now: Create displays generic caught Error `Lesson could not be saved.`, no mapped field error (`super-admin-lesson-create.tsx:21-37,60`).
- Fix: Map server validation violations to individual form fields.

## G2-15-003-039  [P2] GAP  facet F08  effort S
- Legacy: Create success `Created lesson “{name}” in {course}.`; resets form but preserves course and visible defaults (`sections/Lessons.js:255-271`).
- vNext now: Clears name/description, router.refresh, no success toast (`super-admin-lesson-create.tsx:21-37`).
- Fix: Show exact success toast, retain course selection and default visible field.

## G2-18-002-042  [P2] GAP  facet F07  effort S
- Legacy: Legacy create validation `Select a course`, `Enter a lesson name`, `Maximum 255 characters`. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:39-50`
- vNext now: vNext native HTML required and maxLength blocks; no corresponding exact field messages. `src/components/courses/super-admin-lesson-create.tsx:43-54`
- Fix: Add field-level messages with exact strings plus server Zod response mapping.

## G2-18-002-043  [P2] GAP  facet F07  effort S
- Legacy: Legacy backend DTO NotBlank `Lesson name is required`, Size max255 `Lesson name must not exceed 255 characters`. `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonDTO.java:10-22`
- vNext now: vNext input name max length through route/service validation, errors surfaced generic Alert. `src/modules/courses/lesson-service.ts:120-135`, `src/components/courses/super-admin-lesson-create.tsx:30-36`
- Fix: Map vNext server validation codes to exact frontend required/max message; do not rely only on input maxLength.

## G2-18-002-048  [P2] GAP  facet F07  effort S
- Legacy: Legacy create failure Alert `Lesson was not created`, can be closed. `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:419-422`
- vNext now: vNext plain inline Alert with raw Error.message. `src/components/courses/super-admin-lesson-create.tsx:36-37`, `src/components/courses/super-admin-lesson-create.tsx:60-61`
- Fix: Wrap in closable Alert with title `Lesson was not created` and concrete cause.

## G2-18-002-050  [P2] GAP  facet F08  effort S
- Legacy: Legacy created success `Created lesson “NAME” in COURSENAME.` `docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:264-270`
- vNext now: vNext creation resets form and router.refresh without a success toast. `src/components/courses/super-admin-lesson-create.tsx:30-38`
- Fix: Show exact success toast on create in selected offering, with new offering label if necessary.
