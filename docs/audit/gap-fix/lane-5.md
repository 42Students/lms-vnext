# Gap-fix proof log — lane chat-5

## In progress: `docs/audit/gap2/lane-5/u032-cross05-scheduled-jobs.md`

- Verified already on main (not credited as this lane's new implementation): `drizzle/0133_lanes_round_1.sql` creates `scheduled_job_leases`; `src/modules/operations/postgres-scheduled-job-lease-store.ts` implements atomic DB-time claim, unexpired holder/fence renewal, and current-holder verification. P0 rows G2-5-032-057/064 must still pass the prescribed concurrent DB test before release.
- Code authored: named legacy TPO cadence registry (all ten names, IST cron and lease durations), a fail-closed POST-only offer-expiry worker with the existing Postgres fencing store and bounded transactional batches, plus a gated dev CronJob manifest. Relevant partial rows: G2-5-032-003, -006, -008, -021, -030, -033, -052, -063.
- Not declared fixed: the rest of the 51 open rows; the other nine TPO jobs are explicitly `wired: false`, notifications/provider dispatch and durable per-batch metrics are not implemented, and no production trigger or live verification is claimed.
- Queue checkbox intentionally stays unticked; the document is not complete. No typecheck, test suite, CI, cluster apply, or database execution was run.
- New files: `src/modules/operations/tpo-scheduled-job-registry.ts`, `src/modules/operations/tpo-offer-expiry-worker.ts`, `src/app/api/internal/placements/tpo/offer-expiry/run/route.ts`, `deploy/k8s/dev/placement-offer-expiry.yaml`.
