# Faculty Attendance — safe error feedback

Kept specific existing friendly messages for attendance correction and scheduling conflicts, but stopped forwarding unrecognized server `message`/`error` strings to the page. Unknown errors now use the operation's existing safe fallback, so backend codes or internal details do not leak into the UI. This preserves the form, session selection and draft on failure.

Test: `UX-teacher-courses-deliveryId-attendanceDetail-07` in `tests/unit/UX-teacher-attendance-friendly-errors.test.ts`. CI/browser not executed in this lane.
