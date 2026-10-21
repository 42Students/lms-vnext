package com._42students.lms.service.impl;

import com._42students.lms.model.Job;
import com._42students.lms.repository.JobRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Phase 5 - Gap 10.4: Auto-expiry of jobs when applicationDeadline has passed.
 * Runs daily at 01:00 (server timezone) to set isActive=false for expired jobs.
 * Edge cases: only processes jobs with non-null applicationDeadline; skips already inactive/deleted.
 */
@Slf4j
@Service
public class JobAutoExpiryService {

    @Autowired
    private JobRepository jobRepository;

    /**
     * Doc 20: one replica only. Expiry itself is idempotent, but it writes an audit row and can
     * fire notifications, so N replicas produce N of each for the same job.
     */
    @Autowired(required = false)
    private com._42students.lms.service.SchedulerLockService schedulerLock;

    @Scheduled(cron = "0 0 1 * * *") // Daily at 01:00
    public void expireJobsPastDeadline() {
        if (schedulerLock == null) {
            expireJobsPastDeadlineInternal();
            return;
        }
        schedulerLock.runExclusively("placement.jobAutoExpiry", java.time.Duration.ofMinutes(30),
                this::expireJobsPastDeadlineInternal);
    }

    // @Transactional stays on the worker, not the scheduled entry point: the lock claim commits in
    // its own transaction before this runs, and wrapping the lock acquisition in the job's
    // transaction would hold it open for the whole expiry pass.
    @Transactional
    public void expireJobsPastDeadlineInternal() {
        // applicationDeadline is stored/compared as UTC everywhere else in the module
        // (JobServiceImpl visibility/apply checks) — using server-local time here would expire
        // jobs early/late by the server's UTC offset.
        LocalDateTime now = LocalDateTime.now(java.time.ZoneOffset.UTC);
        try {
            List<Job> expired = jobRepository.findActiveJobsPastApplicationDeadline(now);
            if (expired.isEmpty()) {
                log.debug("Job auto-expiry: no jobs to expire");
                return;
            }
            int count = 0;
            for (Job job : expired) {
                try {
                    job.setIsActive(false);
                    jobRepository.save(job);
                    count++;
                    log.info("Job auto-expired: id={}, title={}, deadline={}", 
                            job.getId(), job.getJobTitle(), job.getApplicationDeadline());
                } catch (Exception e) {
                    log.warn("Failed to expire job {}: {}", job.getId(), e.getMessage());
                }
            }
            log.info("Job auto-expiry complete: {} jobs deactivated", count);
        } catch (Exception e) {
            log.error("Job auto-expiry job failed: {}", e.getMessage(), e);
        }
    }
}

