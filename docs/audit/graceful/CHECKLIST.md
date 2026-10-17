# Graceful operation checklist (GR-xx)

Rule: a customer never sees a raw code, a stack trace, a framework screen, a database or provider message, a blank page, or an endless spinner. Every item below is built AND has a test whose name contains its GR id. Owners: **core** = chat-14 (shared layer and root screens), **e2e** = chat-15 (browser failure tests), **lane** = each lane on the pages it touches, **ops** = orchestrator (infrastructure). Evidence goes in `docs/audit/acceptance/graceful-<owner>-verification.md` as `| GR-xx | DONE / NOT-A-GAP / BLOCKED | file + test |`.

## 1. Message layer (core)
- GR-01 `friendlyApiError({status, code, network})` in `src/lib/friendly-error.ts`; domain mappers (`tpo-crm-api-error`, `tpo-messaging-api-error`, `announcement-api-error`, `bug-tracker-api-error`, `log-alert-api-error`, `tpo-recruiter-invite-api-error`) consulted first, generic fallback second.
- GR-02 Generic wording table (5xx/network/INTERNAL_ERROR, 401/session, 403, 404, 409, 400, 413 file too large, 415 wrong file type, 422, 429, 503 maintenance, 504 timeout), each a plain sentence ending in what to do next.
- GR-03 Never output text matching `^[A-Z0-9_]{6,}$`, containing "Error:", "Exception", " at ", "SELECT ", "relation ", "violates", "ECONN", "undefined", "null", "NaN", "[object": unit test over the whole table.
- GR-04 `src/lib/api-fetch.ts` `apiFetch`: JSON parse guarded, non-JSON or HTML reply treated as 5xx, network failure and AbortError handled, timeout (default 30 s, per-call override), returns/throws a friendly message plus `status`, `code`, `requestId`.
- GR-05 `requestId` (8 chars) generated per request, set as `x-request-id` response header, in every `logError` / `logInfo` line, in 5xx JSON bodies, and shown as "Reference: abcd1234" with a copy button.
- GR-06 `apiErrorResponse` (`src/lib/api-error.ts`) adds `requestId`; every module error class maps to a status AND a friendly `message` field; unknown errors never include `error.message`.
- GR-07 Zod `INVALID_REQUEST` responses are mapped to per-field messages (`fieldErrors`) so forms show errors at the field, not a banner of codes.
- GR-08 Server actions and route handlers that throw a plain `Error` are wrapped (`withApiGuard`) so nothing escapes as an unformatted 500 HTML page.
- GR-09 A unit test (a lint-style scan) fails if any `src/components` file renders `result.error`, `body.error`, `reason.message` or a string literal matching `^[A-Z][A-Z0-9_]{5,}$` into JSX or `setError` / `setNotice`.
- GR-10 Toast / inline-notice component: `role="alert"` for errors, `role="status"` for success, auto-dismiss only for success (errors persist until dismissed), dismiss button, focus not stolen.

## 2. Top-level screens (core)
- GR-11 Root client error boundary (`global-error.tsx` and `src/app/error.tsx`): friendly screen, reference id, Retry, link home, logs the error to a log endpoint with the reference id; never the Next.js overlay or "Application error: a client-side exception has occurred".
- GR-12 Stale-deploy recovery: on `ChunkLoadError` / failed dynamic import / "Loading chunk failed" / "Failed to fetch dynamically imported module": reload once automatically (a session flag prevents loops), message "A new version is available, reloading...".
- GR-13 `not-found.tsx` per area: learner, faculty, mentor, college, tpo, recruiter, admin (super admin), public; calm message and a home link for that role; unknown ids and deleted records land here.
- GR-14 Forbidden screen for 403 pages (not a redirect loop, not a blank page): "You do not have access to this page" with the role's home link.
- GR-15 Session-expired screen and flow: 401 on any page or API call leads to sign-in with `returnTo`; after sign-in the user returns to the same page; open forms keep their draft.
- GR-16 Offline banner (`navigator.onLine` plus failed request): "You appear to be offline..." removed automatically on reconnect; saves are blocked or queued with a clear message.
- GR-17 Maintenance mode: env flag `MAINTENANCE_MODE=1` renders a branded calm page (HTTP 503 with Retry-After) for everything but `/ready`; documented one-command switch.
- GR-18 Database-unreachable page: when the DB is down a request renders "Temporarily unavailable, please try again in a minute" (503), not a crash; `/ready` keeps reporting the truth.
- GR-19 `loading.tsx` present for every route segment that fetches (302 today; a script lists any missing); skeletons never flash raw `undefined`.
- GR-20 `error.tsx` present for every route segment (297 today; a script lists any missing); copy is calm and specific, with Retry.
- GR-21 Hydration mismatch and render exceptions in the browser show the GR-11 screen; the production build serves no dev overlay (verified in browser test GR-82).
- GR-22 `<noscript>` message: "Please enable JavaScript to use the LMS."
- GR-23 Unsupported-browser notice for very old browsers instead of a blank page.

## 3. Prevent the error (core builds, lanes adopt)
- GR-30 `useGuardedAction` hook: pending state, ignores double clicks and Enter-repeat, disables the control, shows the busy label ("Saving..."), re-enables on failure, never leaves a stuck pending state (timeout safety).
- GR-31 Every mutating button or form in the app uses it (63 components have pending states today; a script lists those that call a mutating `fetch` without it).
- GR-32 Conflict (409) handling: friendly text "This changed while you were working", the form keeps the user's input, and a "Refresh and re-apply" action reloads server data and re-applies local edits where possible.
- GR-33 Client validation uses the same zod schema as the server; inline field errors with `aria-describedby`; the first invalid field is focused.
- GR-34 Idempotency key on every action that sends a message, publishes, imports, issues an offer or creates a record that must not duplicate (11 files today).
- GR-35 Destructive actions (delete, remove, bulk) use a confirmation dialog (not `window.confirm`), name what will happen, and offer undo where legacy had it.
- GR-36 Disabled controls explain why (tooltip or helper text), never silently inert.
- GR-37 Dates: past/future validation messages are plain, the timezone (IST) is shown where relevant; no "Invalid Date".
- GR-38 Number, currency and empty-value formatting never prints `NaN`, `undefined`, `null` or `[object Object]`.
- GR-39 Long text and long names never break layout (truncate with title, wrap, `min-w-0`).
- GR-40 File uploads: size and type checked before upload with plain messages; progress shown; a failure keeps the selected file for retry; when storage is unavailable show "Uploads are not available right now", never an attempt that fails.

## 4. Survive the outside world (core builds, lanes adopt)
- GR-50 `src/lib/outbound.ts`: timeout, bounded retry with exponential backoff and jitter, retries only for idempotent or keyed calls, circuit-breaker note in logs; used by SMS (Exotel), email (ZeptoMail), storage (R2) and any HTTP call.
- GR-51 Failed sends go to the outbox with a visible state ("Will be retried automatically") in the UI; no provider text is ever shown.
- GR-52 DB write helper `withTransactionRetry`: retries serialization failures, deadlocks and connection resets (bounded), never retries constraint violations.
- GR-53 Login resilience: slow SMS shows "Your code is on its way" with resend (cooldown shown) and "Use email instead"; OTP errors are plain ("That code is not right. 2 attempts left.", "Too many attempts. Try again in 10 minutes.").
- GR-54 Rate-limit responses (429) include `Retry-After`; the UI shows the wait.
- GR-55 Background jobs and scheduled calls never surface to users; failures are logged with the reference id and retried.
- GR-56 Third-party links (meeting links, resume links) that fail to open show a plain note and the raw link to copy.

## 5. Never lose work (core builds, lanes adopt)
- GR-60 `useFormDraft`: long forms autosave locally (debounced), restore after a failed save, reload, back button or session expiry, clear on success; shows "Draft restored".
- GR-61 Applied to every long form: drive create/edit, job drafts, announcements/notices, campaigns, lead notes, assessment and quiz authoring, course and lesson authoring, project plans, profile sections, applications, imports.
- GR-62 Warn before leaving a page with unsaved changes (`beforeunload`), once, with plain wording.
- GR-63 Imports and bulk actions are preview-then-apply and all-or-nothing, with a per-row error report the user can download; a failed import leaves nothing half-done.
- GR-64 Exports: a failure shows a message and does not download an error file; large exports show progress or "We will email you" instead of timing out.

## 6. Degrade, do not collapse (lanes, per page)
- GR-70 Every dashboard card, table and widget is its own error boundary with a card-level failed state ("Could not load this right now. Try again.") and Retry; the rest of the page renders.
- GR-71 Every list has loading, empty, failed and filtered-empty states with plain copy ("No drives match these filters. Clear filters").
- GR-72 Partial data: if a secondary section fails, show the primary content and a notice, never a blank page.
- GR-73 Pagination and filters survive a failed fetch (state kept, Retry button).
- GR-74 Images and avatars have fallbacks (initials); broken logos never show a broken-image icon.
- GR-75 Realtime-style elements (bells, counters) fail silently and retry, never an error toast.
- GR-76 Search boxes handle failure inline.
- GR-77 Print and PDF views fall back gracefully.

## 7. Accessibility of failures (lanes)
- GR-90 Error messages use `role="alert"` and are announced; focus moves to the error summary or the first invalid field after a failed submit.
- GR-91 Retry and dismiss controls are keyboard reachable with visible focus and plain labels.
- GR-92 Color is never the only error signal; contrast meets WCAG AA; messages read well at mobile widths.

## 8. Operate (ops, orchestrator)
- GR-100 Branded fallback for load-balancer 502/503/504 (production design; the dev load balancer is shared with the legacy app, so dev gets a documented design, not a change).
- GR-101 Zero-gap deploys: 2+ replicas for college hosts, `maxUnavailable: 0`, readiness probe on `/ready`, startup probe, preStop sleep, graceful termination, PodDisruptionBudget.
- GR-102 Deploys are gated: the image must pass `/ready` and a smoke check before traffic; automatic rollback on failure; written rollback runbook in `docs/operations/`.
- GR-103 Migrations backward compatible for one release; destructive changes in two steps.
- GR-104 Alerts go to Telegram only (owner decision: no email alerts, email costs money and the owner does not read it): see section 10 (GR-111 to GR-125). The log-based metric `vnext_dev_unhandled_api_errors` stays as a backup counter; uptime is covered by the health-watch CronJob (GR-120).
- GR-105 Request-id search recipe documented for support.
- GR-106 Status page or status line documented.
- GR-107 No source maps or framework details served in production; `poweredByHeader` off (done); security headers kept.
- GR-108 Weekly review of the top 10 error references.
- GR-109 Backups and restore tested (Cloud SQL backup restored into a scratch instance) and documented.
- GR-110 Capacity: requests/limits sane, autoscaling decision recorded.

## 9. Prove it (e2e = chat-15; ops runs the suite)
- GR-80 Playwright failure-injection suite, main journeys per role: backend down (all `/api` aborted), HTML 502 reply, JSON 500, 403, 404 record, 409 conflict, 429, slow network (5 s delay), offline, stale chunk, session expired mid-form. Assertions: friendly text present, no raw code or stack anywhere in the DOM (the GR-03 regex), form input preserved, no unhandled console errors, page not blank.
- GR-81 A "no raw code in the DOM" Playwright helper reused by every journey test.
- GR-82 Production-build smoke: no dev overlay, no source maps, error screens render with a reference id.
- GR-83 Unit and integration tests for every helper (GR-01..GR-08, GR-30..GR-34, GR-50..GR-52, GR-60).

## 10. Alerts to Telegram (alerting = chat-16; parity with the old LMS, see docs/orchestrator/queues/alerting-chat-16.md)
- GR-111 Telegram notifier: Bot API sendMessage, never throws, returns boolean, plain text (no parse_mode), 3500 character cap, `[vnext dev] ` tag outside production, no Acknowledge button outside production, no-op when `TELEGRAM_ALERT_BOT_TOKEN` / `TELEGRAM_ALERT_CHAT_ID` unset.
- GR-112 Error signature (normalise then hash, per environment).
- GR-113 Redaction: no personal data, tokens, cookies, connection strings or SQL parameter values in any alert.
- GR-114 Reporter hook in `logError` and `apiErrorResponse` (async, fire-and-forget, carries `requestId`).
- GR-115 Persistence of signatures, counters, accounts and states (muted / fixed / acknowledged).
- GR-116 Alert policy: new signature alerts once, known silent, burst cap 5 per minute with a summary line, delivery-gated persistence, spike alerts.
- GR-117 Browser error reporting endpoint feeding the same pipeline.
- GR-118 Exclusive scheduled work (lease) and a protected in-cluster tick endpoint.
- GR-119 Daily digest at 09:00 IST.
- GR-120 Health watch CronJob (works when the web pods are down; alert on two consecutive failures, recovery message).
- GR-121 Deploy health check script posting to Telegram.
- GR-122 Acknowledge webhook, production only, secret-token verified.
- GR-123 Logs page parity (list, counts, mute, mark fixed, acknowledge) with old-LMS wording.
- GR-124 Safe when unconfigured, with a readiness note on the Logs page.
- GR-125 Tests for all of the above, including a fake Telegram server.
