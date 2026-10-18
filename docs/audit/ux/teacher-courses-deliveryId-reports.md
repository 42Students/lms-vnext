# UX rollout: /teacher/courses/[deliveryId]/reports

- Before: Dense report navigation and KPI cards needed phone-safe wrapping.
- After: mobile-safe root, deep-teal links, 44px minimum actions, keyboard-visible outline where the page owns the controls. Shared component structure retained.
- Preserved: real published roster, attendance and assessment aggregates. No role/privacy broadening.
- States: existing EmptyState/Error/denied/partial flows retained; manual viewport/WebView/assistive-tech proof and test execution pending.
- Source test: `tests/unit/UX-teacher-pages-round3.test.ts`, `UX-teacher-courses-deliveryId-reports-01`.
