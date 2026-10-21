package com._42students.lms.repository;

import com._42students.lms.model.Job;
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
public interface JobRepository extends JpaRepository<Job, Integer> {

    /** Drive requests one recruiter has made to one college, newest first. */
    @Query("SELECT j FROM Job j WHERE j.recruiterId = :recruiterId AND j.collegeId = :collegeId AND j.isDeleted = false ORDER BY j.id DESC")
    List<Job> findRecruiterRequests(@Param("recruiterId") Long recruiterId, @Param("collegeId") Integer collegeId);

    /** Published active jobs belonging to a college plus shared, college-null org jobs. */
    @Query("SELECT COUNT(j) FROM Job j WHERE j.isActive = true AND j.isDeleted = false " +
           "AND (j.isDraft = false OR j.isDraft IS NULL) AND " +
           "(j.collegeId = :collegeId OR (j.collegeId IS NULL AND j.organizationId = :organizationId))")
    long countActivePublishedForCollegeOrOrg(@Param("collegeId") Integer collegeId,
                                              @Param("organizationId") Integer organizationId);

    // CONCURRENCY FIX (round 3 audit): PESSIMISTIC_WRITE lock on a single Job row, mirroring
    // CompanyRepository.lockById. Used by JobServiceImpl.applyToJob to re-verify isActive/
    // isDeleted immediately before persisting a new/reactivated JobApplication, serializing
    // against AdminJobServiceImpl/PlacementJobServiceImpl.deleteJob's softDeleteById UPDATE
    // (which takes the same row's write lock at flush time). Without this, a learner's apply
    // request that read the job as active early in its transaction could still commit a fresh
    // application after an admin's concurrent delete had already committed, since nothing
    // re-checked the job's state right before the write.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT j FROM Job j WHERE j.id = :id")
    Optional<Job> lockJobById(@Param("id") Integer id);

    // Find all active jobs (10.1: exclude drafts - learners never see drafts)
    // FIX (round 22 audit, targeting/visibility sweep): this is the query JobSearchCache.loadJobs()
    // uses to populate the in-memory search index behind /api/v2/jobs/search and its sibling
    // endpoints (learner-accessible via learnerId), and it was the one query in this file missing
    // the "AND (j.visibilityType IS NULL OR j.visibilityType != 'EXTERNAL_ONLY')" guard that every
    // other learner-facing job query here has (findAllActiveJobsByOrganization,
    // findAllJobsByOrganization, findForCollegeAdminByCollegeOrOrg) — an EXTERNAL_ONLY job (meant
    // to accept applications only through an external ATS, never surfaced to LMS students per
    // checkJobVisibility/applyToJob/matchesHierarchicalTargeting) was indexed and returned by job
    // search/department/program/job-type/category/popular results even though every other
    // learner-facing list and the apply/visibility checks correctly excluded it.
    // Sorting whole job rows makes MySQL carry their JSON columns through the filesort: one job with large JSON
    // (screening, eligibility, evaluation config) overflows sort_buffer_size and the query fails with
    // "Out of sort memory", taking the job search cache and the learner job list down with it. These lists sort
    // only the ids and then load the rows (see inIdOrder).
    @Query("SELECT j.id FROM Job j WHERE j.isActive = true AND j.isDeleted = false " +
           "AND (j.isDraft = false OR j.isDraft IS NULL) " +
           "AND (j.visibilityType IS NULL OR j.visibilityType != 'EXTERNAL_ONLY') ORDER BY j.createdAt DESC")
    List<Integer> findAllActiveJobIds();

    default List<Job> findAllActiveJobs() {
        return inIdOrder(findAllActiveJobIds());
    }

    /** Loads the jobs for already-sorted ids, keeping that order (findAllById returns rows in any order). */
    default List<Job> inIdOrder(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) return new java.util.ArrayList<>();
        java.util.Map<Integer, Job> byId = new java.util.HashMap<>();
        for (Job j : findAllById(ids)) byId.put(j.getId(), j);
        List<Job> out = new java.util.ArrayList<>(ids.size());
        for (Integer id : ids) { Job j = byId.get(id); if (j != null) out.add(j); }
        return out;
    }

    // Find all active jobs for an organization (Phase 4)
    // Excludes EXTERNAL_ONLY jobs and drafts (10.1) from LMS learner view
    @Query("SELECT j.id FROM Job j WHERE j.organizationId = :organizationId " +
           "AND j.isActive = true AND j.isDeleted = false " +
           "AND (j.isDraft = false OR j.isDraft IS NULL) " +
           "AND (j.visibilityType IS NULL OR j.visibilityType != 'EXTERNAL_ONLY') " +
           "ORDER BY j.createdAt DESC")
    List<Integer> findAllActiveJobIdsByOrganization(@Param("organizationId") Integer organizationId);

    default List<Job> findAllActiveJobsByOrganization(Integer organizationId) {
        return inIdOrder(findAllActiveJobIdsByOrganization(organizationId));
    }

    // Find ALL non-deleted jobs for an organization regardless of active/draft status — same
    // filtering as AdminJobServiceImpl.getAllJobs (excludes only EXTERNAL_ONLY visibility, not
    // active/draft state). Used by getJobsForOrganization so an org-level admin can see draft and
    // closed jobs too, not just active ones (findAllActiveJobsByOrganization above silently hid
    // them with no filtered/paginated alternative on this surface).
    @Query("SELECT j FROM Job j WHERE j.organizationId = :organizationId " +
           "AND j.isDeleted = false " +
           "AND (j.visibilityType IS NULL OR j.visibilityType != 'EXTERNAL_ONLY') " +
           "ORDER BY j.createdAt DESC")
    List<Job> findAllJobsByOrganization(@Param("organizationId") Integer organizationId);

    // Find job by ID (active only, exclude drafts)
    @Query("SELECT j FROM Job j WHERE j.id = :id AND j.isActive = true AND j.isDeleted = false " +
           "AND (j.isDraft = false OR j.isDraft IS NULL)")
    Optional<Job> findActiveJobById(@Param("id") Integer id);

    // Find job by ID and organization (Phase 4)
    @Query("SELECT j FROM Job j WHERE j.id = :id AND j.organizationId = :organizationId AND j.isDeleted = false")
    Optional<Job> findByIdAndOrganization(@Param("id") Integer id, @Param("organizationId") Integer organizationId);

    // Same as findByIdAndOrganization but includes soft-deleted jobs — for the
    // applications-viewing endpoints, which shouldn't strand an admin's access to a job's
    // applications just because the job itself was later soft-deleted (item 210).
    @Query("SELECT j FROM Job j WHERE j.id = :id AND j.organizationId = :organizationId")
    Optional<Job> findByIdAndOrganizationIncludeDeleted(@Param("id") Integer id, @Param("organizationId") Integer organizationId);

    // Find job by slug (for external access)
    @Query("SELECT j FROM Job j WHERE j.jobSlug = :slug AND j.isDeleted = false")
    Optional<Job> findByJobSlug(@Param("slug") String slug);

    // Check if slug exists
    @Query("SELECT COUNT(j) > 0 FROM Job j WHERE j.jobSlug = :slug")
    boolean existsByJobSlug(@Param("slug") String slug);

    // Find non-deleted jobs for a college (avoids full-table scan)
    @Query("SELECT j FROM Job j WHERE j.collegeId = :collegeId AND j.isDeleted = false")
    List<Job> findByCollegeIdAndIsDeletedFalse(@Param("collegeId") Integer collegeId);

    /** For the college-admin dashboard's "at a glance" numbers -- a count, not a fetch. */
    @Query("SELECT COUNT(j) FROM Job j WHERE j.collegeId = :collegeId AND j.isActive = true AND j.isDeleted = false")
    long countActiveByCollegeId(@Param("collegeId") Integer collegeId);

    // Find jobs for college admin: by collegeId OR (collegeId null and organizationId = orgId).
    // Used when jobs may have org but not collegeId set.
    @Query("SELECT j.id FROM Job j WHERE j.isDeleted = false AND j.isActive = true " +
           "AND (j.collegeId = :collegeId OR (j.collegeId IS NULL AND j.organizationId = :organizationId)) " +
           "AND (j.visibilityType IS NULL OR j.visibilityType != 'EXTERNAL_ONLY') ORDER BY j.createdAt DESC")
    List<Integer> findIdsForCollegeAdminByCollegeOrOrg(@Param("collegeId") Integer collegeId, @Param("organizationId") Integer organizationId);

    default List<Job> findForCollegeAdminByCollegeOrOrg(Integer collegeId, Integer organizationId) {
        return inIdOrder(findIdsForCollegeAdminByCollegeOrOrg(collegeId, organizationId));
    }

    // Find all non-deleted jobs for college (includes inactive; used by getAllJobs for admin).
    // Same org fallback as getInterviewsForCollege.
    @Query("SELECT j FROM Job j WHERE j.isDeleted = false " +
           "AND (j.collegeId = :collegeId OR (j.collegeId IS NULL AND j.organizationId = :organizationId)) " +
           "ORDER BY j.createdAt DESC")
    List<Job> findByCollegeIdOrOrg(@Param("collegeId") Integer collegeId, @Param("organizationId") Integer organizationId);

    // CONCURRENCY FIX (round 2 audit): version = version + 1 is required here. Job has no
    // @DynamicUpdate, so a normal entity save() always writes ALL mapped columns, not just the
    // ones that changed. Without bumping version in this bulk query, a concurrent request that
    // loaded the Job into memory *before* this delete ran could still save() afterward with its
    // stale version (which the DB still matches, since the bulk update never incremented it) and
    // silently overwrite isDeleted=true/isActive=false back to false — effectively undeleting the
    // job. Bumping version here means that stale save() now fails optimistic locking as intended,
    // forcing the caller to reload and see the deletion.
    @Modifying
    @Query("UPDATE Job j SET j.isActive = false, j.isDeleted = true, j.version = j.version + 1 WHERE j.id = :jobId")
    int softDeleteById(@Param("jobId") Integer jobId);

    // organizationId is denormalized onto Job at creation time (for query performance) and never
    // re-derived afterward — if a College's org_id is corrected later, existing jobs silently
    // keep the stale value. Called when a College's org_id changes to re-sync.
    //
    // CONCURRENCY FIX (round 2 audit): version = version + 1 is required for the same reason as
    // softDeleteById above — Job has no @DynamicUpdate, so a stale in-memory Job saved after this
    // runs would rewrite organizationId back to its pre-reassignment value on every column, not
    // just the ones the caller meant to change. Bumping version forces that stale save() to fail
    // optimistic locking instead of silently reverting the reassignment.
    @Modifying
    @Query("UPDATE Job j SET j.organizationId = :newOrganizationId, j.version = j.version + 1 WHERE j.collegeId = :collegeId")
    int reassignOrganizationForCollege(@Param("collegeId") Integer collegeId, @Param("newOrganizationId") Integer newOrganizationId);

    // Jobs linked to a Company record, plus (for jobs created before company_id existed, or
    // created without picking one) an exact-name fallback match so a company's history isn't
    // missing its own older drives just because they predate the link.
    @Query("SELECT j FROM Job j WHERE (j.isDeleted = false OR j.isDeleted IS NULL) " +
           "AND (j.companyId = :companyId OR (j.companyId IS NULL AND j.companyName = :companyName)) " +
           "ORDER BY j.createdAt DESC")
    List<Job> findByCompanyIdOrLegacyName(@Param("companyId") Integer companyId, @Param("companyName") String companyName);

    /**
     * Find active jobs whose application deadline has passed (for auto-expiry - Gap 10.4).
     * Only jobs with non-null applicationDeadline, isActive=true, and not draft.
     */
    @Query("SELECT j FROM Job j WHERE j.applicationDeadline IS NOT NULL AND j.applicationDeadline < :now " +
           "AND j.isActive = true AND (j.isDeleted = false OR j.isDeleted IS NULL) " +
           "AND (j.isDraft = false OR j.isDraft IS NULL)")
    List<Job> findActiveJobsPastApplicationDeadline(@Param("now") java.time.LocalDateTime now);

    // Per-company drive count + last-posted date, batched in one GROUP BY for the Companies list
    // view — "how many drives, and when was the last one" is what actually distinguishes a
    // currently-engaged recruiting partner from one dormant for years.
    //
    // SECURITY/PRIVACY FIX (this audit round): unscoped by college, so for a legacy
    // collegeId=null shared company this used to aggregate every college's activity into one
    // count/date, making the Companies list "Drives" column (and the delete button's
    // disabled-while-active-jobs state) reflect org-wide usage instead of this college's own —
    // a company could appear undeletable purely because of another college's drives. Kept as-is
    // (unscoped) only for genuinely global/no-collegeId call sites; college-scoped callers should
    // use countAndLastActiveByCompanyIdsForCollege below instead.
    @Query("SELECT j.companyId, COUNT(j), MAX(COALESCE(j.postedDate, j.createdAt)) FROM Job j " +
           "WHERE j.companyId IN :companyIds AND (j.isDeleted = false OR j.isDeleted IS NULL) " +
           "GROUP BY j.companyId")
    List<Object[]> countAndLastActiveByCompanyIds(@Param("companyIds") List<Integer> companyIds);

    // College-scoped variant of countAndLastActiveByCompanyIds above — only counts jobs actually
    // posted by this college (or legacy org-wide jobs with no collegeId of their own), so a
    // shared legacy company's "Drives" count reflects this college's own activity, not every
    // college in the org that happens to share the same Company row.
    @Query("SELECT j.companyId, COUNT(j), MAX(COALESCE(j.postedDate, j.createdAt)) FROM Job j " +
           "WHERE j.companyId IN :companyIds AND (j.isDeleted = false OR j.isDeleted IS NULL) " +
           "AND (j.collegeId = :collegeId OR j.collegeId IS NULL) " +
           "GROUP BY j.companyId")
    List<Object[]> countAndLastActiveByCompanyIdsForCollege(@Param("companyIds") List<Integer> companyIds, @Param("collegeId") Integer collegeId);
}

