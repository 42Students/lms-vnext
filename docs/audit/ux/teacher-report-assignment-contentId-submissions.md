# UX rollout: /teacher/report/assignment/[contentId]/submissions

- Before: Submission search/filter/export controls needed legible navigation without overflow.
- After: page root supports narrow viewports; navigation now uses deep-teal text and visible focus; touch targets are at least 44px where page-owned. Maintained existing shared report/workspace widgets and all labels.
- Preserved: Section scoping, publication sorting and paged submissions. Same tenant/role scope, no new data changes or fabricated state.
- States: retained existing failure/empty handling. 320/360/390, WebView, screen-reader and live runtime evidence remain pending.
- Test: `tests/unit/UX-teacher-pages-round4.test.ts`, `UX-teacher-report-assignment-contentId-submissions-01`.
