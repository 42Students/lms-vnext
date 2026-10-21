package com._42students.lms.repository;


import com._42students.lms.model.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseRepository extends JpaRepository<Course, Integer> {
    // Soft-deleted courses must not surface in any listing. These four queries previously had no
    // is_deleted filter, so a deleted course kept appearing in the department list, the
    // college-admin course list, the org list and by-id fetches — while requireAccessCourse
    // (which resolves scope via findByIdAndNotDeleted) 404s on it. That produced rows an admin
    // could see but never open.
    @Query(value = "select * from course where dept_id=:deptId and (is_deleted = false or is_deleted is null)", nativeQuery = true)
    List<Course> fetchCourses(@Param("deptId") int deptId);

    @Query(value = "SELECT c.* FROM course c " +
            "INNER JOIN department d ON c.dept_id = d.id " +
            "WHERE d.college_id = :collegeId AND (c.is_deleted = false OR c.is_deleted IS NULL)", nativeQuery = true)
    List<Course> fetchByCollegeId(@Param("collegeId") int collegeId);

    /**
     * 6.5: paginated variant of fetchByCollegeId. The unpaginated list endpoints stay as-is (a
     * breaking response-shape change for any existing caller); this is additive, for a caller that
     * wants to page through a large college's course list instead of pulling every row.
     */
    @Query(value = "SELECT c.* FROM course c " +
            "INNER JOIN department d ON c.dept_id = d.id " +
            "WHERE d.college_id = :collegeId AND (c.is_deleted = false OR c.is_deleted IS NULL)",
            countQuery = "SELECT COUNT(*) FROM course c " +
            "INNER JOIN department d ON c.dept_id = d.id " +
            "WHERE d.college_id = :collegeId AND (c.is_deleted = false OR c.is_deleted IS NULL)",
            nativeQuery = true)
    Page<Course> fetchByCollegeIdPaged(@Param("collegeId") int collegeId, Pageable pageable);

    /**
     * Soft-deleted courses for a college, newest-deleted first. Backs the restore screen — a
     * course had no recovery path through the product at all before this; only a developer with
     * SQL access could bring one back.
     */
    @Query(value = "SELECT c.* FROM course c " +
            "INNER JOIN department d ON c.dept_id = d.id " +
            "WHERE d.college_id = :collegeId AND c.is_deleted = true " +
            "ORDER BY c.updated_at DESC", nativeQuery = true)
    List<Course> fetchDeletedByCollegeId(@Param("collegeId") int collegeId);

    @Query(value = "SELECT crs.* FROM course crs " +
            "INNER JOIN department d ON crs.dept_id = d.id " +
            "INNER JOIN college c ON d.college_id = c.id " +
            "WHERE c.org_id = :orgId AND (crs.is_deleted = false OR crs.is_deleted IS NULL)", nativeQuery = true)
    List<Course> fetchByOrganizationId(@Param("orgId") int orgId);

    @Query(value = "select * from course where id=:courseId and (is_deleted = false or is_deleted is null)", nativeQuery = true)
    Course fetchCourse(@Param("courseId") int courseId);
    
    /**
     * Find course by slug (public identifier)
     * @param slug The course slug
     * @return Course if found, null otherwise
     */
    // CC-06: exclude soft-deleted courses from slug resolution
    @Query(value = "select * from course where slug=:slug and (is_deleted = false or is_deleted is null)", nativeQuery = true)
    Course findBySlug(@Param("slug") String slug);
    
    /**
     * All non-deleted courses. Backs the global super-admin listing, which previously used the
     * inherited findAll() and therefore returned soft-deleted courses alongside live ones.
     */
    @Query(value = "select * from course where (is_deleted = false or is_deleted is null)", nativeQuery = true)
    List<Course> findAllNotDeleted();

    /** 6.5: paginated variant of findAllNotDeleted, for the global (unscoped) super-admin listing. */
    @Query(value = "select * from course where (is_deleted = false or is_deleted is null)",
            countQuery = "select count(*) from course where (is_deleted = false or is_deleted is null)",
            nativeQuery = true)
    Page<Course> findAllNotDeletedPaged(Pageable pageable);

    /**
     * Check if a slug already exists.
     *
     * Deliberately does NOT filter soft-deleted rows: a deleted course keeps its slug reserved so
     * that an old bookmark or external link can never silently resolve to a different course that
     * later reused the same slug. This is only consulted for client-supplied slugs — generated
     * slugs are random (CourseSlugGenerator), so reservation costs nothing in practice.
     *
     * @param slug The slug to check
     * @return true if exists, false otherwise
     */
    boolean existsBySlug(String slug);

    /**
     * Find all courses that have no slug (for backfill)
     * @return List of courses with slug IS NULL
     */
    @Query(value = "select * from course where slug is null", nativeQuery = true)
    List<Course> findBySlugIsNull();

    /**
     * For scope resolution: return course only if not soft-deleted.
     */
    @Query(value = "SELECT * FROM course WHERE id = :id AND (is_deleted = false OR is_deleted IS NULL) LIMIT 1", nativeQuery = true)
    java.util.Optional<Course> findByIdAndNotDeleted(@Param("id") Integer id);

    /**
     * Duplicate check for course creation: is there already a non-deleted course in this
     * department with the same course_name or short_title (case-insensitive)?
     */
    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM course " +
            "WHERE dept_id = :deptId AND (is_deleted = false OR is_deleted IS NULL) " +
            "AND (LOWER(course_name) = LOWER(:courseName) OR LOWER(short_title) = LOWER(:shortTitle))",
            nativeQuery = true)
    Integer existsByDeptIdAndCourseNameOrShortTitle(@Param("deptId") int deptId,
                                                      @Param("courseName") String courseName,
                                                      @Param("shortTitle") String shortTitle);

    /**
     * Same duplicate check as above, excluding the course's own id (for updates).
     */
    @Query(value = "SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END FROM course " +
            "WHERE dept_id = :deptId AND id <> :excludeId AND (is_deleted = false OR is_deleted IS NULL) " +
            "AND (LOWER(course_name) = LOWER(:courseName) OR LOWER(short_title) = LOWER(:shortTitle))",
            nativeQuery = true)
    Integer existsByDeptIdAndCourseNameOrShortTitleExcludingId(@Param("deptId") int deptId,
                                                                 @Param("courseName") String courseName,
                                                                 @Param("shortTitle") String shortTitle,
                                                                 @Param("excludeId") int excludeId);

    /**
     * Resolves the course that currently references a given R2 storage key as its image —
     * mirrors LessonContentsRepository#findByContentDataKeyContaining. Used to close the
     * course-images delete IDOR: the delete endpoint previously applied no ownership check at
     * all for this folder (only tenant-prefix), so any same-college user — including a learner
     * — could delete any other course's thumbnail by reading its key out of the public img src.
     */
    @Query(value = "SELECT * FROM course WHERE (is_deleted = false OR is_deleted IS NULL) " +
            "AND CAST(contents AS CHAR) LIKE CONCAT('%', :key, '%') LIMIT 5", nativeQuery = true)
    List<Course> findByContentsKeyContaining(@Param("key") String key);

    /**
     * Distinct courses that have lesson content scoped to (or shared with) a given class —
     * i.e. "courses this learner's class has content in". Backs the course-filter dropdown on
     * the All Quizzes / All Assignments pages for learners (faculty use the existing
     * fetchAllCoursesByFacultyId endpoint instead, since they teach across explicit assignments).
     */
    @Query(value = "SELECT DISTINCT c.* FROM course c " +
            "INNER JOIN lesson_contents lc ON lc.course_id = c.id " +
            "WHERE lc.class_id = :classId AND (lc.is_deleted = false OR lc.is_deleted IS NULL) " +
            "AND (c.is_deleted = false OR c.is_deleted IS NULL) " +
            "ORDER BY c.course_name", nativeQuery = true)
    List<Course> findDistinctCoursesForClass(@Param("classId") int classId);

    /**
     * Candidate course filters for a learner's complete audience. Final current-semester/elective
     * eligibility is applied in the service via AccessControlService so this query stays focused
     * on content existence and can include both first-class quizzes and assignments.
     */
    @Query(value = "SELECT DISTINCT c.* FROM course c "
            + "WHERE (c.is_deleted = false OR c.is_deleted IS NULL) "
            + "AND ((c.active = true OR c.active IS NULL) AND (c.enabled = true OR c.enabled IS NULL)) "
            + "AND ("
            + " EXISTS (SELECT 1 FROM lesson_contents lc WHERE lc.course_id = c.id "
            + "         AND LOWER(lc.content_type) = 'assignment' "
            + "         AND (lc.class_id IS NULL OR lc.class_id < 1 OR lc.class_id IN (:classIds)) "
            + "         AND (lc.is_deleted = false OR lc.is_deleted IS NULL) "
            + "         AND (lc.enabled = true OR lc.enabled IS NULL) AND (lc.active = true OR lc.active IS NULL)) "
            + " OR EXISTS (SELECT 1 FROM quizzes q WHERE q.course_id = c.id "
            + "            AND (q.class_id IS NULL OR q.class_id < 1 OR q.class_id IN (:classIds)) "
            + "            AND q.status = 'PUBLISHED' "
            + "            AND (q.is_deleted = false OR q.is_deleted IS NULL) "
            + "            AND (q.enabled = true OR q.enabled IS NULL) AND (q.active = true OR q.active IS NULL)) "
            + ") ORDER BY c.course_name", nativeQuery = true)
    List<Course> findDistinctCoursesForAudienceClasses(@Param("classIds") List<Integer> classIds);

}

