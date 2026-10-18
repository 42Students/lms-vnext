# UX rollout: /teacher/courses/[deliveryId]/session-coverage

- Before: Session status snapshot displayed an unformatted ISO timestamp.
- After: mobile-safe root, deep-teal links, 44px minimum actions, keyboard-visible outline where the page owns the controls. Snapshot uses `en-IN` with explicit IST zone rather than raw ISO.
- Preserved: persisted session history, no inferred absence. No role/privacy broadening.
- States: existing EmptyState/Error/denied/partial flows retained; manual viewport/WebView/assistive-tech proof and test execution pending.
- Source test: `tests/unit/UX-teacher-pages-round3.test.ts`, `UX-teacher-courses-deliveryId-session-coverage-01`.
