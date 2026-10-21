# Work packet (wave 2): edit src/modules/courses/faculty-course-card-summary-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-15/u001-teacher-courses.md

## G2-15-001-060  [P2] GAP  facet F19  effort M
- Legacy: Loads complete faculty active list in one GET; client filters, caps grid at 48, popover to 100 (CoursesContent.jsx:117-126,283-288,346-360,566-569).
- vNext now: Queries all scoped assignments then filters/slices 48; card counters bounded 48, but DB initial delivery query not paged (faculty-course-list-service.ts:12-21; faculty-course-list-model.ts:25-37; faculty-course-card-summary-service.ts:36-43).
- Fix: Evaluate server pagination at scale while keeping visible progressive-reveal parity; report limits and slow-query timings.
