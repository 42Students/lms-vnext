# UX rollout — /hr/round-results

- **Route:** `src/app/(authenticated)/hr/round-results/page.tsx`
- **Test:** `UX-hr-round-results-01` in `tests/ux-hr-rollout-03.test.mjs`.
- **Prior weakness:** 3 low-contrast old link utility usages without consistent visible keyboard focus and safe phone targets.
- **Change:** Used existing LMS deep-teal contrast-safe utility for those links and 2px keyboard focus outline on 4 actionable Link elements. Preserved the PageHeader title, invalid-filter ErrorState, EmptyState, status badges, result filters and permission scope verbatim.
- **States:** No-job empty, invalid query/error and filter-driven results still use the existing authorized server fetch and shared state components. Runtime AT/viewport acceptance is an orchestrator task.
- **Validation:** Source invariant regression test authored, not run here.
