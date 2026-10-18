# UX rollout: /teacher/courses/[deliveryId]/gradebook/[learnerMembershipId]

- Before: Private learner drilldown navigation needed focus and narrow-width handling.
- After: Reused established page/shared faculty components and made responsive root min-width explicit, normalized navigational actions to 44px and deep-teal text, retained one PageHeader, and replaced glow-only focus with visible outline where present.
- Preserved: membership authorization and privacy-aware 404. Source copy and section action labels not renamed.
- States: original error/empty/read-only paths preserved. No new data mutation. Browser mobile/native/WebView/AT evidence not yet executed.
- Source regression: `tests/unit/UX-teacher-pages-round2.test.ts` (`UX-teacher-courses-deliveryId-gradebook-learnerMembershipId-01`).
