package com._42students.lms.repository;

import com._42students.lms.model.LectureHall;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface LectureHallRepository extends JpaRepository<LectureHall, Integer> {
    @Query(value = "SELECT * FROM lecture_hall WHERE college_id = :collegeId", nativeQuery = true)
    List<LectureHall> findByCollegeId(@Param("collegeId") int collegeId);

    // A2 in the super-admin audit: the academic structure had no pagination anywhere, so every
    // list endpoint returned every row for a college in one response. Additive paged variant --
    // the unpaged method above is untouched, so no existing caller changes behaviour. Native
    // queries need an explicit countQuery for Spring Data to paginate them.
    @Query(value = "SELECT * FROM lecture_hall WHERE college_id = :collegeId",
            countQuery = "SELECT count(*) FROM lecture_hall WHERE college_id = :collegeId",
            nativeQuery = true)
    org.springframework.data.domain.Page<LectureHall> findByCollegeIdPaged(@Param("collegeId") int collegeId,
            org.springframework.data.domain.Pageable pageable);


    @Query(value = "SELECT * FROM lecture_hall WHERE dept_id = :deptId", nativeQuery = true)
    List<LectureHall> findByDeptId(@Param("deptId") int deptId);

    @Query(value = "SELECT lh.* FROM lecture_hall lh " +
            "INNER JOIN college c ON lh.college_id = c.id " +
            "WHERE c.org_id = :orgId", nativeQuery = true)
    List<LectureHall> findByOrganizationId(@Param("orgId") int orgId);

    /**
     * Case-insensitive name check within a college, used to enforce app-level uniqueness on create/update.
     */
    @Query(value = "SELECT * FROM lecture_hall WHERE college_id = :collegeId AND LOWER(name) = LOWER(:name)", nativeQuery = true)
    List<LectureHall> findByCollegeIdAndNameIgnoreCase(@Param("collegeId") int collegeId, @Param("name") String name);

    /**
     * Row-level PESSIMISTIC_WRITE lock, held for the remainder of the caller's transaction.
     * Used by ClassScheduleServiceImpl.create() to close the TOCTOU window between the
     * lecture-hall-conflict check and the class_schedule INSERT: a JVM-local synchronized lock
     * would only serialize concurrent requests within one pod, which is not enough once the app
     * runs multiple backend replicas. Locking the lecture hall's own row via the DB gives real
     * cross-pod serialization for the check-then-insert critical section.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT lh FROM lecture_hall lh WHERE lh.id = :id")
    Optional<LectureHall> findByIdForUpdate(@Param("id") Integer id);
}

