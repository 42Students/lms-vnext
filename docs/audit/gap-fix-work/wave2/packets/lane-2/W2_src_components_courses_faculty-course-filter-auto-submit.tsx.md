# Work packet (wave 2): edit src/components/courses/faculty-course-filter-auto-submit.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u001-teacher-courses.md

## G2-15-001-027  [P2] GAP  facet F06  effort M
- Legacy: Section filter is antd Select with `aria-label=Filter by section`, `size=middle`, no separate Apply button (CoursesContent.jsx:399-402).
- vNext now: HTML-backed Select inside `label Section`, auto-submitted by JavaScript and Apply button (faculty-course-list.tsx:99-118; faculty-course-filter-auto-submit.tsx:15-30).
- Fix: Match selector label/placement/interaction and accessible name.
