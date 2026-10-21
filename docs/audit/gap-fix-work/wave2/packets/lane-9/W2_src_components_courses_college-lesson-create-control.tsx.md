# Work packet (wave 2): edit src/components/courses/college-lesson-create-control.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-17/college-admin-lessons.md

## G2-17-007-005  [P2] GAP  facet F02  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:411-432 — Creation form permanently displayed inside `Create New Lesson` card.
- vNext now: src/components/courses/college-lesson-create-control.tsx:74-86 — Collapsed behind `Create New Lesson` toggle until clicked.
- Fix: Keep lesson create fields visible on first load as in legacy.

## G2-17-007-023  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:39-45 — Required searchable course Select lists course names; `Select course` placeholder.
- vNext now: src/components/courses/college-lesson-create-control.tsx:87-95 — Native offering picker preselects first option and labels code/cohort/period.
- Fix: Preserve explicit no-selection default and searchable course UX if parity required.

## G2-17-007-055  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:413-418 — Empty course set shows `No courses in this college yet` and Go to Courses.
- vNext now: src/components/courses/college-lesson-create-control.tsx:83-85 — Says `Create an active Course Offering first. Lessons belong to a Course and Batch.`
- Fix: Preserve warning/Go to Courses CTA while explaining offering requirement.

## G2-17-007-024  [P3] GAP  facet F06  effort S
- Legacy: docs/legacy-source/frontend/src/pages/superadmin/sections/Lessons.js:46-50 — Lesson name is required nonwhitespace, max 255; example placeholder `e.g., Introduction to Arrays`.
- vNext now: src/components/courses/college-lesson-create-control.tsx:101-104 — Required max 255 but no example placeholder; trims before POST.
- Fix: Add exact example placeholder and match whitespace error display.
