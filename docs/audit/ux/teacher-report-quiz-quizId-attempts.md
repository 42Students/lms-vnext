# UX rollout: /teacher/report/quiz/[quizId]/attempts

- Before: Quiz attempt search, accuracy and pagination required responsive framing.
- After: page root supports narrow viewports; navigation now uses deep-teal text and visible focus; touch targets are at least 44px where page-owned. Maintained existing shared report/workspace widgets and all labels.
- Preserved: published/private quiz availability and authorized drilldown. Same tenant/role scope, no new data changes or fabricated state.
- States: retained existing failure/empty handling. 320/360/390, WebView, screen-reader and live runtime evidence remain pending.
- Test: `tests/unit/UX-teacher-pages-round4.test.ts`, `UX-teacher-report-quiz-quizId-attempts-01`.
