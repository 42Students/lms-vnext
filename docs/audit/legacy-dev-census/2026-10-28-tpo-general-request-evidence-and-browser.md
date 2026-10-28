# TPO general-request evidence/history and executable browser queue contract — 2026-10-28

The legacy placement-cell request history displays Asked and Decided on timestamps. The vNext nested “Other student requests” panel showed only the status and decision note, so reviewers could not establish the age of a particular approval, rejection or pending request from the row.

- Added requested and decided timestamps with explicit `Asia/Kolkata` rendering and machine-readable `dateTime` values. A decision note is whitespace-preserving and wraps safely.
- Secure HTTPS proof links now open in a new tab with `rel="noopener noreferrer"` and `referrerPolicy="no-referrer"`. Validation in the existing review-facts model still blocks non-HTTPS, credential-bearing and unsafe proof URLs.
- Added `tests/e2e/tpo-general-requests-queue.spec.ts` for actual role-authenticated API limits, private cache headers, invalid selectors, nested review panel navigation, server-filter responses and learner denial. It is **read-only**, neither simulates writes nor fabricates pending requests. It requires an authorized disposable TPO/learner seed and the staged DB table; full decision effects remain a separate acceptance gate.

Pending: run browser acceptance, database multi-college high-volume queue tests, decision race/notification tests and physical mobile UX. Do not change the official tracker based on source assertions alone.
