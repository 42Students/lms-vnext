# Work packet (wave 2): edit src/app/(authenticated)/admin/course-progress/students/page.tsx (part 2 of 2)

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/course-progress.md

## G2-19-003-049  [P3] GAP  facet F13  effort S
- Legacy: Legacy No students in this section `docs/legacy-source/frontend/src/pages/superadmin/sections/CourseProgress.js:379-387`
- vNext now: vNext No enrolled students in this course offering `src/app/(authenticated)/admin/course-progress/students/page.tsx:63-65`
- Fix: Preserve class-specific empty message.
