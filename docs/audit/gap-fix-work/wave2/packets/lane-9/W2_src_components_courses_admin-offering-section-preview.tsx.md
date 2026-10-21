# Work packet (wave 2): edit src/components/courses/admin-offering-section-preview.tsx

8 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/college-admin-course-detail.md

## G2-19-007-020  [P2] GAP  facet F05  effort S
- Legacy: Legacy Syllabus class picker options `All content in this course (every section)` and `<Class>: what its students see` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:91-97`
- vNext now: vNext Section content filter option `Showing every section's content together`, class labels with code `src/components/courses/admin-offering-section-preview.tsx:30-40`
- Fix: Match option wording and combined shared/section content semantics.

## G2-19-007-021  [P2] GAP  facet F05  effort M
- Legacy: Legacy Syllabus class dropdown only if >1 classes, width220 `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:391-401`
- vNext now: vNext Section Select rendered in own section with View Section submit `src/components/courses/admin-offering-section-preview.tsx:30-41`
- Fix: Show class picker near Lessons only when multiple classes; auto-refresh on selection.

## G2-19-007-026  [P2] GAP  facet F06  effort S
- Legacy: Legacy class Select programmatically resets showLessonContent=false `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:391-397`
- vNext now: vNext section selection GET then preview only `src/components/courses/admin-offering-section-preview.tsx:30-45`
- Fix: Clear open lesson detail and selected index on class change.

## G2-19-007-059  [P2] GAP  facet F16  effort S
- Legacy: Legacy class picker width220 max100% `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:391-401`
- vNext now: vNext full-width Section Select + View Section button md grid `src/components/courses/admin-offering-section-preview.tsx:30-41`
- Fix: Match selector width and placement beside Lessons heading.

## G2-19-007-062  [P2] GAP  facet F17  effort S
- Legacy: Legacy Retry buttons inline for course/section load `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:379-389`
- vNext now: vNext error boundaries don't include specific Retry near section picker `src/components/courses/admin-offering-learning-page.tsx:49-53` `src/components/courses/admin-offering-section-preview.tsx:42-43`
- Fix: Expose accessible scoped retry controls.

## G2-19-007-069  [P2] GAP  facet F19  effort L
- Legacy: Legacy generic course allows all section content, potential large grid `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:555-603`
- vNext now: vNext previews at most first200 active sections `src/components/courses/admin-offering-section-preview.tsx:42-43`
- Fix: Provide paginated/filtered Section selection for >200 sections rather than hard truncation.

## G2-19-007-072  [P2] GAP  facet F20  effort M
- Legacy: Legacy section change closes lesson detail `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:391-397`
- vNext now: vNext section form changes URL and preview but leaves inline lessons all visible `src/components/courses/admin-offering-section-preview.tsx:30-46` `src/components/courses/admin-offering-learning-overview.tsx:425-535`
- Fix: Reset selected lesson and ensure scope-specific content list.

## G2-19-007-066  [P3] GAP  facet F18  effort S
- Legacy: Legacy default section label `All content in this course (every section)` `docs/legacy-source/frontend/src/components/admin/courses/AdminCourseSyllabus.jsx:91-97`
- vNext now: vNext `Showing every section's content together` `src/components/courses/admin-offering-section-preview.tsx:30-36`
- Fix: Match literal option copy.
