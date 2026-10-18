# UX rollout: /teacher/profile

- Before: Three isolated shortcut rows obscured the profile's grouped navigation on phones.
- After: mobile-safe root, deep-teal links, 44px minimum actions, keyboard-visible outline where the page owns the controls. Profile shortcuts are one labelled navigation region without renaming any of the three links.
- Preserved: About fields, all three exact action labels and registered identity. No role/privacy broadening.
- States: existing EmptyState/Error/denied/partial flows retained; manual viewport/WebView/assistive-tech proof and test execution pending.
- Source test: `tests/unit/UX-teacher-pages-round3.test.ts`, `UX-teacher-profile-01`.
