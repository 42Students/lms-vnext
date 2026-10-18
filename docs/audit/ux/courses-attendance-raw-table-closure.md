# Chat-7 raw-table Pass A

Based on `docs/audit/ux/COVERAGE-MATRIX.md` rows for `components/courses` and `components/attendance`.

**Converted to the shared DataTable (8):**
1. `src/components/courses/learner-course-attendance.tsx`
2. `src/components/courses/college-learner-progress-report.tsx`
3. `src/components/courses/faculty-report-student-table.tsx`
4. `src/components/courses/faculty-course-roster.tsx`
5. `src/components/courses/learner-assessment-overview.tsx`
6. `src/components/courses/college-assessment-aggregate.tsx`
7. `src/components/courses/college-content-aggregate.tsx`
8. `src/components/courses/college-learning-directory.tsx`

**Converted to the shared DataTable (1 more):** `src/components/attendance/learner-attendance-workspace.tsx`.

**Outstanding approved-equivalent decision (2):** The college and faculty monthly attendance calendars are true two-dimensional pivot grids (one learner per row, a changing number of calendar dates/sessions as columns, sticky identifier column and per-day states/actions). A conventional records DataTable would lose day-by-day meaning and matrix interaction. The original semantic `<table>` remains; both now have `<ScrollCue axis="x">` including focusable keyboard scrolling, overflow edge fades and overscroll containment. **Waiver not approved**; request owner approval for these two explicit exceptions before marking the raw-table matrix completely closed.

Tests: `tests/unit/UX-courses-college-catalogue-tables-01.test.ts`, `tests/unit/UX-attendance-calendar-scroll-01.test.ts`, plus the earlier chat-7 attendance/roster/assessment table cases. Source-level testing only; UI runtime verification still pending.
