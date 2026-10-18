# UX rollout: /teach/courses/[deliveryId]

- Before: Compact shortcut links fell below minimum 44px target size.
- After: page root supports narrow viewports; navigation now uses deep-teal text and visible focus; touch targets are at least 44px where page-owned. Upgraded Students, Attendance, Discussions and Back link targets; preserved workspace itself.
- Preserved: FacultyCourseWorkspace and scoped not-found behavior. Same tenant/role scope, no new data changes or fabricated state.
- States: retained existing failure/empty handling. 320/360/390, WebView, screen-reader and live runtime evidence remain pending.
- Test: `tests/unit/UX-teach-pages-round4.test.ts`, `UX-teach-courses-deliveryId-01`.
