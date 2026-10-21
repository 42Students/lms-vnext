-- Doc 20: no distributed-lock mechanism for any @Scheduled job, so every replica runs every job.
--
-- The backend runs multiple replicas. Spring's @Scheduled fires per JVM, so a job scheduled "daily
-- at 9am" runs once per replica at 9am. For the cleanup jobs that is merely wasteful — they are
-- idempotent. For the notification jobs it is not: every learner with an assignment due tomorrow
-- gets the reminder once per replica, and the scheduled-notification release broadcasts the same
-- SSE event as many times as there are pods.
--
-- ## Why a table rather than ShedLock
--
-- ShedLock is the usual answer and would be the right one. It is a new Maven dependency, and this
-- change was made against an offline build where an unavailable artifact fails the build outright.
-- A single-table lease is a small, well-understood amount of code that needs nothing new, and it
-- can be swapped for ShedLock later without touching the call sites, which only see
-- "runExclusively(name, ttl, task)".
--
-- ## Why a lease with an expiry rather than a boolean
--
-- A replica that dies holding a boolean lock holds it forever, and the job silently stops running
-- everywhere — a worse failure than the duplicate execution being fixed. locked_until means a
-- crashed holder's lock expires on its own; the TTL just has to exceed the job's expected runtime.

CREATE TABLE scheduled_job_lock (
    job_name VARCHAR(120) NOT NULL PRIMARY KEY,
    -- The lease. A row whose locked_until is in the past is free to take.
    locked_until DATETIME(6) NOT NULL,
    -- Which instance holds it, for diagnosing a job that seems not to run.
    locked_by VARCHAR(120) NULL,
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);
