# Chat-7 Super Admin courses/content source audit

Scope: `/admin/courses`, `/admin/courses/offerings/[offeringId]`, `/admin/lessons`, `/admin/videos`, `/admin/resources`, `/admin/live-classes`, `/admin/assignments`, `/admin/quizzes`, `/admin/course-progress`, `/admin/course-progress/students`.

Key findings and changes:
- **MAJOR**: All four `AdminCourseOverview` course/offering/delivery/teacher tables included action columns, but their `DataTable` definitions did not mark these as mobile action priorities. On 320px screens the fourth secondary column could be behind the More details disclosure. Set `mobilePriority: "action"` for each to keep edit, archive, duplicate and lifecycle controls visible.
- **MAJOR**: Course offering detail had 36px back button and 40px anchor tabs; increased to 44px while retaining exact legacy labels.
- **Major from unit-failures-r9**: lessons directory linking to offering previously said only "Open offering"; now describes that it adds lessons (SA-academics-people-56). Assessment directory links now specify builder/submissions (SA-academics-people-64).
- Verified select-college required for page data, invalid filter error states, constrained offering lookup, content filter contracts and no implied completion when no measurable content. Runtime tenant-isolation probes still required; source checks are not integration tests.

Regression: `tests/unit/UX-admin-courses-content-audit-01.test.ts`, including `SA-academics-people-77`, `UX-admin-courses-actions-01`, `UX-admin-courses-offering-touch-01`, `UX-admin-content-*-01` and measured-progress assertions. Not executed in this environment.
