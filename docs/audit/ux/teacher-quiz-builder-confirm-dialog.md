# Faculty Quiz Builder — focus-managed confirmations

Seven browser `window.confirm` paths were replaced by shared `ConfirmDialog` for switching or resetting unsaved work, copying drafts, closing or archiving, removing a question/answer, and reloading the saved bank. All existing confirmation warning text, draft guards, optimistic/version locks and scoped APIs are preserved. The queued action is cleared on dismissal and performed only on explicit confirmation.

Source tests: `UX-teacher-courses-deliveryId-quizzes-manage-03`–`05` in `tests/unit/UX-teacher-quiz-builder-confirm-dialog.test.ts`. Browser, screen-reader and CI evidence outstanding.
