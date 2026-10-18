# UX rollout — /hr/placements/jobs/[jobId]

- **Route:** src/app/(authenticated)/hr/placements/jobs/[jobId]/page.tsx
- **Test:** UX-hr-placements-jobs-jobId-01 (`tests/ux-hr-rollout-02.test.mjs`).
- **Initial weakness:** 0 low-contrast `text-primary-text` utility occurrences and missing keyboard-visible link/button focus; some independent native fields used small phone text.
- **Change:** Preserved all words, exact status names, API permissions and server reads/writes. Updated to readable deep-teal link utility, consistent 2px keyboard focus outlines on 29 links and 1 buttons, and 44px targets/phone input typography on 0 native fields. Kept shared page and state primitives and original guarded workflows.
- **States:** Original authentication, no-access, invalid query, empty/loading, conflict and pagination handling is unchanged; no new implied server behavior. Capture/AT remains orchestrator-owned.
- **Validation:** Named source invariant regression test authored; no local npm typecheck, lint, browser or device execution claimed.

## Recruiter applicant private-state cross-audit

- HR-BREAK-PRIVATE-RATING-36: Private applicant ratings and notes now remount per job+application to avoid disclosing the previous focused candidate's draft or optimistic token when the client slot is reused. Regression: `tests/unit/HR-BREAK-chat19-private-rating-scope.test.tsx`.
- HR-BREAK-ROUND-RECEIPT-31 and UX-HR-ROUND-UNSAVED-32: Inline round edits confirm persisted action and preserve dirty forms on accidental close. Existing wording is unchanged.
- Candidate transitions, latency, stale saves and focus remain browser acceptance gates.
