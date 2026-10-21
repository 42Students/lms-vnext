package com._42students.lms.repository;

import com._42students.lms.model.FacultyTeachingAssignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyTeachingAssignmentRepository extends JpaRepository<FacultyTeachingAssignment, Integer> {


    @Query(value = "SELECT fta.* FROM faculty_teaching_assignment fta " +
            "JOIN class cl ON cl.id = fta.class_id " +
            "JOIN new_program p ON p.id = cl.program_id " +
            "JOIN department d ON d.id = p.dept_id " +
            "WHERE d.college_id = :collegeId " +
            "AND (fta.is_deleted = 0 OR fta.is_deleted IS NULL) " +
            "AND (:classId IS NULL OR fta.class_id = :classId) " +
            "ORDER BY fta.id DESC",
            countQuery = "SELECT COUNT(*) FROM faculty_teaching_assignment fta " +
            "JOIN class cl ON cl.id = fta.class_id " +
            "JOIN new_program p ON p.id = cl.program_id " +
            "JOIN department d ON d.id = p.dept_id " +
            "WHERE d.college_id = :collegeId " +
            "AND (fta.is_deleted = 0 OR fta.is_deleted IS NULL) " +
            "AND (:classId IS NULL OR fta.class_id = :classId)",
            nativeQuery = true)
    Page<FacultyTeachingAssignment> findAdminPageByCollege(
            @Param("collegeId") Integer collegeId,
            @Param("classId") Integer classId,
            Pageable pageable);

    // A logically removed mapping must not be listed, counted or used for current teaching permissions.
    // Preserve legacy NULL flags because those assignments were not explicitly removed.
    @Query("SELECT f FROM FacultyTeachingAssignment f WHERE f.facultyId = :facultyId " +
           "AND f.isActive = :isActive AND (f.isDeleted = false OR f.isDeleted IS NULL) " +
           "ORDER BY f.courseId ASC, f.classId ASC, f.id ASC")
    List<FacultyTeachingAssignment> findByFacultyIdAndIsActive(
            @Param("facultyId") Integer facultyId, @Param("isActive") Boolean isActive);

    List<FacultyTeachingAssignment> findByFacultyId(Integer facultyId);

    @Query("SELECT f FROM FacultyTeachingAssignment f WHERE f.classId = :classId " +
           "AND f.isActive = :isActive AND (f.isDeleted = false OR f.isDeleted IS NULL) " +
           "ORDER BY f.courseId ASC, f.id ASC")
    List<FacultyTeachingAssignment> findByClassIdAndIsActive(
            @Param("classId") Integer classId, @Param("isActive") Boolean isActive);

    @Query("SELECT f FROM FacultyTeachingAssignment f WHERE f.classId = :classId " +
           "AND f.semesterNumber = :semesterNumber AND f.isActive = :isActive " +
           "AND (f.isDeleted = false OR f.isDeleted IS NULL) ORDER BY f.courseId ASC, f.id ASC")
    List<FacultyTeachingAssignment> findByClassIdAndSemesterNumberAndIsActive(
        @Param("classId") Integer classId, @Param("semesterNumber") Integer semesterNumber,
        @Param("isActive") Boolean isActive);

    @Query("SELECT f FROM FacultyTeachingAssignment f WHERE f.batchId = :batchId " +
           "AND f.isActive = :isActive AND (f.isDeleted = false OR f.isDeleted IS NULL) " +
           "ORDER BY f.courseId ASC, f.classId ASC, f.id ASC")
    List<FacultyTeachingAssignment> findByBatchIdAndIsActive(
        @Param("batchId") Integer batchId, @Param("isActive") Boolean isActive);

    @Query("SELECT f FROM FacultyTeachingAssignment f WHERE f.batchId = :batchId " +
           "AND f.semesterNumber = :semesterNumber AND f.isActive = :isActive " +
           "AND (f.isDeleted = false OR f.isDeleted IS NULL) ORDER BY f.courseId ASC, f.id ASC")
    List<FacultyTeachingAssignment> findByBatchIdAndSemesterNumberAndIsActive(
        @Param("batchId") Integer batchId, @Param("semesterNumber") Integer semesterNumber,
        @Param("isActive") Boolean isActive);

    @Query("SELECT f FROM FacultyTeachingAssignment f WHERE f.courseId = :courseId " +
           "AND f.isActive = :isActive AND (f.isDeleted = false OR f.isDeleted IS NULL) " +
           "ORDER BY f.classId ASC, f.id ASC")
    List<FacultyTeachingAssignment> findByCourseIdAndIsActive(
        @Param("courseId") Integer courseId, @Param("isActive") Boolean isActive);

    Optional<FacultyTeachingAssignment> findByFacultyIdAndCourseIdAndClassIdAndSemesterNumberAndAcademicYear(
        Integer facultyId, Integer courseId, Integer classId, Integer semesterNumber, String academicYear);

    // The single-result query must limit at the database, because multiple co-instructors may
    // exist for one class/course. An unbounded JPQL Optional query would fail on >1 match.
    @Query("SELECT f FROM FacultyTeachingAssignment f WHERE f.courseId = :courseId " +
           "AND f.classId = :classId AND f.isActive = :isActive " +
           "AND (f.isDeleted = false OR f.isDeleted IS NULL) ORDER BY f.id ASC")
    List<FacultyTeachingAssignment> findEligibleCourseClassAssignments(
        @Param("courseId") Integer courseId, @Param("classId") Integer classId,
        @Param("isActive") Boolean isActive, Pageable pageable);

    default Optional<FacultyTeachingAssignment> findFirstByCourseIdAndClassIdAndIsActive(
            Integer courseId, Integer classId, Boolean isActive) {
        return findEligibleCourseClassAssignments(courseId, classId, isActive, PageRequest.of(0, 1))
                .stream().findFirst();
    }

    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM FacultyTeachingAssignment f " +
           "WHERE f.facultyId = :facultyId AND f.courseId = :courseId AND f.classId = :classId " +
           "AND f.isActive = :isActive AND (f.isDeleted = false OR f.isDeleted IS NULL)")
    boolean existsByFacultyIdAndCourseIdAndClassIdAndIsActive(
        @Param("facultyId") Integer facultyId, @Param("courseId") Integer courseId,
        @Param("classId") Integer classId, @Param("isActive") Boolean isActive);

    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM FacultyTeachingAssignment f " +
           "WHERE f.facultyId = :facultyId AND f.courseId = :courseId " +
           "AND f.isActive = :isActive AND (f.isDeleted = false OR f.isDeleted IS NULL)")
    boolean existsByFacultyIdAndCourseIdAndIsActive(
        @Param("facultyId") Integer facultyId, @Param("courseId") Integer courseId,
        @Param("isActive") Boolean isActive);

    /** Teaches anything in this class (legacy class-only content without a course). */
    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM FacultyTeachingAssignment f " +
           "WHERE f.facultyId = :facultyId AND f.classId = :classId " +
           "AND f.isActive = :isActive AND (f.isDeleted = false OR f.isDeleted IS NULL)")
    boolean existsByFacultyIdAndClassIdAndIsActive(
        @Param("facultyId") Integer facultyId, @Param("classId") Integer classId,
        @Param("isActive") Boolean isActive);

    @Modifying
    @Query("UPDATE FacultyTeachingAssignment f SET f.isActive = false " +
           "WHERE f.classId = :classId AND f.semesterNumber = :semesterNumber")
    void deactivateByClassAndSemester(@Param("classId") Integer classId,
                                       @Param("semesterNumber") Integer semesterNumber);

    @Modifying
    @Query("UPDATE FacultyTeachingAssignment f SET f.isActive = false " +
           "WHERE f.batchId = :batchId AND f.semesterNumber = :semesterNumber")
    void deactivateByBatchAndSemester(@Param("batchId") Integer batchId,
                                       @Param("semesterNumber") Integer semesterNumber);

    @Modifying
    @Query("UPDATE FacultyTeachingAssignment f SET f.isActive = true " +
           "WHERE f.batchId = :batchId AND f.semesterNumber = :semesterNumber")
    void reactivateByBatchAndSemester(@Param("batchId") Integer batchId,
                                       @Param("semesterNumber") Integer semesterNumber);

    @Query("SELECT f FROM FacultyTeachingAssignment f WHERE f.isActive = :isActive " +
           "AND (f.isDeleted = false OR f.isDeleted IS NULL) ORDER BY f.id ASC")
    List<FacultyTeachingAssignment> findByIsActive(@Param("isActive") Boolean isActive);

    @Query("SELECT CASE WHEN COUNT(f) > 0 THEN true ELSE false END FROM FacultyTeachingAssignment f " +
           "WHERE f.facultyId = :facultyId AND f.courseId = :courseId AND f.classId = :classId " +
           "AND f.semesterNumber = :semesterNumber AND f.isActive = :isActive " +
           "AND (f.isDeleted = false OR f.isDeleted IS NULL)")
    boolean existsByFacultyIdAndCourseIdAndClassIdAndSemesterNumberAndIsActive(
        @Param("facultyId") Integer facultyId, @Param("courseId") Integer courseId,
        @Param("classId") Integer classId, @Param("semesterNumber") Integer semesterNumber,
        @Param("isActive") Boolean isActive);
}
