package com._42students.lms.repository;

import com._42students.lms.model.ApplicationScreening;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationScreeningRepository extends JpaRepository<ApplicationScreening, Integer> {

    /**
     * Find screening by application ID
     * NOTE: Uses (isDeleted = false OR isDeleted IS NULL) to handle cases where isDeleted wasn't set
     */
    @Query("SELECT s FROM ApplicationScreening s WHERE s.application.id = :applicationId AND (s.isDeleted = false OR s.isDeleted IS NULL)")
    Optional<ApplicationScreening> findByApplicationId(@Param("applicationId") Integer applicationId);

    /**
     * Find all screenings for a job, ordered by overall score (descending)
     */
    @Query("SELECT s FROM ApplicationScreening s WHERE s.application.job.id = :jobId AND s.isDeleted = false ORDER BY s.overallScore DESC")
    List<ApplicationScreening> findByJobIdOrderByScoreDesc(@Param("jobId") Integer jobId);

    /**
     * Find all screenings for a job and organization, ordered by overall score (descending)
     * 
     * @deprecated Use findByJobIdAndOrganizationAndVersionOrderByScoreDesc to prevent mixed logic scoring
     */
    @Deprecated
    @Query("SELECT s FROM ApplicationScreening s WHERE s.application.job.id = :jobId AND s.application.organizationId = :organizationId AND s.isDeleted = false ORDER BY s.overallScore DESC")
    List<ApplicationScreening> findByJobIdAndOrganizationOrderByScoreDesc(@Param("jobId") Integer jobId, @Param("organizationId") Integer organizationId);

    /**
     * Find all screenings for a job and organization with specific screening version, ordered by overall score (descending)
     * 
     * PREVENTS MIXED LOGIC SCORING: Only returns screenings with the same version
     * Ensures scores can be safely compared and sorted
     */
    @Query("SELECT s FROM ApplicationScreening s WHERE s.application.job.id = :jobId AND s.application.organizationId = :organizationId AND s.screeningVersion = :screeningVersion AND s.isDeleted = false AND s.screeningStatus = 'COMPLETED' ORDER BY s.overallScore DESC")
    List<ApplicationScreening> findByJobIdAndOrganizationAndVersionOrderByScoreDesc(
            @Param("jobId") Integer jobId,
            @Param("organizationId") Integer organizationId,
            @Param("screeningVersion") String screeningVersion);

    /**
     * Same as findByJobIdAndOrganizationAndVersionOrderByScoreDesc but scoped to a specific set of
     * application ids (e.g. the current page's rows) instead of every screening for the whole job —
     * avoids re-fetching a job's entire screening history on every paginated page turn.
     */
    @Query("SELECT s FROM ApplicationScreening s WHERE s.application.job.id = :jobId AND s.application.organizationId = :organizationId AND s.screeningVersion = :screeningVersion AND s.isDeleted = false AND s.screeningStatus = 'COMPLETED' AND s.application.id IN :applicationIds")
    List<ApplicationScreening> findByJobIdAndOrganizationAndVersionAndApplicationIds(
            @Param("jobId") Integer jobId,
            @Param("organizationId") Integer organizationId,
            @Param("screeningVersion") String screeningVersion,
            @Param("applicationIds") List<Integer> applicationIds);
}


