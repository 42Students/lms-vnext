# SEC-16 background jobs and machine routes: review (2026-11-08)

Method: code read of `src/security/internal-route-core.ts`, `internal-route.ts`, the 16 routes under `src/app/api/internal/`, `src/modules/operations/scheduled-job-runner.ts`, `outbound-dispatch-runner.ts`, `outbound-delivery-queue.ts`, the notice and notification delivery services; replay and rotation behaviour covered by `tests/unit/sec16-internal-replay.test.ts` and `internal-route-core.test.ts`. Nothing here is VERIFIED.

| Question | Finding |
|---|---|
| How does a machine caller prove itself? | `internalRoute()`: browser Origin refused, query string refused, one named secret per route (32 to 256 bytes, constant-time compare, no whitespace); `<NAME>_PREVIOUS` accepted during rotation; optional `x-lms-timestamp` plus one-time `x-lms-nonce` when `INTERNAL_REPLAY_PROTECTION=on`. A missing or short server secret denies every call and the denial never says which check failed. |
| Whose authority do jobs run with? | A named system scope (`internal:<route name>`), never a Super Admin identity. The scope lets a job read across colleges by design; it carries no user. |
| Where does the tenant come from? | From the rows the job processes (each row has its own `college_id` and `organization_id`). Routes accept no query string and strict, size-bounded bodies or none; no route takes a college id from the caller. |
| Duplicate or replayed runs | Scheduled jobs go through `executeScheduledJobWithLease`: an atomic lease with a fencing number, checked before side effects (`assertCurrent`), so a second worker or a repeated call does nothing while the lease is held. Deliveries use idempotency keys derived from recipient and source event and a claim in the shared store that fails closed. Inbound mail is idempotent by provider message id. |
| Is authorization re-checked when delayed work runs? | Outbound messages: `db10_check_outbound_pre_send` verifies the lease fence, expiry and suppression inside the database immediately before the provider call; the worker principal is verified first (`requireOutboundDispatchPrincipal`). Notices and notifications read membership and status when they build recipients. The sealed payload is bound to its hashes with AES-256-GCM additional data, so a changed payload or a substituted tenant fails to open. |
| Failures | Unknown provider outcomes stay CLAIMED for reconciliation rather than retrying blindly; only definitely-unsent errors retry; provider text never reaches callers; denials write `internal.denied` without the credential. |
| Logs and dashboards | No payload is logged (structured events carry ids and codes). There is no job dashboard. |
| Manual triggering | Only a holder of the route's secret; no operator UI exists. |
| Reprocessing | There is no reprocessing tool; any use of a route is a normal call with the secret and is audited if denied. |

Residual risk, accepted: all jobs share the web application's database login (SEC-07-001, owner decision) and the same pod identity; the internal routes are reachable from the internet behind their secrets (blocking `/api/internal/*` at the ingress is an owner action).
