# Graceful operation program (owner rule, 2026-10-17)

Principle: nothing that goes wrong inside the LMS may hurt the business. Users see calm, plain, actionable messages. Their work is never lost. One failing part never blanks a whole page. We find out before the customer calls. This extends `friendly-errors.md` (which stays Part A).

## A. Say it gently (friendly-errors.md)
Shared helper + `apiFetch`; no raw codes, stack traces or database text anywhere in the UI; 5xx carries a short reference id that is also in the server log.

## B. Prevent the error (owners: chat-9 builds helpers; every lane adopts on its pages)
1. Double-submit guard: a shared `useGuardedAction` (pending state, disables the control, ignores a second click, shows the busy label) used by every mutating button and form. 63 components have a pending state today; the rest need it.
2. Conflict handling: the 360 files that already send `expectedVersion` / `expectedUpdatedAt` must turn a 409 into "This changed while you were working. Your changes are kept below; refresh and apply them again." without clearing the form.
3. Client validation mirrors server validation (same zod schemas) so the user is told at the field, not after a round trip.
4. Idempotency keys on every action that sends a message, charges, imports or publishes (11 files today).

## C. Survive the outside world (owner: chat-2 for messaging, chat-9 for shared server helpers)
1. Every outbound call (SMS via Exotel, email via ZeptoMail, storage, any HTTP) gets a timeout and a bounded retry with backoff in ONE shared helper (`src/lib/outbound.ts`); today only 4 files set a timeout.
2. A send that fails after retries goes to the outbox with a visible "will retry" state; the user is told "We could not send this yet; it will be retried automatically", never a provider error.
3. Database transient failures (serialization failure, deadlock, connection reset): one retry helper for write transactions.
4. Login must stay up if SMS is slow: show "Code is on its way" with resend and an email fallback, never an infinite spinner.

## D. Never lose work (owner: lanes, per page)
1. Long forms autosave a local draft (6 files today) and restore it after a failed save, a reload or a session expiry.
2. Session expiry returns the user to the same page after sign-in (return path preserved) with the draft intact.

## E. Degrade, do not collapse (owner: lanes, per page)
1. Each card or table on a dashboard is its own error boundary: if the "Needs doing" card fails, the rest of the page renders and that card shows "Could not load this right now. Try again."
2. Every list has a loading skeleton, an empty state and a failed state (the 297 page-level error boundaries cover pages, not cards).
3. Offline / slow network banner ("You appear to be offline. Changes will not be saved until you reconnect.").
4. Downloads, exports and imports that fail say what happened and how to retry, and never leave a half-done state (imports are all-or-nothing with a preview).

## F. Know first, recover fast (owner: orchestrator, not lanes)
1. Request id on every response and log line; support can search it.
2. Cloud Logging alert: `api.unhandled_error` rate and any `severity=ERROR` burst emails the owner; uptime check on `/ready` and the login page from outside the cluster.
3. Maintenance page and a one-command switch; deploys gated on `/ready`; migrations stay backward compatible for one release so a rollback is safe; written rollback runbook in `docs/operations/`.
4. Weekly review of the top 10 error references.

## G. Prove it (owner: orchestrator + lanes)
Browser tests with failure injection (Playwright: abort a request, return 500, return 403, slow network) for the main journeys of each role, asserting the friendly text appears, no raw code appears, and the form keeps its input. Unit test per helper. A unit test that fails if any component renders a string matching `^[A-Z0-9_]{6,}$` from an API error.

## Order
1. chat-9: A helpers + B1 + C1 shared helpers (first, small, on main fast).
2. All lanes: adopt A, B1, B2 on the pages they touch; add E1 for dashboard cards.
3. Orchestrator: F1 to F3 and G (browser tests) in parallel.
