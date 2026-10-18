# Faculty shared UX components — chat-3

Shared changes affect `/teacher/courses`, `/teach/courses`, `/teacher/contacts/*`, `/teacher/report/*`, `/teacher/allAssignments` and `/teacher/allQuizzes` without duplicating table or filter implementations.

- `faculty-course-list.tsx`: 44px native details disclosures, deep-teal links and keyboard focus for course cards and filter reset.
- `faculty-contacts-table.tsx`: preserves exact empty copy; 44px directory detail links and pagination controls with visible focus.
- `faculty-report-student-table.tsx`: preserves desktop table and phone card composition, raises paging controls to 44px.
- `faculty-assessment-overview.tsx`: preserves scoped empty states and filters; raises drilldown and paging affordances to 44px and deep-teal contrast.
- Test: `tests/unit/UX-teacher-shared-surfaces.test.ts` (four source contracts).
- Manual 320/360/390, screen reader, keyboard and WebView evidence **not executed**; this is source verification only.
