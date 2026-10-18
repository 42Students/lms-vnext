# Faculty Attendance Schedule Editor — UX refinement

The Schedule and Reschedule workflow under `/teacher/courses/[deliveryId]/attendanceDetail` now uses the shared focus-managed `ConfirmDialog` rather than `window.confirm`, with the same confirmation question and validation-before-commit semantics. The existing source-of-truth version token and reschedule eligibility continue to be validated by the API. The form now uses shared `Select`, `Input`, `Textarea`, and `Button` controls for at least 44px targets and readable phone text; entered values survive failed requests.

Tests: `UX-teacher-courses-deliveryId-attendanceDetail-03/04` in `tests/unit/UX-teacher-attendance-schedule-dialog.test.ts`. Mobile/browser/CI evidence pending.
