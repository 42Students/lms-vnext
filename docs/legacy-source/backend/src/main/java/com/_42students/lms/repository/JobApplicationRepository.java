package com._42students.lms.repository;

import com._42students.lms.model.JobApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Integer> {

    /** Count real college learners rather than every applicant to a shared org job. */
    @Query("SELECT COUNT(a) FROM JobApplication a JOIN a.learner l JOIN a.job j " +
           "WHERE l.collegeId = :collegeId AND j.organizationId = :organizationId " +
           "AND a.isDeleted = false AND (a.applicationStatus IS NULL OR " +
           "UPPER(a.applicationStatus) NOT IN ('HIRED', 'REJECTED', 'WITHDRAWN'))")
    long countInProgressForLearnerCollege(@Param("collegeId") Integer collegeId,
                                          @Param("organizationId") Integer organizationId);

    @Query("SELECT COUNT(a) FROM JobApplication a JOIN a.learner l JOIN a.job j " +
           "WHERE l.collegeId = :collegeId AND j.organizationId = :organizationId " +
           "AND a.isDeleted = false AND UPPER(a.applicationStatus) = 'OFFERED'")
    long countPendingOffersForLearnerCollege(@Param("collegeId") Integer collegeId,
                                             @Param("organizationId") Integer organizationId);

    // Serializes concurrent scheduleInterview calls for the same application — without this,
    // two requests could both pass the "no active round" / overlap checks before either commits,
    // producing two active interview rounds for one application (the checks and the write run in
    // the same @Transactional method with default isolation and no row lock otherwise).
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ja FROM JobApplication ja WHERE ja.id = :id")
    Optional<JobApplication> findByIdForUpdate(@Param("id") Integer id);

    // Find application by learner and job (active only)
    @Query("SELECT ja FROM JobApplication ja JOIN FETCH ja.learner JOIN FETCH ja.job WHERE ja.learner.id = :learnerId AND ja.job.id = :jobId AND ja.isDeleted = false")
    Optional<JobApplication> findByLearnerIdAndJobId(@Param("learnerId") Integer learnerId, @Param("jobId") Integer jobId);

    /** Find application by learner and job including soft-deleted (for reactivation on re-apply after withdraw) */
    @Query("SELECT ja FROM JobApplication ja JOIN FETCH ja.learner JOIN FETCH ja.job WHERE ja.learner.id = :learnerId AND ja.job.id = :jobId")
    Optional<JobApplication> findByLearnerIdAndJobIdIncludeDeleted(@Param("learnerId") Integer learnerId, @Param("jobId") Integer jobId);

    // Find all applications by learner
    @Query("SELECT ja FROM JobApplication ja JOIN FETCH ja.job JOIN FETCH ja.learner WHERE ja.learner.id = :learnerId AND ja.isDeleted = false ORDER BY ja.appliedAt DESC")
    List<JobApplication> findByLearnerId(@Param("learnerId") Integer learnerId);

    // Same as findByLearnerId, but also includes the learner's own WITHDRAWN applications
    // (withdrawApplication soft-deletes on withdraw specifically to hide it from admin/company
    // views — see its own comment: "vanishes from every admin view" — but that same isDeleted
    // flag being the ONLY filter here meant a learner's own withdrawal also vanished from their
    // own Dashboard/Applications history, contradicting the WITHDRAWN badge/styling the frontend
    // already has ready for exactly this case. isDeleted is currently only ever set true by
    // withdrawal, so restricting the include to applicationStatus = 'WITHDRAWN' is the correct,
    // narrow carve-out — it does not resurrect a genuinely hard-deleted row if that concept is
    // ever introduced later.
    @Query("SELECT ja FROM JobApplication ja JOIN FETCH ja.job JOIN FETCH ja.learner WHERE ja.learner.id = :learnerId "
            + "AND (ja.isDeleted = false OR ja.applicationStatus = 'WITHDRAWN') ORDER BY ja.appliedAt DESC")
    List<JobApplication> findByLearnerIdIncludingWithdrawn(@Param("learnerId") Integer learnerId);

    // Deliberately ignores isDeleted — used to guard against hard-deleting a Learner who has ANY
    // placement history (including withdrawn applications), since job_application/interview both
    // have ON DELETE CASCADE on learner_id (see V104__placements_cascade_on_learner_delete.sql),
    // which would otherwise silently and permanently destroy that history, up to and including
    // HIRED records.
    boolean existsByLearnerId(Integer learnerId);

    // organizationId is denormalized onto JobApplication at apply time (for query performance)
    // and never re-derived afterward. Called alongside JobRepository.reassignOrganizationForCollege
    // when a College's org_id changes to re-sync existing applications under that college's jobs.
    // CONCURRENCY FIX (round 2 audit): version = version + 1 is required for the same reason as
    // JobRepository.reassignOrganizationForCollege — JobApplication has no @DynamicUpdate, so a
    // stale in-memory JobApplication (loaded before this bulk update ran) saved afterward would
    // rewrite organizationId back to its pre-reassignment value across every column. Bumping
    // version here forces that stale save() to fail optimistic locking instead of silently
    // reverting the reassignment.
    @Modifying
    @Query("UPDATE JobApplication ja SET ja.organizationId = :newOrganizationId, ja.version = ja.version + 1 WHERE ja.job.id IN " +
           "(SELECT j.id FROM Job j WHERE j.collegeId = :collegeId)")
    int reassignOrganizationForCollege(@Param("collegeId") Integer collegeId, @Param("newOrganizationId") Integer newOrganizationId);

    // Find all applications for a job
    @Query("SELECT ja FROM JobApplication ja JOIN FETCH ja.learner JOIN FETCH ja.job WHERE ja.job.id = :jobId AND ja.isDeleted = false ORDER BY ja.appliedAt DESC")
    List<JobApplication> findByJobId(@Param("jobId") Integer jobId);

    /** Find applications for multiple jobs (college-scoped metrics - Phase 5) */
    @Query("SELECT ja FROM JobApplication ja JOIN FETCH ja.learner JOIN FETCH ja.job WHERE ja.job.id IN :jobIds AND ja.isDeleted = false ORDER BY ja.appliedAt DESC")
    List<JobApplication> findByJobIdIn(@Param("jobIds") List<Integer> jobIds);

    // Find all applications for a job and organization (Phase 4)
    @Query("SELECT ja FROM JobApplication ja JOIN FETCH ja.learner JOIN FETCH ja.job WHERE ja.job.id = :jobId AND ja.organizationId = :organizationId AND ja.isDeleted = false ORDER BY ja.appliedAt DESC")
    List<JobApplication> findByJobIdAndOrganization(@Param("jobId") Integer jobId, @Param("organizationId") Integer organizationId);

    // Find all applications for an organization (Phase 4)
    @Query("SELECT ja FROM JobApplication ja JOIN FETCH ja.learner JOIN FETCH ja.job WHERE ja.organizationId = :organizationId AND ja.isDeleted = false ORDER BY ja.appliedAt DESC")
    List<JobApplication> findByOrganizationId(@Param("organizationId") Integer organizationId);

    // Paginated org-wide applications listing — the unbounded findByOrganizationId above returns
    // every non-deleted application the org has ever received with no LIMIT; this bounds it for
    // the live GET /applications endpoint, which previously called the unbounded version directly.
    @Query(value = "SELECT ja FROM JobApplication ja JOIN FETCH ja.learner JOIN FETCH ja.job WHERE ja.organizationId = :organizationId AND ja.isDeleted = false ORDER BY ja.appliedAt DESC",
           countQuery = "SELECT COUNT(ja) FROM JobApplication ja WHERE ja.organizationId = :organizationId AND ja.isDeleted = false")
    Page<JobApplication> findByOrganizationIdPaginated(@Param("organizationId") Integer organizationId, Pageable pageable);

    /** Find all non-deleted applications (for search cache - exclude soft-deleted) */
    @Query("SELECT ja FROM JobApplication ja JOIN FETCH ja.learner JOIN FETCH ja.job WHERE ja.isDeleted = false")
    List<JobApplication> findAllByIsDeletedFalse();

    // Find application by ID with associations eagerly loaded (open-in-view=false safe)
    @Query("SELECT ja FROM JobApplication ja JOIN FETCH ja.learner JOIN FETCH ja.job WHERE ja.id = :id")
    Optional<JobApplication> findByIdWithAssociations(@Param("id") Integer id);

    // Count non-deleted applications for a job (avoids loading all entities into memory).
    // Treats a null isDeleted as active/counted, matching the defensive null-handling pattern
    // used everywhere else in this codebase (and the manual .stream().filter() equivalent in
    // PlacementJobServiceImpl) — a plain "= false" excluded null rows, letting this count
    // disagree with the "lock criteria/screeningVersion once applications exist" guard.
    @Query("SELECT COUNT(ja) FROM JobApplication ja WHERE ja.job.id = :jobId AND (ja.isDeleted = false OR ja.isDeleted IS NULL)")
    long countByJobId(@Param("jobId") Integer jobId);

    // Count non-deleted applications for multiple jobs in one query (avoids N+1 count fetches)
    // FIX (round 22 audit, application-uniqueness/status-history sweep): this was missing the
    // "OR ja.isDeleted IS NULL" defensive null-handling that countByJobId above deliberately
    // added (see its comment) to match the manual .stream().filter() equivalent elsewhere in the
    // codebase — a plain "= false" silently excludes any legacy row with a null isDeleted, so the
    // per-job counts driving AdminJobServiceImpl/CompanyServiceImpl/PlacementJobServiceImpl's
    // bulk job listings could undercount relative to the single-job countByJobId used for the
    // exact same purpose elsewhere (e.g. AdminJobServiceImpl's applicationCount fields).
    @Query("SELECT ja.job.id, COUNT(ja) FROM JobApplication ja WHERE (ja.isDeleted = false OR ja.isDeleted IS NULL) AND ja.job.id IN :jobIds GROUP BY ja.job.id")
    List<Object[]> countByJobIds(@Param("jobIds") List<Integer> jobIds);

    // Count HIRED applications across multiple jobs without loading full entities (used by
    // CompanyServiceImpl.getCompanyStats, which previously pulled every JobApplication for the
    // company's jobs into memory just to filter+count them in Java).
    // FIX (round 22 audit): same missing "OR isDeleted IS NULL" drift as countByJobIds above.
    @Query("SELECT COUNT(a) FROM JobApplication a WHERE a.job.id IN :jobIds AND a.applicationStatus = 'HIRED' AND (a.isDeleted = false OR a.isDeleted IS NULL)")
    long countHiredByJobIds(@Param("jobIds") List<Integer> jobIds);
}

