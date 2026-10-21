package com._42students.lms.repository;

import com._42students.lms.model.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long> {
    List<Batch> findByProgramId(Long programId);

    /**
     * Case-insensitive name check within a program, used to enforce app-level uniqueness on
     * create/update (no unique index exists on batch.batch_name at the DB level).
     */
    @Query(value = "SELECT * FROM batch WHERE program_id = :programId AND LOWER(batch_name) = LOWER(:name)", nativeQuery = true)
    List<Batch> findByProgramIdAndBatchNameIgnoreCase(@Param("programId") Long programId, @Param("name") String name);

    @Query(value = "SELECT b.* FROM batch b " +
            "INNER JOIN new_program p ON b.program_id = p.id " +
            "INNER JOIN department d ON p.dept_id = d.id " +
            "WHERE d.college_id = :collegeId", nativeQuery = true)
    List<Batch> findByCollegeId(@Param("collegeId") int collegeId);

    @Query(value = "SELECT b.* FROM batch b " +
            "INNER JOIN new_program p ON b.program_id = p.id " +
            "INNER JOIN department d ON p.dept_id = d.id " +
            "INNER JOIN college c ON d.college_id = c.id " +
            "WHERE c.org_id = :orgId", nativeQuery = true)
    List<Batch> findByOrganizationId(@Param("orgId") int orgId);

    /**
     * Authoritative batch usage counts. Student membership belongs to the learner's primary
     * SECTION class (learner.class_id); GROUP_BACKED/elective rosters must not inflate the
     * batch count. Class count intentionally includes every non-deleted class because any
     * linked class is a dependency that blocks deletion.
     *
     * Row shape: [batchId, classCount, studentCount].
     */
    @Query(value = "SELECT b.id, " +
            "COUNT(DISTINCT c.id) AS class_count, " +
            "COUNT(DISTINCT CASE WHEN c.class_type IS NULL OR c.class_type <> 'GROUP_BACKED' THEN l.id END) AS student_count " +
            "FROM batch b " +
            "LEFT JOIN class c ON c.batch_id = b.id AND (c.is_deleted = false OR c.is_deleted IS NULL) " +
            "LEFT JOIN learner l ON l.class_id = c.id AND (l.is_deleted = false OR l.is_deleted IS NULL) " +
            "WHERE b.id IN (:batchIds) " +
            "GROUP BY b.id", nativeQuery = true)
    List<Object[]> findUsageCounts(@Param("batchIds") List<Long> batchIds);

    /**
     * AQ-11: Get the current semester number for a class (via class → batch).
     * Returns null if class or batch not found.
     */
    @Query(value = "SELECT b.current_semester FROM batch b " +
            "INNER JOIN class c ON c.batch_id = b.id " +
            "WHERE c.id = :classId LIMIT 1", nativeQuery = true)
    Integer getCurrentSemesterByClassId(@Param("classId") int classId);

    /**
     * Optimistic update: only updates if current_semester matches (prevents concurrent promotion overwrites).
     * @return number of rows updated (0 or 1)
     */
    @Modifying
    @Query("UPDATE Batch b SET b.currentSemester = :newSem, b.updatedAt = :now WHERE b.id = :id AND b.currentSemester = :currentSem")
    int updateCurrentSemesterIfMatch(@Param("id") Long id, @Param("currentSem") Integer currentSem,
                                     @Param("newSem") Integer newSem, @Param("now") Date now);
}

