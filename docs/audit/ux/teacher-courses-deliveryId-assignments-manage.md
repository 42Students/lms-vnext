# UX rollout: /teacher/courses/[deliveryId]/assignments/manage

- Before: Assignment editor and Back to course affordance were missing signed-off focus and narrow-layout consistency.
- After: Reused established page/shared faculty components and made responsive root min-width explicit, normalized navigational actions to 44px and deep-teal text, retained one PageHeader, and replaced glow-only focus with visible outline where present.
- Preserved: lesson-scoped assignment authoring and existing empty state. Source copy and section action labels not renamed.
- States: original error/empty/read-only paths preserved. No new data mutation. Browser mobile/native/WebView/AT evidence not yet executed.
- Source regression: `tests/unit/UX-teacher-pages-round2.test.ts` (`UX-teacher-courses-deliveryId-assignments-manage-01`).
