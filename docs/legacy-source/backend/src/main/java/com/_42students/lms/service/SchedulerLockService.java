package com._42students.lms.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * Doc 20: runs a scheduled job on exactly one replica.
 *
 * <p>The backend runs multiple replicas and Spring's {@code @Scheduled} fires per JVM, so a job
 * scheduled "daily at 9am" runs once per replica. For the cleanup jobs that is only wasteful — they
 * are idempotent. For the notification jobs it is not: every learner with an assignment due
 * tomorrow gets the reminder once per replica, and the scheduled-notification release broadcasts
 * the same SSE event once per pod.
 *
 * <p>The lock is a lease with an expiry rather than a boolean. A replica that dies holding a
 * boolean lock holds it forever and the job silently stops running everywhere — a worse failure
 * than the duplicate execution being fixed. With a lease, a crashed holder's lock expires on its
 * own; the TTL only has to exceed the job's expected runtime.
 *
 * <p>Acquisition is two single statements, each atomic in itself, rather than a read-then-write:
 * a conditional UPDATE claims an expired or existing lease, and an INSERT IGNORE covers the very
 * first run when no row exists. Two replicas racing both go through the same statements and
 * exactly one gets a row count of 1.
 */
@Slf4j
@Service
public class SchedulerLockService {

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    private final String instanceId = resolveInstanceId();

    /**
     * Runs {@code task} only if this instance can take the named lock.
     *
     * <p>Fails OPEN on purpose: if the lock table cannot be reached, the job still runs. The
     * failure this guards against is a duplicate notification; the failure of running nothing at
     * all — no reminders, no cleanup, no scheduled sends, silently — is worse. That trade is
     * deliberate and is the opposite of what a lock protecting money or state mutation should do.
     */
    public void runExclusively(String jobName, Duration leaseFor, Runnable task) {
        if (jdbcTemplate == null) {
            task.run();
            return;
        }
        boolean acquired;
        try {
            acquired = tryAcquire(jobName, leaseFor);
        } catch (Exception e) {
            log.warn("Scheduled-job lock unavailable for '{}' ({}), running anyway", jobName, e.getMessage());
            task.run();
            return;
        }
        if (!acquired) {
            log.debug("Scheduled job '{}' is held by another instance; skipping this tick", jobName);
            return;
        }
        // No release in a finally block. Releasing early would let a second replica whose clock or
        // trigger fires slightly later pick the job up and run it again in the same window, which
        // is the duplicate this exists to prevent. The lease simply expires.
        task.run();
    }

    /**
     * REQUIRES_NEW so the claim commits immediately and is visible to other replicas, rather than
     * sitting uncommitted inside whatever transaction the caller happens to be in.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean tryAcquire(String jobName, Duration leaseFor) {
        LocalDateTime until = LocalDateTime.now().plus(leaseFor);
        int claimed = jdbcTemplate.update(
                "UPDATE scheduled_job_lock SET locked_until = ?, locked_by = ? "
                        + "WHERE job_name = ? AND locked_until < NOW(6)",
                until, instanceId, jobName);
        if (claimed > 0) {
            return true;
        }
        // No row yet — the first time this job has ever run anywhere. INSERT IGNORE so the replica
        // that loses the race gets 0 rather than an exception.
        int inserted = jdbcTemplate.update(
                "INSERT IGNORE INTO scheduled_job_lock (job_name, locked_until, locked_by) VALUES (?, ?, ?)",
                jobName, until, instanceId);
        return inserted > 0;
    }

    private static String resolveInstanceId() {
        try {
            String host = java.net.InetAddress.getLocalHost().getHostName();
            return host != null && !host.isBlank() ? host : "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }
}
