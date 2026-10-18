# Faculty Quiz answer paste dialog and touch targets

Removed the blocking browser `window.prompt` for `Paste choices`. The shared `Dialog` now has a labelled large `Textarea`, the exact existing instructions, an explicit Cancel action, validation from `facultyQuizApplyPastedOptions` and a retained draft/error state when invalid choices are pasted. The question indices and option editing permissions are unchanged. Raised the builder's raw button targets to 44px, improved native text-field font size to 16px to avoid iOS zoom, and used foreground contrast on primary actions.

Tests: `UX-teacher-courses-deliveryId-quizzes-manage-06` and `07` in `tests/unit/UX-teacher-quiz-builder-paste-dialog.test.ts`. Runtime/AT evidence pending.
