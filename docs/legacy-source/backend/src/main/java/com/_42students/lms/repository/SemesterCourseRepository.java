package com._42students.lms.repository;

import com._42students.lms.model.SemesterCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SemesterCourseRepository extends JpaRepository<SemesterCourse, Integer> {

    // A soft-deleted mapping must not remain a visible learner course. Preserve null for legacy rows.
    @Query("SELECT sc FROM SemesterCourse sc WHERE sc.semesterId = :semesterId " +
           "AND (sc.isDeleted = false OR sc.isDeleted IS NULL) " +
           "ORDER BY sc.courseOrder ASC, sc.id ASC")
    List<SemesterCourse> findBySemesterIdOrderByCourseOrder(@Param("semesterId") Integer semesterId);

    // Curriculum access must agree with listing after a mapping or semester is soft-deleted.
    // Historical, non-deleted semesters remain accessible under the existing academic policy.
    @Query("SELECT CASE WHEN COUNT(sc) > 0 THEN true ELSE false END "
            + "FROM SemesterCourse sc, Semester s "
            + "WHERE sc.semesterId = s.id AND s.programId = :programId AND sc.courseId = :courseId "
            + "AND (sc.isDeleted = false OR sc.isDeleted IS NULL) "
            + "AND (s.isDeleted = false OR s.isDeleted IS NULL)")
    boolean existsByProgramIdAndCourseId(@Param("programId") Integer programId,
                                         @Param("courseId") Integer courseId);

    List<SemesterCourse> findBySemesterId(Integer semesterId);
    List<SemesterCourse> findBySemesterIdInOrderByCourseOrder(List<Integer> semesterIds);
    Optional<SemesterCourse> findBySemesterIdAndCourseId(Integer semesterId, Integer courseId);
    boolean existsBySemesterIdAndCourseId(Integer semesterId, Integer courseId);

    @Modifying
    @Query("DELETE FROM SemesterCourse sc WHERE sc.semesterId = :semesterId AND sc.courseId = :courseId")
    void deleteBySemesterIdAndCourseId(@Param("semesterId") Integer semesterId, @Param("courseId") Integer courseId);

    @Modifying
    @Query("DELETE FROM SemesterCourse sc WHERE sc.semesterId = :semesterId")
    void deleteBySemesterId(@Param("semesterId") Integer semesterId);

    @Query("SELECT sc.courseId FROM SemesterCourse sc WHERE sc.semesterId = :semesterId")
    List<Integer> findCourseIdsBySemesterId(@Param("semesterId") Integer semesterId);

    @Query("SELECT COALESCE(MAX(sc.courseOrder), 0) FROM SemesterCourse sc WHERE sc.semesterId = :semesterId")
    Integer findMaxCourseOrderBySemesterId(@Param("semesterId") Integer semesterId);

    @Query(value = "SELECT * FROM semester_course WHERE semester_id = :semesterId", nativeQuery = true)
    List<SemesterCourse> findBySemesterIdNative(@Param("semesterId") Integer semesterId);
}
