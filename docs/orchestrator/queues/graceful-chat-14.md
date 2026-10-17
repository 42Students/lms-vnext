# Graceful operation queue: chat-14 (core layer)

You own the shared graceful layer and the top-level screens. Read first, on origin/main: `AGENTS.md`, `docs/orchestrator/briefs/gap-closure-lane.md` (protocol and the list of rules that broke the build before), `docs/orchestrator/work-packages/graceful-operation.md` and `docs/audit/graceful/CHECKLIST.md`. Branch `chatgpt/chat-14-b` (merge origin/main first). Tag commits `[chat-14]`, cite the GR ids in every commit, test names contain the GR id, push after each group. You cannot run tests; the orchestrator does. Record each item in `docs/audit/acceptance/graceful-core-verification.md` (`| GR-xx | DONE / NOT-A-GAP / BLOCKED | file + test |`).

Ship in this order, and merge-ready quickly because every other lane waits for the helpers:

1. FIRST (small, make them importable and stable): GR-01, GR-02, GR-03, GR-04, GR-05, GR-06, GR-07, GR-08, GR-10, GR-30, GR-32, GR-33, GR-34, GR-50, GR-52, GR-60 (the helpers: `src/lib/friendly-error.ts`, `src/lib/api-fetch.ts`, request id, `withApiGuard`, notice component, `useGuardedAction`, conflict helper, `useFormDraft`, `src/lib/outbound.ts`, `withTransactionRetry`). Keep exported names stable; write a short usage block at the top of each file.
2. Top-level screens: GR-11, GR-12, GR-13 (one `not-found.tsx` per area), GR-14, GR-15, GR-16, GR-17, GR-18, GR-22, GR-23.
3. Then GR-09 (the scan test that fails on raw codes in components; start it allow-listing existing offenders in a list file that shrinks as lanes adopt), GR-19 and GR-20 (scripts that list route segments missing `loading.tsx` or `error.tsx`; add the missing files), GR-31 (script listing mutating components without the guard), GR-35, GR-36, GR-37, GR-38, GR-39, GR-40, GR-51, GR-53, GR-54, GR-55, GR-56, GR-62, GR-63, GR-64.
4. Adoption you do yourself on shared surfaces: login and OTP screens (GR-53), the shell topbar and sidebar failure states, and every shared component under `src/components/ui`.

Shell note: `src/components/shell` belongs to chat-9. Where a GR item needs a shell change, make the helper, then write one line under "Needs shell" in `docs/orchestrator/queues/gap-closure-chat-9.md`'s sibling note file `docs/orchestrator/queues/graceful-needs-shell.md` and move on.

## Notes (blockers, one line each)

- GR-51: provider-side automatic resend awaits verified delivery idempotency guarantees and real provider acceptance; existing receipts persist QUEUED/FAILED but unacknowledged sends must not be retried blindly.
