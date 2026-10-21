# Work packet: edit src/components/courses/college-lesson-create-control.tsx

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/college-admin-lessons.md

## G2-17-007-025  [P1] MISSING  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:56-61 — `Visible to students` enabled by default on creation and edit, with explicit hiding helper.
- vNext now: src/components/courses/college-lesson-create-control.tsx:101-109 — Create form has no visibility switch; service defaults visibility true.
- Fix: Add create visibility switch and propagate to mutation/service.

## G2-17-007-045  [P1] GAP  facet F10  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:258-269 — Create payload sets sequence 0; backend appends and sets both `active`, `enabled`.
- vNext now: src/components/courses/college-lesson-create-control.tsx:51-64 — Auto-creates learning path then POSTs explicit nextSequence; no active/enabled properties.
- Fix: Verify two-write failure recovery and surface exact legacy visibility defaults.

## G2-17-007-029  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:39-50 — Client errors: `Select a course`, `Enter a lesson name`, `Maximum 255 characters`.
- vNext now: src/components/courses/college-lesson-create-control.tsx:47-49 — Empty name prevents click and API errors shown generally; browser required/maxLength.
- Fix: Show exact field-level errors and distinguish name length from required.

## G2-17-007-030  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/LessonDTO.java:14-16 — Backend name: `Lesson name is required`; `Lesson name must not exceed 255 characters`.
- vNext now: src/components/courses/college-lesson-create-control.tsx:20-25 — API fetch maps error token to generic `The change could not be saved.`.
- Fix: Map server validation fields/codes to legacy wording in form.

## G2-17-007-035  [P2] GAP  facet F08  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:268-270 — Success `Created lesson “{name}” in {course}.`; resets name, retains chosen course.
- vNext now: src/components/courses/college-lesson-create-control.tsx:65-69 — Generic `Lesson created.` notice; resets description/name and may close form.
- Fix: Use exact contextual success copy and retain course, form-open add-another semantics.

## G2-17-007-031  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:419-421 — Create error alert title `Lesson was not created`, closable.
- vNext now: src/components/courses/college-lesson-create-control.tsx:125-126 — Bare alert showing error text without matching title/close.
- Fix: Match title and dismiss action for failure alert.
