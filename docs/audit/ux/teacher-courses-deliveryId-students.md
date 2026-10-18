# UX rollout: /teacher/courses/[deliveryId]/students

- Before: Course roster's return link needed accessible focus and phone-friendly layout.
- After: mobile-safe root, deep-teal links, 44px minimum actions, keyboard-visible outline where the page owns the controls. Shared component structure retained.
- Preserved: scoped roster and assigned Section redirects. No role/privacy broadening.
- States: existing EmptyState/Error/denied/partial flows retained; manual viewport/WebView/assistive-tech proof and test execution pending.
- Source test: `tests/unit/UX-teacher-pages-round3.test.ts`, `UX-teacher-courses-deliveryId-students-01`.
