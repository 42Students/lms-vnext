# DB10: Scheduled-job runner handoff (main)

**Main-branch work.** Source behavior: legacy
\`lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5\`:
\`V135__scheduled_job_lock.sql\` + \`SchedulerLockService.java\`.
The old JVM scheduled jobs used a DB lease to reduce duplicate notifications across replicas. It **fails open** if the database is unavailable, deliberately allows the lease to expire instead of releasing early, and uses no fencing token.

## Code now on main

- \`src/modules/operations/scheduled-job-lease.ts\`: existing pure DB10 domain model (another parallel chat). This is the source of truth for job name, holder, lease expiry and a monotonically advancing integer fence.
- \`src/modules/operations/scheduled-job-runner.ts\`: fail-closed executor added here, reusing that shared lease type rather than introducing another lease model. It prevents the work callback from starting unless a storage-backed claim was acquired and verified; exposes \`assertCurrent()\` and \`renew()\` so long-running work can detect lost leases. It never releases eagerly.
- \`tests/unit/scheduled-job-runner.test.ts\`: tests for acquisition success, competing worker skip, DB unavailable fail-closed, expired/stolen owner, missing renewal, changed fence, dangerous input, malformed grant and task failures.

**PRODUCTION SCHEDULER PARITY BLOCKED (P0 G2-5-032-068):** Until the PostgreSQL lease adapter, registered migrations, live scheduler triggers, durable delivery outbox and idempotent send path are wired and verified, no production reminder parity or live scheduling capability may be claimed. This is a blocking integration requirement, not a working scheduled job.\n\n**NOT A COMPLETE DISTRIBUTED LOCK YET:** The PostgreSQL adapter, lease schema/migration, job scheduler binding, durable notification outbox, and production delivery idempotency are still unimplemented. The runner is an interface contract. It has no effect on live scheduled jobs until those components are wired and executed against a disposable PostgreSQL instance. Do not count DB10 \`scheduled_job_lock\` field semantics as DB_TESTED.

## Privacy and behavioral parity decision

The legacy lock's *fail-open* behavior prioritized delivery over duplication. For vNext customer-facing reminders, executing every replica during DB outage creates duplicate/unauditable side effects; the new executor intentionally **fails closed** and must surface the skip/error in operational alerts. This is a **documented safety deviation**, not accidental parity. Reconcile with product requirements before broad scheduler integration.

## DB store contract

One authoritative PostgreSQL statement/transaction must conditionally claim only expired leases, atomically increment the per-job fence, and return a uniquely owned grant with database-derived expiry. On busy lock, return \`null\`. On database failure, **throw**, never treat it as a free lease. Renew must compare job name, holder, fence, and unexpired TTL together. All effectful sends must enforce the persisted fence or a durable idempotency key so a stale worker cannot dispatch after lease transfer. Avoid early release to prevent repeating the same tick after a faster worker completes.

## Verification gates

1. Run TypeScript typecheck, ESLint and Vitest unit tests (both existing \`scheduled-job-lease.test.ts\` and new runner test).
2. Coordinate shared Drizzle migration ownership; do not independently edit the migration journal while parallel DB03/DB04 work remains.
3. Add disposable PostgreSQL concurrency cases: simultaneous first claim, simultaneous expired renewal, crashing worker, acquisition outage, stale fence failure, long task renewal, retry after expired lease.
4. Connect a real reminder scheduler and a durable recipient-idempotent outbox. Verify two replicas produce one eligible delivery, rather than only one callback invocation.
5. Update \`database-parity-db10-field-ledger.json\` with source writers/readers and runtime evidence. No field may be marked verified on source inspection alone.

**Current verification:** code and tests authored on main; execution not observed. Main CI has been reporting failed runs without exposed job-step logs. This file is an integration handoff, not a release-ready claim.
