# UX review — /learn/my-placements/jobs/[jobId]

- Source: `src/app/(authenticated)/learn/my-placements/jobs/[jobId]/page.tsx`.
- Source finding / fix: Audited existing shared UX states and copy; no redundant layout inserted.
- Retained: Actual learner schedule, assignment, result, application, offer and registration states; no client-fabricated attendance or outcomes. Existing `loading.tsx` and `error.tsx` boundaries keep recovery in shared UI.
- Phone/AT: Corrected where necessary for 320px overflow, colour contrast and 44px touch targets. Native focus controls and route-safe links kept.
- Legacy labels, actions, permission checks, and query parameters preserved.
- Test: `tests/unit/ux-learn-chat7-batch-03.test.ts`, `UX-learn-learn-my-placements-jobs-jobId-01`.
- Pending: orchestrator automated checks, browser and screen-reader evidence.
