package com._42students.lms.repository;

import com._42students.lms.model.Interview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import javax.persistence.LockModeType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, Integer> {

    /** Upcoming nonterminal interviews for learners in this college, including shared-org jobs. */
    @Query("SELECT COUNT(i) FROM Interview i JOIN i.learner l " +
           "WHERE l.collegeId = :collegeId AND i.organizationId = :organizationId " +
           "AND i.isDeleted = false AND i.scheduledDate >= :nowUtc " +
           "AND i.interviewStatus IN ('SCHEDULED', 'CONFIRMED', 'RESCHEDULE_REQUESTED')")
    long countUpcomingForLearnerCollege(@Param("collegeId") Integer collegeId,
                                        @Param("organizationId") Integer organizationId,
                                        @Param("nowUtc") LocalDateTime nowUtc);

    // Find all interviews for an organization (Phase 5)
    // JOIN FETCH so job, jobApplication, learner are loaded (avoids LazyInitializationException when serializing to JSON).
    @Query("SELECT DISTINCT i FROM Interview i JOIN FETCH i.job JOIN FETCH i.jobApplication JOIN FETCH i.learner WHERE i.organizationId = :organizationId AND i.isDeleted = false ORDER BY i.scheduledDate ASC")
    List<Interview> findByOrganizationId(@Param("organizationId") Integer organizationId);

    @Query(value = "SELECT DISTINCT i FROM Interview i JOIN FETCH i.job j JOIN FETCH i.jobApplication JOIN FETCH i.learner WHERE i.organizationId = :organizationId AND i.isDeleted = false",
          countQuery = "SELECT COUNT(DISTINCT i) FROM Interview i WHERE i.organizationId = :organizationId AND i.isDeleted = false")
    Page<Interview> findByOrganizationIdPageable(@Param("organizationId") Integer organizationId, Pageable pageable);

    // Find all interviews for a college (college-scoped admin: filter by job.collegeId)
    // JOIN FETCH so job, jobApplication, learner are loaded (avoids LazyInitializationException when serializing to JSON).
    @Query("SELECT DISTINCT i FROM Interview i JOIN FETCH i.job j JOIN FETCH i.jobApplication JOIN FETCH i.learner WHERE j.collegeId = :collegeId AND i.isDeleted = false ORDER BY i.scheduledDate ASC")
    List<Interview> findByJobCollegeId(@Param("collegeId") Integer collegeId);

    @Query(value = "SELECT DISTINCT i FROM Interview i JOIN FETCH i.job j JOIN FETCH i.jobApplication JOIN FETCH i.learner WHERE j.collegeId = :collegeId AND i.isDeleted = false",
          countQuery = "SELECT COUNT(DISTINCT i) FROM Interview i JOIN i.job j WHERE j.collegeId = :collegeId AND i.isDeleted = false")
    Page<Interview> findByJobCollegeIdPageable(@Param("collegeId") Integer collegeId, Pageable pageable);

    // Find interviews by job.collegeId OR (job.collegeId is null and job.organizationId = orgId).
    // Used when college admin's jobs may have org but not collegeId set.
    @Query("SELECT DISTINCT i FROM Interview i JOIN FETCH i.job j JOIN FETCH i.jobApplication JOIN FETCH i.learner WHERE " +
           "(j.collegeId = :collegeId OR (j.collegeId IS NULL AND j.organizationId = :organizationId)) AND i.isDeleted = false ORDER BY i.scheduledDate ASC")
    List<Interview> findByJobCollegeIdOrOrganizationId(@Param("collegeId") Integer collegeId, @Param("organizationId") Integer organizationId);

    @Query(value = "SELECT DISTINCT i FROM Interview i JOIN FETCH i.job j JOIN FETCH i.jobApplication JOIN FETCH i.learner WHERE (j.collegeId = :collegeId OR (j.collegeId IS NULL AND j.organizationId = :organizationId)) AND i.isDeleted = false",
          countQuery = "SELECT COUNT(DISTINCT i) FROM Interview i JOIN i.job j WHERE (j.collegeId = :collegeId OR (j.collegeId IS NULL AND j.organizationId = :organizationId)) AND i.isDeleted = false")
    Page<Interview> findByJobCollegeIdOrOrganizationIdPageable(@Param("collegeId") Integer collegeId, @Param("organizationId") Integer organizationId, Pageable pageable);

    // Find interviews for a job application — JOIN FETCH to avoid LazyInitializationException
    @Query("SELECT DISTINCT i FROM Interview i JOIN FETCH i.job JOIN FETCH i.jobApplication JOIN FETCH i.learner WHERE i.jobApplication.id = :applicationId AND i.isDeleted = false ORDER BY i.scheduledDate ASC")
    List<Interview> findByJobApplicationId(@Param("applicationId") Integer applicationId);

    // Find interviews for a learner — JOIN FETCH to avoid LazyInitializationException
    @Query("SELECT DISTINCT i FROM Interview i JOIN FETCH i.job JOIN FETCH i.jobApplication JOIN FETCH i.learner WHERE i.learner.id = :learnerId AND i.isDeleted = false ORDER BY i.scheduledDate ASC")
    List<Interview> findByLearnerId(@Param("learnerId") Integer learnerId);

    // Find interview by ID with all associations eagerly loaded (for notification dispatch after confirm/complete/cancel-reschedule)
    @Query("SELECT DISTINCT i FROM Interview i JOIN FETCH i.job JOIN FETCH i.jobApplication ja JOIN FETCH ja.job JOIN FETCH i.learner WHERE i.id = :id AND i.isDeleted = false")
    Optional<Interview> findByIdWithAllAssociations(@Param("id") Integer id);

    // Find interviews for a learner in their organization (includes CANCELLED for Past tab history; calendar filters CANCELLED client-side).
    // JOIN FETCH so job, jobApplication, learner are loaded (avoids LazyInitializationException when open-in-view=false).
    @Query("SELECT DISTINCT i FROM Interview i JOIN FETCH i.job JOIN FETCH i.jobApplication JOIN FETCH i.learner WHERE i.learner.id = :learnerId AND i.organizationId = :organizationId AND i.isDeleted = false ORDER BY i.scheduledDate ASC")
    List<Interview> findByLearnerIdAndOrganization(@Param("learnerId") Integer learnerId, @Param("organizationId") Integer organizationId);

    // Pageable variant: interviews for a learner in their organization
    @Query(value = "SELECT DISTINCT i FROM Interview i JOIN FETCH i.job JOIN FETCH i.jobApplication JOIN FETCH i.learner WHERE i.learner.id = :learnerId AND i.organizationId = :organizationId AND i.isDeleted = false",
           countQuery = "SELECT COUNT(DISTINCT i) FROM Interview i WHERE i.learner.id = :learnerId AND i.organizationId = :organizationId AND i.isDeleted = false")
    Page<Interview> findByLearnerIdAndOrganizationPageable(
            @Param("learnerId") Integer learnerId,
            @Param("organizationId") Integer organizationId,
            Pageable pageable);

    // Find interview by ID and organization (Phase 5)
    @Query("SELECT i FROM Interview i WHERE i.id = :id AND i.organizationId = :organizationId AND i.isDeleted = false")
    Optional<Interview> findByIdAndOrganization(@Param("id") Integer id, @Param("organizationId") Integer organizationId);

    // Find interview by ID with learner eagerly loaded (for learner confirm/reschedule access check)
    @Query("SELECT i FROM Interview i JOIN FETCH i.learner WHERE i.id = :id AND i.isDeleted = false")
    Optional<Interview> findByIdWithLearner(@Param("id") Integer id);

    // Find upcoming interviews for a learner (nowUtc: use UTC for consistent comparison).
    // Includes SCHEDULED, CONFIRMED, RESCHEDULE_REQUESTED — learner needs to see all non-terminal future interviews.
    // JOIN FETCH so job, jobApplication, learner are loaded in same transaction (avoids LazyInitializationException when serializing with open-in-view=false).
    @Query("SELECT DISTINCT i FROM Interview i JOIN FETCH i.job JOIN FETCH i.jobApplication JOIN FETCH i.learner WHERE i.learner.id = :learnerId AND i.organizationId = :organizationId AND i.scheduledDate >= :nowUtc AND i.interviewStatus IN ('SCHEDULED', 'CONFIRMED', 'RESCHEDULE_REQUESTED') AND i.isDeleted = false ORDER BY i.scheduledDate ASC")
    List<Interview> findUpcomingInterviewsForLearner(@Param("learnerId") Integer learnerId, @Param("organizationId") Integer organizationId, @Param("nowUtc") LocalDateTime nowUtc);

    // Overlap (legacy window-based): kept for reference — replaced by findPotentialOverlapsForLearner below.
    @Query("SELECT i FROM Interview i WHERE i.learner.id = :learnerId AND i.isDeleted = false AND i.interviewStatus IN ('SCHEDULED', 'CONFIRMED') AND i.scheduledDate >= :windowStart AND i.scheduledDate <= :windowEnd AND (:excludeInterviewId IS NULL OR i.id <> :excludeInterviewId)")
    List<Interview> findOverlappingForLearner(@Param("learnerId") Integer learnerId, @Param("windowStart") LocalDateTime windowStart, @Param("windowEnd") LocalDateTime windowEnd, @Param("excludeInterviewId") Integer excludeInterviewId);

    // Overlap (legacy window-based): kept for reference — replaced by findPotentialOverlapsForApplication below.
    @Query("SELECT i FROM Interview i WHERE i.jobApplication.id = :applicationId AND i.isDeleted = false AND i.interviewStatus IN ('SCHEDULED', 'CONFIRMED') AND i.scheduledDate >= :windowStart AND i.scheduledDate <= :windowEnd AND (:excludeInterviewId IS NULL OR i.id <> :excludeInterviewId)")
    List<Interview> findOverlappingForApplication(@Param("applicationId") Integer applicationId, @Param("windowStart") LocalDateTime windowStart, @Param("windowEnd") LocalDateTime windowEnd, @Param("excludeInterviewId") Integer excludeInterviewId);

    /**
     * Fetch all SCHEDULED/CONFIRMED/RESCHEDULE_REQUESTED interviews for a learner (for
     * duration-aware overlap check in Java). RESCHEDULE_REQUESTED keeps its original
     * scheduledDate until an admin resolves it — that slot is still real and must not be
     * double-bookable just because a reschedule is pending.
     * excludeInterviewId: pass current interview ID on updates to exclude self from check.
     *
     * CONCURRENCY FIX (round 3 audit): must be a locking read, for the same reason documented on
     * findNonTerminalByJobApplicationIdForUpdate below. Both scheduleInterview and updateInterview
     * run a plain (non-locking) SELECT — jobRepository.findByIdAndOrganization in scheduleInterview,
     * getInterviewById in updateInterview — BEFORE they wait on the pessimistic Learner-row lock
     * that serializes concurrent schedule/reschedule attempts for the same learner across different
     * applications. Under MySQL InnoDB's default REPEATABLE READ isolation, that earlier plain read
     * fixes the transaction's consistent-read snapshot for the rest of the transaction: this overlap
     * query, if left non-locking, would keep reading that pre-lock-wait snapshot and could miss an
     * interview the other (winning) transaction committed while this one was blocked on the Learner
     * lock — silently allowing a double-booked overlap despite the lock correctly serializing the
     * writes. A locking read always reads the latest committed data regardless of the snapshot,
     * closing that gap.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Interview i WHERE i.learner.id = :learnerId AND i.isDeleted = false " +
           "AND i.interviewStatus IN ('SCHEDULED', 'CONFIRMED', 'RESCHEDULE_REQUESTED') " +
           "AND (:excludeInterviewId IS NULL OR i.id <> :excludeInterviewId)")
    List<Interview> findPotentialOverlapsForLearner(
            @Param("learnerId") Integer learnerId,
            @Param("excludeInterviewId") Integer excludeInterviewId);


    /**
     * Fetch all SCHEDULED/CONFIRMED/RESCHEDULE_REQUESTED interviews for an application (for
     * duration-aware overlap check in Java). See findPotentialOverlapsForLearner for why
     * RESCHEDULE_REQUESTED is included, and why this must be a locking read (same
     * CONCURRENCY FIX (round 3 audit) rationale — the snapshot may already be fixed by an earlier
     * plain read before this transaction waits on the Learner lock).
     * excludeInterviewId: pass current interview ID on updates to exclude self from check.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Interview i WHERE i.jobApplication.id = :applicationId AND i.isDeleted = false " +
           "AND i.interviewStatus IN ('SCHEDULED', 'CONFIRMED', 'RESCHEDULE_REQUESTED') " +
           "AND (:excludeInterviewId IS NULL OR i.id <> :excludeInterviewId)")
    List<Interview> findPotentialOverlapsForApplication(
            @Param("applicationId") Integer applicationId,
            @Param("excludeInterviewId") Integer excludeInterviewId);

    // Find interviews scheduled between two dates (for reminder job)
    @Query("SELECT i FROM Interview i WHERE i.scheduledDate >= :startDate AND i.scheduledDate <= :endDate AND i.interviewStatus IN ('SCHEDULED', 'CONFIRMED') AND i.isDeleted = false")
    List<Interview> findByScheduledDateBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * Find all active (non-terminal) interviews for an application.
     * Used to block scheduling a new round while a previous round is still open, and by
     * revertToShortlistedIfNoActiveInterviewsRemain (cancelInterview/declineInterview) to decide
     * whether any active round remains.
     * excludeId: optional interview ID to exclude (for update operations).
     *
     * CONCURRENCY FIX (round 3 audit): locking read, same rationale as
     * findPotentialOverlapsForLearner above. cancelInterview/declineInterview both run a plain
     * (non-locking) getInterviewById SELECT before taking the Application-row lock documented next
     * to their findByIdForUpdate calls; under MySQL InnoDB REPEATABLE READ that earlier read fixes
     * the transaction's snapshot, so a non-locking version of this query could still miss a sibling
     * round's CANCELLED status committed by a concurrent transaction while this one was blocked on
     * the Application lock — reproducing exactly the "both sides think the other round is still
     * active" race the Application lock is meant to close.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Interview i WHERE i.jobApplication.id = :applicationId AND i.isDeleted = false " +
           "AND i.interviewStatus IN ('SCHEDULED', 'CONFIRMED', 'RESCHEDULE_REQUESTED') " +
           "AND (:excludeId IS NULL OR i.id <> :excludeId)")
    List<Interview> findActiveInterviewsForApplication(
            @Param("applicationId") Integer applicationId,
            @Param("excludeId") Integer excludeId);

    /**
     * CONCURRENCY FIX (round 4 audit): locking variant of the non-terminal-interview lookup used
     * when cancelling an application's interviews as part of a withdrawal cascade
     * (JobServiceImpl.withdrawOtherActiveApplications, AdminJobServiceImpl/
     * PlacementJobServiceImpl.withdrawOtherActiveApplicationsOnHire).
     *
     * Under MySQL InnoDB's default REPEATABLE READ isolation, a transaction's plain (non-locking)
     * SELECTs are bound to the consistent-read snapshot established at that transaction's first
     * read — they do NOT see rows committed by other transactions afterward, even after an
     * intervening locking read on a different row/table. A plain findByJobApplicationId() call
     * here could therefore miss a brand-new interview inserted by a concurrent
     * InterviewServiceImpl.scheduleInterview() call for the SAME application (which takes its own
     * pessimistic lock via JobApplicationRepository.findByIdForUpdate and commits independently),
     * leaving that freshly-scheduled interview un-cancelled even though the application is being
     * withdrawn in the same pass — a SCHEDULED interview left dangling on a WITHDRAWN application.
     * A locking read (FOR UPDATE) always reads the latest committed data regardless of the
     * transaction's snapshot, closing that visibility gap. Callers must lock the parent
     * JobApplication row first (JobApplicationRepository.findByIdForUpdate) to match
     * scheduleInterview's own Application-then-Interview lock order and avoid a cross-table
     * deadlock.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Interview i WHERE i.jobApplication.id = :applicationId AND i.isDeleted = false " +
           "AND i.interviewStatus IN ('SCHEDULED', 'CONFIRMED', 'RESCHEDULE_REQUESTED')")
    List<Interview> findNonTerminalByJobApplicationIdForUpdate(@Param("applicationId") Integer applicationId);

    /**
     * Fetch all SCHEDULED/CONFIRMED/RESCHEDULE_REQUESTED interviews for a given human interviewer
     * (by name, case-insensitively) at a given company, within the organization — for the
     * duration-aware server-side double-booking check in Java. Mirrors the frontend's soft,
     * client-side-only interviewConflicts.js scoping (interviewerName + companyName): scoped to
     * companyName so two different people who happen to share a name but interview for different
     * companies are never falsely flagged against each other.
     *
     * SECURITY FIX (this audit round): previously there was no server-side interviewer-overlap
     * check at all — only the frontend's best-effort warning, which is a per-form-mount snapshot
     * and does nothing to stop two admins scheduling around the same interviewer concurrently.
     * Locking read for the same reason as findPotentialOverlapsForLearner/-ForApplication above:
     * an earlier plain read in this transaction may have already fixed the REPEATABLE READ
     * snapshot, so a non-locking read here could miss a just-committed concurrent booking.
     * excludeInterviewId: pass current interview ID on updates to exclude self from check.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Interview i JOIN i.job j WHERE i.organizationId = :organizationId AND i.isDeleted = false " +
           "AND LOWER(i.interviewerName) = LOWER(:interviewerName) AND LOWER(j.companyName) = LOWER(:companyName) " +
           "AND i.interviewStatus IN ('SCHEDULED', 'CONFIRMED', 'RESCHEDULE_REQUESTED') " +
           "AND (:excludeInterviewId IS NULL OR i.id <> :excludeInterviewId)")
    List<Interview> findPotentialOverlapsForInterviewer(
            @Param("organizationId") Integer organizationId,
            @Param("interviewerName") String interviewerName,
            @Param("companyName") String companyName,
            @Param("excludeInterviewId") Integer excludeInterviewId);

    /**
     * Distinct interviewer names already used in this organization, most recent first.
     *
     * <p>Interviewers are free text (deliberately — an interviewer is often an external recruiter,
     * not a Faculty row), and the server-side double-booking check matches on that name. That
     * makes a typo a correctness bug rather than a cosmetic one: "R. Sharma" and "Rahul Sharma"
     * are two different people to the conflict check, so one careless retype silently disables it.
     * This backs a suggest-as-you-type control so an admin picks the existing spelling instead of
     * inventing a new one.
     */
    @Query("SELECT DISTINCT i.interviewerName FROM Interview i "
            + "WHERE i.organizationId = :organizationId AND i.isDeleted = false "
            + "AND i.interviewerName IS NOT NULL AND i.interviewerName <> '' "
            + "ORDER BY i.interviewerName ASC")
    List<String> findDistinctInterviewerNames(@Param("organizationId") Integer organizationId);

    /** Next upcoming interview per application. Returns earliest per applicationId. (Gap #3) */
    @Query("SELECT i FROM Interview i JOIN FETCH i.job JOIN FETCH i.jobApplication JOIN FETCH i.learner WHERE i.jobApplication.id IN :applicationIds AND i.scheduledDate >= :nowUtc AND i.interviewStatus IN ('SCHEDULED', 'CONFIRMED', 'RESCHEDULE_REQUESTED') AND i.isDeleted = false ORDER BY i.scheduledDate ASC")
    List<Interview> findUpcomingByApplicationIds(@Param("applicationIds") List<Integer> applicationIds, @Param("nowUtc") LocalDateTime nowUtc);
}



