# UX rollout: /teach/courses

- Before: Course directory incurred one workspace fetch per visible course (N+1).
- After: page root supports narrow viewports; navigation now uses deep-teal text and visible focus; touch targets are at least 44px where page-owned. Reused `listFacultyCourseCardSummaries` from `/teacher/courses` for a single batched summary request instead of per-row full course workspace loads.
- Preserved: My Teaching Courses title, grouped course summaries and pagination. Same tenant/role scope, no new data changes or fabricated state.
- States: retained existing failure/empty handling. 320/360/390, WebView, screen-reader and live runtime evidence remain pending.
- Test: `tests/unit/UX-teach-pages-round4.test.ts`, `UX-teach-courses-01`.
