# UX-courses-faculty-roster-attendance-tables-01

- `src/components/courses/faculty-course-roster.tsx`: replaced two separate desktop/mobile roster render trees with `DataTable` (first field name/avatar/roll, contact phone/email as mobile secondaries). All buttons and contact links have 44px targets. Scoped photo preview, roster search and pagination are retained.
- `src/components/attendance/learner-attendance-workspace.tsx`: replaced raw attendance table and separate mobile cards with `DataTable` (date, class/time, status, faculty/location, day), keeping status filtering, IST labels, empty states, and CSV export. Extra fields stay discoverable through mobile disclosure.
- Both tables now inherit focusable named horizontal scroll regions, edge fades, overscroll containment and global reduced-motion support from the shared `DataTable` → `ScrollCue` path.

`tests/unit/UX-courses-faculty-roster-attendance-tables-01.test.ts` guards the functional actions, exact empty text and row fields, not just component existence. Runtime keyboard and 320px verification not executed in this connector environment.
