# /tpo/reports/offers-acceptance — UX rollout

- **Before:** The saved-report-filters panel used a null Suspense fallback, leaving no loading state while its data resolved.
- **After:** The shared `Skeleton` form placeholder exposes an accessible loading status without changing any legacy report title, description, filter or action label.
- **States covered:** report filter loading, existing permission gate, existing empty/no-data reporting and export flow remain intact. Further browser/device and assistive-technology checks remain external.
- **Regression coverage:** `tests/unit/chat2-ux-tpo-report-pages.test.ts` — `UX-tpo-tpo-reports-offers-acceptance-01`.
- **Validation:** Source reviewed; automated tests, TypeScript and responsive/browser checks not executed in this environment. Do not tick the rollout checklist until CI passes.
