# Gap-fix proof log — lane chat-5

## In progress: `docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md`

- Verified already on main (not credited as this lane's new implementation): `drizzle/0133_lanes_round_1.sql` creates `scheduled_job_leases`; `src/modules/operations/postgres-scheduled-job-lease-store.ts` implements atomic DB-time claim, unexpired holder/fence renewal, and current-holder verification. P0 rows G2-5-032-057/064 must still pass the prescribed concurrent DB test before release.
- Code authored: named legacy TPO cadence registry (all ten names, IST cron and lease durations), a fail-closed POST-only offer-expiry worker with the existing Postgres fencing store and bounded transactional batches, plus a gated dev CronJob manifest. Relevant partial rows: G2-5-032-003, -006, -008, -021, -030, -033, -052, -063.
- Not declared fixed: the rest of the 51 open rows; seven of the ten TPO jobs remain explicitly `wired: false`, notifications/provider dispatch and durable per-batch metrics are not implemented, and no production trigger or live verification is claimed.
- Queue checkbox intentionally stays unticked; the document is not complete. No typecheck, test suite, CI, cluster apply, or database execution was run.
- New files: `src/modules/operations/tpo-scheduled-job-registry.ts`, `src/modules/operations/tpo-offer-expiry-worker.ts`, `src/app/api/internal/placements/tpo/offer-expiry/run/route.ts`, `deploy/k8s/dev/placement-offer-expiry.yaml`.

### Additional partial wiring

- `tpo.escalateWithdrawals` now claims its 12-minute Postgres lease before running the existing 24-hour-window escalation, with a dev 15-minute trigger.
- `tpo.deliverDueNotices` now claims a separate 50-second lease before its existing 30-second undo-hold publisher and returns HTTP 503 when storage is not ready; a dev one-minute trigger is staged.
- Neither manifest has been applied; all other scheduled job gaps and runtime verification remain open.

### Read-only operator lease inspection (partial)

- `GET /api/internal/placements/tpo/scheduler-status` is protected by the TPO scheduler secret and returns each canonical job's cadence, handler-wired flag, active/expired/never-claimed lease and fence from PostgreSQL; DB outage returns 503. This is partial progress on G2-5-032-005/-007/-011/-027.
- It deliberately reports `lastSuccessfulRunAt: null` and `outcomesTracked: false` because durable run/outcome history has not been implemented. A claimed lease is **not** evidence of successful dispatch.
- New files: `src/modules/operations/tpo-scheduled-job-health.ts`, `src/app/api/internal/placements/tpo/scheduler-status/route.ts`.

### Recruiter digest scheduler (partial)

- Existing same-origin plus 32-byte bearer authentication is retained. The message-digest worker now claims `tpo.recruiterMessageEmails` for four minutes before its tenant-scoped, unread-only send service; a five-minute dev CronJob supplies an Origin matching the in-cluster host. Relevant partial rows G2-5-032-020/-062.
- The source service's own provider and state checks remain authoritative. Warmup at 90 seconds after startup, durable message-provider acceptance reconciliation, and real deployment checks remain incomplete; do not tick the document.
- Existing withdrawal, notice and recruiter endpoint response bodies remain unchanged on a successful run; lease contention returns an explicit `skipped` result.

### Deployment/production gate

- Added `docs/operations/tpo-scheduled-jobs-dev.md` with ten-job schedule inventory, explicit missing handlers, dev-secret and actor requirements, unchanged unsafe deployment gates, and a production **NOT READY** release hold (G2-5-032-068, -063). This documents the hold; it does not itself finish the missing implementation or verification rows.
