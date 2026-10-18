# UX rollout: /teacher/notifications

- Before: Notifications and announcements header needed phone-safe content and readable links.
- After: mobile-safe root, deep-teal links, 44px minimum actions, keyboard-visible outline where the page owns the controls. Shared component structure retained.
- Preserved: scoped cursor pagination and unread counts. No role/privacy broadening.
- States: existing EmptyState/Error/denied/partial flows retained; manual viewport/WebView/assistive-tech proof and test execution pending.
- Source test: `tests/unit/UX-teacher-pages-round3.test.ts`, `UX-teacher-notifications-01`.
