# Gap closure for ChatGPT lanes (verified-closure protocol, 2026-10-17)

You are a builder lane (chat-N). Your queue is `docs/orchestrator/queues/gap-closure-chat-N.md` (pages with gap IDs). Goal: every gap on your pages is built AND covered by a test, with the code on your branch. The orchestrator merges your branch, runs the whole test suite, typecheck and lint, and sends back anything that fails. Work fast, but write code that compiles and tests that will pass.

## Protocol
1. Work and push ONLY on your own branch `chatgpt/chat-N-b` (create from `origin/main` if missing). Merge `origin/main` into it first every round, and again whenever you start a new page. Never push to `main`.
2. Tag every commit message `[chat-N]` and cite the gap IDs it closes (subject or body), for example `[chat-5] fix(tpo): TPO-batches-18 TPO-batches-19 add Invite and Reopen`. One commit and one push per group of related gaps. Aim for 30+ commits per reply.
3. Per page, take gaps in severity order (S1, S2, S3, S4). Read the page's audit file `docs/audit/pages/<account>/<page>.md` (and `-review.md`) for the legacy evidence and the vNext evidence of each gap. Gap statuses in your queue: OPEN (build it), FIXED-ON-MAIN (an earlier lane claimed it: read the code and VERIFY it matches the legacy evidence; fix it if wrong or partial), UNCONFIRMED (decide from the legacy copy in `docs/audit/legacy-copy-A.md` / `-B.md` and the audit; build or mark NOT-A-GAP), WRONG (audit claim was incorrect; mark NOT-A-GAP with the reason).
4. For every gap write a test whose **name contains the gap ID** (the tracker marks a gap verified only if its ID appears in a test or acceptance file and a commit on main cites it). Unit tests for pure models and exact legacy strings in `tests/unit/`; real-PostgreSQL tests in `tests/integration/` for anything that reads or writes the database, copying the pattern of an existing neighbouring test.
5. Record every gap in `docs/audit/acceptance/<account>-<page>-verification.md`: `| ID | DONE / NOT-A-GAP / BLOCKED | evidence (file path, test file and test name) |`. BLOCKED only for: private object-storage bucket or malware scanner (uploads), real provider credentials, owner sign-in on the old LMS. Everything else must be built.
6. Decisions are already made for you in `docs/audit/owner-decisions-resolved.md`. Do not ask the owner anything. UI wording must match the old LMS exactly.
7. New tables or columns: edit the Drizzle schema in `src/db/schema/` and add the SQL as `docs/proposed-migrations/<page>-<topic>.sql`. Never add numbered files under `drizzle/`; the orchestrator registers them.
8. No edits under `drizzle/`, `.github`, `package*.json`, `scripts/`, `src/auth`, `src/security`, `src/modules/storage`. `src/components/shell` belongs to chat-9 only: if you need a shell change, write one line in your queue file under "Needs shell" and move on.
9. Blocked or unclear: write ONE line in your queue file and continue with the next gap. Never stop to ask.

## Rules that broke the build before (read these)
- Code rules: `AGENTS.md`. No `any`, no `@ts-ignore`, no `eslint-disable`. Central `can()`/`requirePermission`; `isSameOriginRequest` on EVERY mutating route; GET never writes.
- React lint (the repo lints these as errors): escape quotes in JSX text (`&apos;`, `&quot;`); never call `setState` synchronously inside `useEffect` (derive during render, use a `key`, or set state in an event handler/async callback); no `Date.now()`, `new Date()`, `Math.random()` during render (compute in a server component and pass down, or use a handler/effect).
- Next.js: one slug name per dynamic path level. `[id]` and `[noticeId]` as siblings crashes the server at start (a unit test guards this).
- Types: the whole repo typechecks with zero errors and must stay that way. Check nullable columns (`string | null`), Drizzle select shapes, optional vs null, and every call site when you change a function signature or a model type (grep for all usages and update them).
- Jobs cannot be published without a future application deadline AND a pay figure; test fixtures must use `tests/support/publishable-job-terms.ts`. Drive request CTC is required. The college drives list defaults to PUBLISHED only; pass `status:"ALL"` to see all.
- Tests: never hard-code past or near-future dates (use 2099); clean up in dependency order (delete `in_app_notifications` and `activity_events` rows before users, colleges, jobs); each test file must pass on its own on a fresh database; source-grep tests must tolerate `\r?\n`.
- Strings that were not legacy wording have been rejected before. Copy exact text from `docs/audit/legacy-copy-A.md` / `-B.md` or the audit's legacy evidence.

## Per reply
Finish with a short summary: pages touched, gap IDs DONE / NOT-A-GAP / BLOCKED, gap IDs remaining, tests added, proposals written, and the latest commit sha. State plainly that tests were written but not run (you cannot run them); the orchestrator runs them.

## Throughput (added after round 1: do more gaps per reply)
- Target: at least 25 gaps resolved per reply (round 1 managed about 12 per lane). One gap should not take more than a few commits.
- Gaps marked FIXED-ON-MAIN, and wording (COPY) gaps, need verification, not new features: read the code once, and cover several gap IDs in ONE test file (one `it` per gap ID, ID in the test name) in ONE commit that cites all of those IDs. Do not make a separate commit per ID.
- Do the big features (new screens, new routes) only when a gap truly needs them, and keep each to a few commits.
- Update the page verification file in the same commit as the tests, so the evidence always matches.
- Work through the whole page list top to bottom before returning to any gap you skipped.

## Friendly errors (owner rule, 2026-10-17)
Customers must never see raw error codes, stack traces or server details. Read `docs/orchestrator/work-packages/friendly-errors.md`. chat-14 builds the shared helper (`src/lib/friendly-error.ts`, `src/lib/api-fetch.ts`) first; every lane adopts it on the pages it touches once it is on main. Until then, never render a raw code in the UI.

## Graceful operation (owner rule, 2026-10-17)
Beyond friendly messages, read `docs/orchestrator/work-packages/graceful-operation.md`: guarded double-submit, conflict handling that keeps the form, per-card error boundaries, drafts that survive failures, outbound timeouts and retries. chat-14 builds the shared helpers first (queue: graceful-chat-14.md); chat-15 writes the browser failure tests; every lane adopts the helpers on the pages it touches and meets the GR items of sections 3, 6 and 7 of `docs/audit/graceful/CHECKLIST.md` there.

## Orchestrator notes (read each round; newest last)
- 2026-10-17 15:45: ALL lane branches were merged into main (commit d80a84f96). Merge origin/main into your branch first this round, and read the two notes below if they concern you.
- chat-14: `src/components/auth/login-form.tsx` on main carries other lanes' legacy-wording work (for example "It expires in 5 minutes"); your branch's version was NOT taken in the merge. Re-apply your GR-53 login resilience (apiFetch, guarded action, friendly errors) ON TOP of main's version; do not change legacy wording. The same applies to the four `loading.tsx` / `error.tsx` files under `college/courses/offerings/[offeringId]` and `tpo/requests`: main's page-specific copy was kept.
- chat-14 and chat-16: there is now ONE `/api/client-errors` route (chat-16's: bounded body, rate limit, redaction, `browserErrorSchema` in `src/modules/log-alerts/client-report.ts`). chat-14's root error boundary must post exactly what that schema accepts (read it). Do not add a second route.
- chat-14 and chat-16: `src/lib/api-error.ts` now uses chat-14's request id (`createRequestId`, 8 characters) and its 503 for a database outage; `src/observability/logger.ts` uses the same id and calls chat-16's `reportErrorForAlert`.

## Failing unit tests (added 2026-10-17)
docs/orchestrator/unit-failures-r1.md lists the unit tests that fail on main and who owns each. Fix the ones in your area first in your next round (before new gaps), then continue the queue. Each fix commit cites the test name.

## Typecheck errors (added 2026-10-17 23:15)
docs/orchestrator/typecheck-errors.md lists tsc errors on main that block the deploy. Fix the ones in your area FIRST in your next round (restore missing schema exports, state variables, props that merge conflicts dropped), then continue your queue.

## UNCONFIRMED gaps are yours to decide (added 2026-10-17)
docs/orchestrator/queues/unconfirmed-decisions.md lists gaps that could not be confirmed from code. The owner said: decide the best behaviour yourself, do not follow the old LMS where it is wrong. Take the section for your lane, decide, implement if needed, document the decision in the acceptance file with the gap ID, add a test named with the ID. Do this after your typecheck and test fixes.
