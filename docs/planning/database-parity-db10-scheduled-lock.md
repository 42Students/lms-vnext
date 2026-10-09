# DB10 Scheduled-Job Lease — Legacy Contract and Mainline Progress

**Ownership:** DB10 Shared Operations · **Branch:** main · **Status:** source-reviewed + pure policy staged, NOT migrated or connected.

Legacy reference: 42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5
- src/main/resources/db/migration/V135__scheduled_job_lock.sql
- src/main/java/com/_42students/lms/service/SchedulerLockService.java
- src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java

## Legacy invariants and product purpose

The legacy table has four fields: job_name (varchar(120) PK), locked_until (datetime microseconds), locked_by (nullable diagnostic worker), updated_at (automatic update timestamp).

SchedulerLockService acquires a lease by conditional UPDATE when expired and INSERT IGNORE on first use. The lock is never released on normal completion, deliberately ensuring that replicas running the same tick do not duplicate a job. A stopped process eventually loses the lock after TTL. NotificationSchedulerService uses it for scheduled notification release, old notification cleanup, assignment and interview reminders.

**Confirmed legacy risks requiring explicit improvement:**
- Legacy implementation fails open if JDBC is unavailable. That can trigger duplicate sends when multiple replicas are active.
- Its lease has no fencing token; an old worker still running after expiry can perform side effects concurrently with the new owner.
- Long-running tasks may exceed lease TTL; a TTL alone is not an exactly-once guarantee.
- Legacy wall clocks can differ between replicas; database time should determine lease expiry.
- The scheduler's per-user sends need durable message/outbox idempotency in addition to leader election.

## Current staged vNext main implementation

\`src/modules/operations/scheduled-job-lease.ts\` contains pure claim, expiry, renewal and fencing-token checks. The lease cannot be actively released by an arbitrary worker. It returns a proposal only; **it does not acquire database locks or coordinate replicas**.

\`tests/unit/scheduled-job-lease.test.ts\` covers initial lease, collision, expiry takeover, stale-holder fencing, renewal, and invalid input. Tests are authored, **not observed as passing** because CI is failing without usable job logs.

DB10 ledger now has 62 source-reviewed fields: 58 tracker fields + 4 scheduled-job fields. All 221 DB10 source fields remain UNMAPPED, and 0 are semantically database-verified.

## Migration and integration contract (NOT EXECUTED)

Do not edit the shared \`drizzle/meta/_journal.json\` while other DB owners are authoring migrations. Once ownership is serialized, add a PostgreSQL table with these legacy fields plus a **non-null monotonically incrementing fencing token**. Preserve lock name, current holder, expiry and updated timestamp.

Proposed SQL shape (review only, not migration):

\`\`\`sql
CREATE TABLE scheduled_job_leases (
  job_name varchar(120) PRIMARY KEY,
  locked_until timestamptz NOT NULL,
  locked_by varchar(120) NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  fence bigint NOT NULL DEFAULT 1 CHECK (fence > 0)
);
\`\`\`

A real acquisition must be a **single atomic INSERT ... ON CONFLICT DO UPDATE** that only wins when the row is expired relative to \`clock_timestamp()\`, returning the new \`fence\` and current \`locked_until\`. Renewal must use \`WHERE job_name = ... AND locked_by = ... AND fence = ... AND locked_until > clock_timestamp()\`. Do not treat the pure JS proposal as a replacement for an SQL compare-and-swap.

For side effects, use an outbox/delivery idempotency key (for example recipient + message kind + scheduled slot) and validate the fencing token on each transactional send, rather than assuming a lease guarantees exactly-once. On database lock failures for non-idempotent notifications, fail closed, surface alert, and retry when durable storage recovers.

## Verification gates

- [x] Inspect V135 and legacy SchedulerLockService/NotificationSchedulerService.
- [x] Account for all four legacy source columns in DB10 source-review ledger (not verified).
- [x] Author pure lease ownership, expiry/fencing policy on main.
- [x] Author adversarial unit tests on main.
- [ ] Run TypeScript lint/build/Vitest.
- [ ] Coordinate migration journal and create PostgreSQL schema plus generated snapshots.
- [ ] Prove same-name concurrent claims yield exactly one winner using separate DB connections.
- [ ] Prove safe crash takeover and same-worker duplicate tick behavior.
- [ ] Prove old holder cannot emit after losing fence, even if it exceeds lease TTL.
- [ ] Prove notification delivery is idempotent and no duplicate SSE/recipient messages.
- [ ] Prove database lock outage is fail-closed for non-idempotent sends with observable error reporting.
- [ ] Prove per-account scope and retention where applicable.

The current implementation is staged-only and intentionally should not be mistaken for a production-ready distributed lock.
