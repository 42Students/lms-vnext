# UX rollout — /college-join/[token]

- Scope: college token route, `src/components/placements/public-recruiter-join-form.tsx`, `public-join-preview-retry.tsx`. Source test `UX-college-join-01`.
- Before: the shared recruiter join form used custom narrow focus styling and bespoke buttons, and async errors did not receive keyboard focus. A fast repeat action could race with React state.
- Changes: shared Card/Input/Button/InlineNotice, ≥44px targets, single-column min-h-dvh public layout, mobile-width submit actions, focus moved to a polite, safe inline error, synchronous pendingRef guard to suppress duplicate OTP requests and joins without clearing inputs, readable shared Retry card. Existing labels, 6-digit verification, college scope and readiness checks unchanged.
- States: expired/invalid preview, transient preview retry, verification unavailable, sent-code, already-joined, success and transport-error copy preserved.
- Test: `tests/unit/UX-college-join-01.test.ts` authored; not executed. Checklist remains unticked until CI/device validation.
