# UX rollout — /hr/drives

- **Route:** src/app/(authenticated)/hr/drives/page.tsx
- **Test:** UX-hr-drives-01 (`tests/ux-hr-rollout-01.test.mjs`).
- **Earlier weakness:** 14 low-contrast `text-primary-text` utility occurrences; static actions lacked consistent keyboard focus and selected controls were smaller than 44px.
- **Change:** Preserved all original page labels, headings, filter values, notices and APIs. Upgraded readable link color to the shared deep-teal token, added 2px focus outlines to 16 links and 1 buttons and normalized 5 input/select/textarea targets where applicable. Existing shared PageHeader, EmptyState and ErrorState are retained without bespoke replacements.
- **States:** Existing access, invalid query, partial, empty, pagination and error paths are preserved; no invented records, retries or UI strings. Mobile/AT acceptance is orchestrator-owned.
- **Test/acceptance:** Named static source regression test authored; execution of typecheck/lint/unit/browser remains with orchestrator and is not represented as having run.
