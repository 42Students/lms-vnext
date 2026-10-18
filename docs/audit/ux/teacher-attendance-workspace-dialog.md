# Faculty Attendance Workspace — confirmation UX

The attendance workspace now uses the shared focus-managed `ConfirmDialog` rather than `window.confirm` to protect unsaved marks when switching mode/date/session, and to confirm scheduling in IST. The exact existing discard and IST confirmation questions are preserved. Cancel keeps the unsubmitted learner marks and selected Session; Confirm executes the deferred scoped selection. The schedule form validates IST instants before opening the dialog, revalidates on confirmation and retains its existing pending lock.

Tests: `UX-teacher-courses-deliveryId-attendanceDetail-05` and `06` in `tests/unit/UX-teacher-attendance-workspace-dialog.test.ts`; source-only, browser/device acceptance pending.
