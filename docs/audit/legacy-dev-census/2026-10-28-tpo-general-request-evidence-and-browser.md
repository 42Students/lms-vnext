# TPO general-request evidence/history and executable browser queue contract — 2026-10-28

The legacy placement-cell request history displays Asked and Decided on timestamps. The vNext nested “Other student requests” panel showed only the status and decision note, so reviewers could not establish the age of a particular approval, rejection or pending request from the row.

- Added requested and decided timestamps with explicit `Asia/Kolkata` rendering and machine-readable `dateTime` values. A decision note is whitespace-preserving and wraps safely.
- Secure HTTPS proof links now open in a new tab with `rel="noopener noreferrer"` and `referrerPolicy="no-referrer"`. Validation in the existing review-facts model still blocks non-HTTPS, credential-bearing and unsafe proof URLs.
- Added `tests/e2e/tpo-general-requests-queue.spec.ts` for actual role-authenticated API limits, private cache headers, invalid selectors, nested review panel navigation, server-filter responses and learner denial. It is **read-only**, neither simulates writes nor fabricates pending requests. It requires an authorized disposable TPO/learner seed and the staged DB table; full decision effects remain a separate acceptance gate.

Pending: run browser acceptance, database multi-college high-volume queue tests, decision race/notification tests and physical mobile UX. Do not change the official tracker based on source assertions alone.

## Learner personal general-request history paging — source implementation, acceptance pending

The learner's personal general-request component formerly received the newest 100 rows from `listOwnTpoGeneralRequests` without indicating that older decisions were hidden. It now requests 20 rows per page, uses a bounded validated `page`/`pageSize` contract, shows the true scoped total and page controls, and offers an explicit retry when history cannot load. The new reader applies the same learner membership and college predicates to both count and page queries, with stable requested-at/ID ordering. Submission returns the history to page 1. The older 100-row reader remains in the separate unified support-request service, whose cross-kind pagination must be addressed independently.

The changes are **not** marked Green by source review. Verify an authenticated disposable learner with more than 100 general requests, cross-tenant and other-learner denial, stale page after deletion, request post/refresh, and browser previous/next/retry behavior. CI unit/source coverage is separately authored; PostgreSQL and browser acceptance on the exact new SHA remain required.

- Added authenticated Playwright personal-history coverage for bounded first/second pages, scoped learner view, private cache headers, invalid or repeated filter rejection and TPO denial. This test checks actual API responses and never invents general-request rows. A 100+ row seeded learner remains necessary to prove high-volume navigation, and the Browser workflow must execute successfully before acceptance is claimed.

- Added a disposable PostgreSQL 105-request learner-history test using
  distinct pending target identities. The exact college/member-scoped
  paginated service must return all 105 unique records across six pages,
  a true matching total and an empty seventh page; this exercises the
  original 100-row truncation boundary without inventing users or
  bypassing the real dedupe constraint. Execution remains subject to
  the queued CI database suite.

## 2026-10-28 unified learner history and dispute acceptance follow-up

- `25b42cf` replaces the separately capped `listOwnTpoGeneralRequests` contribution to `/learn/my-placements/support` with a single SQL UNION feed. The count and filtered page share one PostgreSQL statement and one learner membership/college authorization boundary; the server now transfers only up to 200 matching rows (default 20) regardless of history size. A missing staged general-requests table is omitted from the query, not referenced.
- The disposable `placements-p8-offers` PostgreSQL acceptance suite covers 105 general requests plus a real specialized placement request in the same feed, category/status filters, page clamp, stable order, source-specific fields and role denial. It also exercises a pending dispute reviewed after the provisional deadline, ensuring the maturity worker cannot finalize before a TPO decision, and refuses newly filed late disputes.
- These are authored tests pending a current-main green CI/database result. No page is accepted, no DB tracker task is changed and no production migration is added by this follow-up.

### Absence-dispute transaction test coverage (2026-10-28)
- Added disposable PostgreSQL tests to the registered P8 suite that establish an actual `ABSENT` round-attendance row, submit the learner's typed dispute, approve as a persisted authorized TPO, and require `PRESENT` plus decision status, append-only request events, activity audit, learner notification, and stale repeat protection.
- A second scenario changes attendance to `PRESENT` before TPO approval and requires the approval to fail `TARGET_CHANGED` without falsifying the pending request or duplicating an audit effect. Source-test coverage alone was insufficient for this distinction.
- Both tests are authored only pending CI/PostgreSQL acceptance at the exact new HEAD. No new Green or tracker changes.
