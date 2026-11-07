# SEC-16 background jobs, queues and internal services: assessment (2026-11-08)

Method: code read of `src/security/internal-route-core.ts`, `internal-route.ts`, the eight `src/app/api/internal/*` routes, CronJobs on dev. Nothing run for this document.

| Control area | Finding | Proposed state |
|---|---|---|
| Authentication of machine callers | Every internal route goes through `internalRoute()`: browser `Origin` refused, query string refused, one named secret per route compared in constant time (`timingSafeEqual`), 32 to 256 bytes, no whitespace; a missing or short server secret denies every call; denial never says which check failed; all responses `no-store` | IMPLEMENTED_UNVERIFIED |
| Secrets exist | Registry covers the eight scheduler/worker secrets (`INTERNAL_ALERT_TICK_SECRET`, `NOTIFICATION_RELEASE_TOKEN`, `TPO_*_SCHEDULER_SECRET`, `DB10_NOTIFICATION_SCHEDULER_SECRET`, `RECRUITER_MESSAGE_WORKER_SECRET`, `MENTOR_PROJECT_EMAIL_WORKER_TOKEN`, `AUDIT_FINDINGS_CRON_SECRET`, `PRIVATE_STORAGE_SCANNER_WEBHOOK_SECRET`); dev now has all of them (2026-11-08); production readiness fails if one is missing | IMPLEMENTED_UNVERIFIED |
| Scope of work | Jobs run in a named system scope (not narrowed by RLS by design) and take `college_id` from the rows they process; no job accepts a college id from the caller (query strings are refused, bodies are schema-bound) | PARTIAL (per-job review of the eight services still owed) |
| Audit | Denials are logged and, from 2026-11-08, also written to `security_audit_events` (`internal.denied`, reason code, route name, never the credential). Successful runs are not recorded individually (high volume) | PARTIAL |
| Replay and rotation | No timestamp or nonce on machine calls (a captured request replays); one secret per route, no overlap window for rotation | GAP: add signed timestamp or accept two secrets during rotation |
| Isolation of the callers | Nothing on dev currently calls these routes (no CronJob uses them, only `vnext-auth-purge` exists and it uses the database directly); network reachability is cluster-internal plus the public ingress, so the routes are reachable from the internet and protected only by the secret | PARTIAL: restrict the paths at the ingress or add a source check |
| Queues and idempotency | Outbound email/notification dispatch uses delivery keys with a shared claim store (fails closed when the store is on) | IMPLEMENTED_UNVERIFIED |

Owner decisions flagged: whether internal paths should be blocked at the ingress for the public internet (needs ingress change).
