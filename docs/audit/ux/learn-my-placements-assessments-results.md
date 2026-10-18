# UX review — /learn/my-placements/assessments/results

- Source: `src/app/(authenticated)/learn/my-placements/assessments/results/page.tsx`.
- Source finding / fix: Contrast-safe teal text links; 44px interactive targets; Small-screen min-width containment.
- Retained: Actual learner schedule, assignment, result, application, offer and registration states; no client-fabricated attendance or outcomes. Existing `loading.tsx` and `error.tsx` boundaries keep recovery in shared UI.
- Phone/AT: Corrected where necessary for 320px overflow, colour contrast and 44px touch targets. Native focus controls and route-safe links kept.
- Legacy labels, actions, permission checks, and query parameters preserved.
- Test: `tests/unit/ux-learn-chat7-batch-03.test.ts`, `UX-learn-learn-my-placements-assessments-results-01`.
- Pending: orchestrator automated checks, browser and screen-reader evidence.
