# UX rollout: /teacher/courses/[deliveryId]/quizzes/manage

- Before: Quiz authoring navigation needed deep-teal contrast and focus while keeping forms on screen.
- After: Reused established page/shared faculty components and made responsive root min-width explicit, normalized navigational actions to 44px and deep-teal text, retained one PageHeader, and replaced glow-only focus with visible outline where present.
- Preserved: authorized quiz builder and registered-lessons empty state. Source copy and section action labels not renamed.
- States: original error/empty/read-only paths preserved. No new data mutation. Browser mobile/native/WebView/AT evidence not yet executed.
- Source regression: `tests/unit/UX-teacher-pages-round2.test.ts` (`UX-teacher-courses-deliveryId-quizzes-manage-01`).
