package com._42students.lms.service.impl;

import com._42students.lms.access.ResolvedLearnerScope;
import com._42students.lms.access.ScopeResolutionService;
import com._42students.lms.model.Learner;
import com._42students.lms.repository.LearnerRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import java.util.List;

/**
 * One-time startup backfill that ensures every learner has organizationId, collegeId,
 * and programId populated from the hierarchy. Also fixes NULL is_deleted flags across
 * critical tables. Safe to run repeatedly (idempotent).
 */
@Slf4j
@Service
public class LearnerScopeBackfillService {

    private final LearnerRepository learnerRepository;
    private final ScopeResolutionService scopeResolutionService;
    @PersistenceContext
    private EntityManager entityManager;

    public LearnerScopeBackfillService(LearnerRepository learnerRepository,
                                       ScopeResolutionService scopeResolutionService) {
        this.learnerRepository = learnerRepository;
        this.scopeResolutionService = scopeResolutionService;
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void backfillMissingScopeFields() {
        backfillNullIsDeleted();
        backfillNotificationTypes();
        log.info("LearnerScopeBackfill: Starting scan for learners with missing hierarchy fields...");

        List<Learner> incomplete = learnerRepository.findLearnersWithMissingScope();
        if (incomplete.isEmpty()) {
            log.info("LearnerScopeBackfill: All learners have complete scope fields. Nothing to do.");
            return;
        }

        log.info("LearnerScopeBackfill: Found {} learners with missing scope fields. Resolving...", incomplete.size());
        int updated = 0;

        for (Learner learner : incomplete) {
            try {
                ResolvedLearnerScope scope = scopeResolutionService.resolveFullScope(learner);
                boolean changed = false;

                if (learner.getOrganizationId() == null && scope.getOrganizationId() != null) {
                    learner.setOrganizationId(scope.getOrganizationId());
                    changed = true;
                }
                if (learner.getCollegeId() == null && scope.getCollegeId() != null) {
                    learner.setCollegeId(scope.getCollegeId());
                    changed = true;
                }
                if (learner.getProgramId() == null && scope.getProgramId() != null) {
                    learner.setProgramId(scope.getProgramId());
                    changed = true;
                }

                if (changed) {
                    learnerRepository.save(learner);
                    updated++;
                    log.debug("LearnerScopeBackfill: Learner {} backfilled → org={}, college={}, program={}",
                            learner.getId(), learner.getOrganizationId(),
                            learner.getCollegeId(), learner.getProgramId());
                }
            } catch (Exception e) {
                log.warn("LearnerScopeBackfill: Failed to backfill learner {}: {}", learner.getId(), e.getMessage());
            }
        }

        log.info("LearnerScopeBackfill: Complete. Updated {}/{} learners.", updated, incomplete.size());
    }

    /**
     * Retroactively classify existing notifications that have NULL notification_type.
     * Uses title pattern matching for job notifications, courseId for course, and GENERAL as fallback.
     * Safe to run repeatedly (idempotent — only touches rows where notification_type IS NULL).
     */
    private void backfillNotificationTypes() {
        try {
            int jobRows = entityManager.createNativeQuery(
                "UPDATE notification SET notification_type = 'JOB' " +
                "WHERE notification_type IS NULL AND (" +
                "  title LIKE '%Application Submitted%' OR " +
                "  title LIKE '%Shortlisted%' OR " +
                "  title LIKE '%Interview%' OR " +
                "  title LIKE '%Selected%' OR " +
                "  title LIKE '%Application Update%'" +
                ")"
            ).executeUpdate();
            if (jobRows > 0) {
                log.info("NotificationBackfill: Classified {} existing notifications as JOB", jobRows);
            }

            int courseRows = entityManager.createNativeQuery(
                "UPDATE notification SET notification_type = 'COURSE' " +
                "WHERE notification_type IS NULL AND course_id > 0"
            ).executeUpdate();
            if (courseRows > 0) {
                log.info("NotificationBackfill: Classified {} existing notifications as COURSE", courseRows);
            }

            int generalRows = entityManager.createNativeQuery(
                "UPDATE notification SET notification_type = 'GENERAL' " +
                "WHERE notification_type IS NULL"
            ).executeUpdate();
            if (generalRows > 0) {
                log.info("NotificationBackfill: Classified {} remaining notifications as GENERAL", generalRows);
            }
        } catch (Exception e) {
            log.warn("NotificationBackfill: Failed to backfill notification types: {}", e.getMessage());
        }
    }

    /**
     * Fix rows where is_deleted is NULL (should be false). This happens because
     * BaseModel's Boolean isDeleted field had no Java default, so Hibernate
     * inserted NULL instead of false. Safe to run repeatedly.
     */
    private void backfillNullIsDeleted() {
        String[] tables = {
            "job_application", "job", "learner", "student_assignment",
            "lesson_contents", "application_screening"
        };
        // job and job_application carry @Version optimistic locking. A raw UPDATE like this one
        // bypasses Hibernate's automatic version increment, so any row it touches could be
        // silently reverted by a concurrent stale in-memory Job/JobApplication save() without
        // that save failing optimistic locking (same bug class fixed in the round 2 audit for
        // JobRepository/JobApplicationRepository @Modifying queries). Bump version here too.
        java.util.Set<String> versionedTables = java.util.Set.of("job", "job_application");
        for (String table : tables) {
            try {
                String versionBump = versionedTables.contains(table) ? ", version = version + 1" : "";
                int rows = entityManager.createNativeQuery(
                    "UPDATE " + table + " SET is_deleted = 0" + versionBump + " WHERE is_deleted IS NULL"
                ).executeUpdate();
                if (rows > 0) {
                    log.info("IsDeletedBackfill: Fixed {} NULL is_deleted rows in {}", rows, table);
                }
            } catch (Exception e) {
                log.warn("IsDeletedBackfill: Skipped table {} ({})", table, e.getMessage());
            }
        }
    }
}

