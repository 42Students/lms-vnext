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
2. Telegram alerts (no email: owner decision): new error signatures, spikes, a daily digest and a health watch, built by chat-16 (queue alerting-chat-16.md, GR-111 to GR-125).
3. Maintenance page and a one-command switch; deploys gated on `/ready`; migrations stay backward compatible for one release so a rollback is safe; written rollback runbook in `docs/operations/`.
4. Weekly review of the top 10 error references.

## G. Prove it (owner: orchestrator + lanes)
Browser tests with failure injection (Playwright: abort a request, return 500, return 403, slow network) for the main journeys of each role, asserting the friendly text appears, no raw code appears, and the form keeps its input. Unit test per helper. A unit test that fails if any component renders a string matching `^[A-Z0-9_]{6,}$` from an API error.

## Order
1. chat-14: A helpers + B1 + C1 shared helpers (first, small, on main fast); chat-15 writes the browser failure tests (checklist docs/audit/graceful/CHECKLIST.md, GR-80..83).
2. All lanes: adopt A, B1, B2 on the pages they touch; add E1 for dashboard cards.
3. Orchestrator: F1 to F3 and G (browser tests) in parallel.

## H. The edges outside the page code (what else can show an ugly screen)
Found by audit on 2026-10-17; each item has an owner.
1. **Load balancer error pages** (orchestrator): when the app is down, restarting, or too slow, the Google load balancer shows its own plain "502 Server Error" / "503" / "504" page. Add a branded static fallback served by a tiny default backend (or a Cloud Armor/LB custom error response) with the same calm wording: "We are making a quick update. Please try again in a minute." plus the support contact. No custom error pages exist today.
2. **Deploys without a gap** (orchestrator): rolling update with `maxUnavailable: 0`, readiness probe on `/ready`, at least 2 replicas for the college hosts before go-live, so a deploy or a crashed pod never reaches users. (Today dev runs 1 replica; the new image crashing at start would have been a full outage.)
3. **Database or provider down** (chat-9 shared + orchestrator): `/ready` already reports the database; add a calm "Temporarily unavailable, please retry in a minute" page when the database is unreachable instead of a crash, and make login degrade (message, resend, email fallback).
4. **HTML where JSON was expected** (chat-9 helper, all lanes): 160 `response.json()` calls have no guard; when a proxy returns an HTML 502 the user sees "Unexpected token '<'". `apiFetch` must treat non-JSON as a 5xx and return the friendly text; replace the bare calls.
5. **Stale code after a deploy** (chat-9): users with an open tab hit ChunkLoadError / "client-side exception" when files change. Handle it once in a root client boundary: on ChunkLoadError or a failed dynamic import, reload the page once automatically (guard against loops), with "A new version is available, reloading..." Only one file mentions chunk errors today.
6. **Blank or half pages** (lanes): every route segment has `loading.tsx` (302 exist) and `error.tsx` (297); a route that lacks either must get one; cards inside get their own boundary (part E).
7. **404 and unknown links** (chat-9): only 4 `not-found.tsx` files; add one per area (learner, college, tpo, recruiter, admin, public) with a calm message and a link back to that role's home. Deleted or unknown ids render this, never "Application error".
8. **Downloads and exports** (lanes): a failed CSV/PDF/ZIP must not download a file containing JSON error text; the button shows the friendly message instead.
9. **Rate limits and lockouts** (lanes): 429 and OTP lockout messages are plain and say how long to wait.
10. **Hydration and rendering exceptions in the browser** (chat-9): root client error boundary reports to our log endpoint with the reference id and shows the friendly screen, never a Next.js overlay (production builds already hide stack traces; verify with a production build in the browser tests).
11. **Source maps and headers** (orchestrator): confirm production serves no source maps and no framework error details (`poweredByHeader: false` is set); add to the security check.
12. **Browser tests proving all of the above** (orchestrator, part G): kill the backend, return HTML 502, return 500 JSON, delete a record then open its link, stale chunk, offline, slow network, and assert the user sees the calm text with no code or stack.

## Checklist
The exhaustive numbered list (GR-01 to GR-110) is `docs/audit/graceful/CHECKLIST.md`; it supersedes the summaries above where they differ.
