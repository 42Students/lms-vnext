# UX-courses-progress-report-tables-01

- `src/components/courses/college-learner-progress-report.tsx`: replaced raw horizontally scrolling table with `DataTable`, one responsive DOM tree, mobile primary learner/progress fields, truthful empty copy, the existing progress meter and bounded CSV export. The shared table provides a focusable named horizontal scroll region and left/right edge fades when overflow is present.
- `src/components/courses/faculty-report-student-table.tsx`: replaced the duplicated desktop raw table/mobile cards with one `DataTable`, retaining submitted IST times, grader status, search and pagination. Responsive secondary values remain discoverable with the shared disclosure.
- The shared `ScrollCue` uses the globally configured motion and honours reduced-motion. No local bespoke duration value was introduced.

Source-level test `tests/unit/UX-courses-progress-report-tables-01.test.ts` asserts real mapping, accessible labels, scroller integration, filtering and empty copy; browser touch/keyboard behaviour still needs runtime verification.
