# /tpo/reports/offers-expiry — UX rollout

- **Before:** The saved-report-filters panel used a null Suspense fallback, leaving no loading state while its data resolved. 2 interactive target(s) used a 40px minimum height.
- **After:** The shared `Skeleton` form placeholder exposes an accessible loading status without changing any legacy report title, description, filter or action label. Interactive controls previously limited to 40px now use the 44px minimum.
- **States covered:** report filter loading, existing permission gate, existing empty/no-data reporting and export flow remain intact. Further browser/device and assistive-technology checks remain external.
- **Regression coverage:** `tests/unit/chat2-ux-tpo-report-pages.test.ts` — `UX-tpo-tpo-reports-offers-expiry-01`.
- **Validation:** Source reviewed; automated tests, TypeScript and responsive/browser checks not executed in this environment. Do not tick the rollout checklist until CI passes.
