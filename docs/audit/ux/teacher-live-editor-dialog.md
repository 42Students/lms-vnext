# Faculty Live Class Editor — accessible confirmation

`/teacher/live-classes` previously used the browser `window.confirm` for Schedule, Reschedule/Edit, and Cancel. The editor now uses the shared focus-managed `ConfirmDialog` and retains the exact generated `facultyLiveConfirmText` consequence copy, with an explicit danger variant for Cancel. The confirmed action revalidates the payload and respects the existing pending lock; errors keep entered values and explain failure. The action button and 2 inputs/3 selectors use the signed-off shared `Button`, `Input`, and `Select` components with 44px targets and 16px phone text.

Regression: `UX-teacher-live-classes-03` and `UX-teacher-live-classes-04` in `tests/unit/UX-teacher-live-editor-dialog.test.ts`; source-only, execution/browser checks outstanding.
