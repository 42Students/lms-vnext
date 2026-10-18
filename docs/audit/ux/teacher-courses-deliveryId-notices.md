# UX rollout: /teacher/courses/[deliveryId]/notices

- Before: Retired notice surface required a canonical non-duplicating destination.
- After: Confirmed the redirect resolves only after existing authorization; no duplicate rendered page, extra heading or unowned copy.
- Preserved: permission-checked redirect to Section discussions. Source copy and section action labels not renamed.
- States: original error/empty/read-only paths preserved. No new data mutation. Browser mobile/native/WebView/AT evidence not yet executed.
- Source regression: `tests/unit/UX-teacher-pages-round2.test.ts` (`UX-teacher-courses-deliveryId-notices-01`).
