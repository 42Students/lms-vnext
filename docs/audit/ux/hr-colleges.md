# UX rollout — /hr/colleges

- **Route:** src/app/(authenticated)/hr/colleges/page.tsx
- **Test:** UX-hr-colleges-01 (`tests/ux-hr-rollout-01.test.mjs`).
- **Earlier weakness:** The retired colleges alias must not create duplicate navigation or an unsafe alternative permission surface.
- **Change:** Retained the intended /hr/home redirect and route semantics. No duplicate page or altered wording.
- **States:** Existing access, invalid query, partial, empty, pagination and error paths are preserved; no invented records, retries or UI strings. Mobile/AT acceptance is orchestrator-owned.
- **Test/acceptance:** Named static source regression test authored; execution of typecheck/lint/unit/browser remains with orchestrator and is not represented as having run.
