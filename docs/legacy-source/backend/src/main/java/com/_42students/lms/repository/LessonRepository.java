package com._42students.lms.repository;

import com._42students.lms.model.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Integer> {
    // CC-05: exclude soft-deleted lessons
    @Query(value = "select * from lesson where course_id=:courseId and (is_deleted = false or is_deleted is null) order by sequence asc, id asc", nativeQuery = true)
    List<Lesson> getLessons(@Param("courseId") int courseId);

    /**
     * Soft-deleted lessons for a college, newest-deleted first. Backs the restore screen.
     * Restoring a lesson does NOT cascade-restore its content rows — see the comment on
     * LessonServiceImpl#restoreLesson for why — and any uploaded file the original delete already
     * destroyed via best-effort R2 cleanup is gone regardless.
     */
    @Query(value = "SELECT l.* FROM lesson l " +
            "INNER JOIN course c ON l.course_id = c.id " +
            "INNER JOIN department d ON c.dept_id = d.id " +
            "WHERE d.college_id = :collegeId AND l.is_deleted = true " +
            "ORDER BY l.updated_at DESC", nativeQuery = true)
    List<Lesson> fetchDeletedByCollegeId(@Param("collegeId") int collegeId);

    // Excludes soft-deleted lessons: sequence numbers were previously derived from deleted rows
    // too, so every delete permanently inflated the next sequence and left growing gaps.
    @Query(value = "select coalesce(max(sequence), 0) from lesson where course_id=:courseId and (is_deleted = false or is_deleted is null)", nativeQuery = true)
    long getMaxSequenceByCourseId(@Param("courseId") int courseId);

    /**
     * Whether another (non-deleted) lesson in the course already holds this sequence value.
     * Backs a collision check on update -- nothing previously enforced sequence uniqueness within
     * a course, so two lessons could silently share one, with the UI falling back to an arbitrary
     * id-order tie-break.
     */
    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM lesson " +
            "WHERE course_id = :courseId AND sequence = :sequence AND id != :excludeId " +
            "AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    Integer existsByCourseIdAndSequenceExcludingId(@Param("courseId") int courseId,
                                                    @Param("sequence") long sequence,
                                                    @Param("excludeId") int excludeId);

    /**
     * Count non-deleted lessons attached to a course. Used to guard against soft-deleting
     * a course that still has lessons (even with no lesson content), which would orphan them.
     */
    @Query(value = "select count(*) from lesson where course_id=:courseId and (is_deleted = false or is_deleted is null)", nativeQuery = true)
    int countActiveByCourseId(@Param("courseId") int courseId);

    List<Lesson> findAllByOrderByCourseIdAscSequenceAsc();

    // Excludes soft-deleted lessons. This is the workhorse behind content access, per-class
    // reordering, progress and update; without the filter a deleted lesson stayed fully
    // addressable — content could be attached to it and progress recorded against it.
    @Query(value = "select * from lesson where id=:lessonId and (is_deleted = false or is_deleted is null)", nativeQuery = true)
    Lesson fetchCourseId(@Param("lessonId") int lessonId);

    /**
     * MySQL returns boolean expressions as numeric (0/1). With native queries this can be mapped as
     * BigInteger, which breaks boolean projections. Return an integer flag instead.
     */
    // Case-insensitive, matching how course names are deduplicated
    // (CourseRepository#existsByDeptIdAndCourseNameOrShortTitle uses LOWER() on both sides).
    // This previously used a plain '=', so "Unit 1" and "unit 1" were rejected as duplicate
    // courses but accepted as duplicate lessons in the same course.
    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM lesson WHERE course_id = :courseId AND LOWER(lesson_name) = LOWER(:lessonName) AND (is_deleted IS NULL OR is_deleted = 0)", nativeQuery = true)
    Integer existsByCourseIdAndLessonName(@Param("courseId") int courseId, @Param("lessonName") String lessonName);

    /**
     * Lessons for courses in the given college (scope filtering).
     */
    @Query(value = "SELECT l.* FROM lesson l INNER JOIN course c ON l.course_id = c.id INNER JOIN department d ON c.dept_id = d.id WHERE d.college_id = :collegeId ORDER BY l.course_id ASC, l.sequence ASC, l.id ASC", nativeQuery = true)
    List<Lesson> findByCollegeId(@Param("collegeId") int collegeId);

    // A2 in the super-admin audit: the academic structure had no pagination anywhere, so every
    // list endpoint returned every row for a college in one response. Additive paged variant --
    // the unpaged method above is untouched, so no existing caller changes behaviour. Native
    // queries need an explicit countQuery for Spring Data to paginate them.
    @Query(value = "SELECT l.* FROM lesson l INNER JOIN course c ON l.course_id = c.id INNER JOIN department d ON c.dept_id = d.id WHERE d.college_id = :collegeId ORDER BY l.course_id ASC, l.sequence ASC, l.id ASC",
            countQuery = "SELECT count(*) FROM lesson l INNER JOIN course c ON l.course_id = c.id INNER JOIN department d ON c.dept_id = d.id WHERE d.college_id = :collegeId",
            nativeQuery = true)
    org.springframework.data.domain.Page<Lesson> findByCollegeIdPaged(@Param("collegeId") int collegeId,
            org.springframework.data.domain.Pageable pageable);


    @Query(value = "SELECT l.* FROM lesson l " +
            "INNER JOIN course crs ON l.course_id = crs.id " +
            "INNER JOIN department d ON crs.dept_id = d.id " +
            "INNER JOIN college c ON d.college_id = c.id " +
            "WHERE c.org_id = :orgId " +
            "ORDER BY l.course_id ASC, l.sequence ASC, l.id ASC", nativeQuery = true)
    List<Lesson> findByOrganizationId(@Param("orgId") int orgId);

    // Non-security #31: /lesson/fetchAll returned every lesson in scope in one response -- for an
    // unscoped super-admin, every lesson on the platform. These are additive paged variants; the
    // unpaged methods above are untouched, so no existing caller changes behaviour.
    @Query(value = "SELECT l.* FROM lesson l " +
            "INNER JOIN course crs ON l.course_id = crs.id " +
            "INNER JOIN department d ON crs.dept_id = d.id " +
            "INNER JOIN college c ON d.college_id = c.id " +
            "WHERE c.org_id = :orgId " +
            "ORDER BY l.course_id ASC, l.sequence ASC, l.id ASC",
            countQuery = "SELECT count(*) FROM lesson l " +
            "INNER JOIN course crs ON l.course_id = crs.id " +
            "INNER JOIN department d ON crs.dept_id = d.id " +
            "INNER JOIN college c ON d.college_id = c.id " +
            "WHERE c.org_id = :orgId",
            nativeQuery = true)
    org.springframework.data.domain.Page<Lesson> findByOrganizationIdPaged(@Param("orgId") int orgId,
            org.springframework.data.domain.Pageable pageable);

    /** Derived query, so Spring Data builds the count for us. */
    org.springframework.data.domain.Page<Lesson> findAllByOrderByCourseIdAscSequenceAsc(
            org.springframework.data.domain.Pageable pageable);
}
 

