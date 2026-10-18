# Faculty Assignment Editor — UX confirmed actions

`/teacher/courses/[deliveryId]/assignments/manage` previously displayed browser `window.confirm` for draft switching and archiving, losing native dialog focus management. Both confirmations now use the shared `ConfirmDialog`, preserving existing question/consequence strings, revalidating state on confirmation, retaining the mutation lock, and returning focus on cancellation. Archive uses the danger variant; draft-switch confirmation retains edits until explicitly confirmed. The form uses shared `Button`, `Input`, `Select`, `Textarea` controls with 16px phone typing and 44px tap sizing. Permissions, lesson/assignment selectors, and backend commands are unchanged.

Tests: `UX-teacher-courses-deliveryId-assignments-manage-03` through `05`, `tests/unit/UX-teacher-assignment-editor-dialog.test.ts`. Source tests authored, not yet executed in CI or browser.
