package com._42students.lms.repository;

import com._42students.lms.model._Class;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import javax.persistence.LockModeType;

@Repository
public interface _ClassRepository extends JpaRepository<_Class, Integer> {

    @Query(value = "select * from class where name=:classId or id=:classId", nativeQuery = true)
    _Class getClassDetail(@Param("classId") String classId);


    // GROUP_BACKED classes (elective offerings) stay in these unpaged lists on purpose: they feed
    // the lesson-content, attendance, timetable and faculty-assignment pickers, where an elective
    // class must be selectable (its name carries the "[Elective]" prefix). Only the paged Classes
    // management list below hides them; the Electives page manages their lifecycle.
    @Query(value = "SELECT * FROM class WHERE program_id = :programId", nativeQuery = true)
    List<_Class> getClassesByProgram(@Param("programId") int programId);

    @Query(value = "SELECT c.* FROM class c " +
            "INNER JOIN new_program p ON c.program_id = p.id " +
            "INNER JOIN department d ON p.dept_id = d.id " +
            "WHERE d.college_id = :collegeId", nativeQuery = true)
    List<_Class> getClassesByCollegeId(@Param("collegeId") int collegeId);

    /** The GROUP_BACKED classes a learner belongs to through a live (non-archived) group. */
    @Query(value = "SELECT c.id FROM class c " +
            "JOIN lms_group_member m ON m.group_id = c.roster_group_id " +
            "JOIN lms_group g ON g.id = c.roster_group_id " +
            "WHERE m.member_type = 'LEARNER' AND m.member_id = :learnerId AND m.state = 'ACTIVE' " +
            "AND g.status <> 'ARCHIVED' AND (g.is_deleted = false OR g.is_deleted IS NULL) " +
            "AND (c.is_deleted = false OR c.is_deleted IS NULL)", nativeQuery = true)
    List<Integer> findGroupBackedClassIdsForLearner(@Param("learnerId") int learnerId);

    // A2 in the super-admin audit: the academic structure had no pagination anywhere, so every
    // list endpoint returned every row for a college in one response. Additive paged variant --
    // the unpaged method above is untouched, so no existing caller changes behaviour. Native
    // queries need an explicit countQuery for Spring Data to paginate them.
    @Query(value = "SELECT c.* FROM class c INNER JOIN new_program p ON c.program_id = p.id INNER JOIN department d ON p.dept_id = d.id WHERE d.college_id = :collegeId AND c.class_type = 'SECTION'",
            countQuery = "SELECT count(*) FROM class c INNER JOIN new_program p ON c.program_id = p.id INNER JOIN department d ON p.dept_id = d.id WHERE d.college_id = :collegeId AND c.class_type = 'SECTION'",
            nativeQuery = true)
    org.springframework.data.domain.Page<_Class> getClassesByCollegeIdPaged(@Param("collegeId") int collegeId,
            org.springframework.data.domain.Pageable pageable);


    @Query(value = "SELECT c2.* FROM class c2 " +
            "INNER JOIN new_program p ON c2.program_id = p.id " +
            "INNER JOIN department d ON p.dept_id = d.id " +
            "INNER JOIN college c ON d.college_id = c.id " +
            "WHERE c.org_id = :orgId", nativeQuery = true)
    List<_Class> getClassesByOrganizationId(@Param("orgId") int orgId);

    /**
     * For scope resolution: return class only if not soft-deleted.
     */
    @Query(value = "SELECT * FROM class WHERE id = :id AND (is_deleted = false OR is_deleted IS NULL) LIMIT 1", nativeQuery = true)
    java.util.Optional<_Class> findByIdAndNotDeleted(@Param("id") Integer id);

    /**
     * Canonical CURRENT course audience.
     *
     * A class is targetable for a course when the class and course resolve to the same live
     * college hierarchy and at least one of these is true:
     *  1) an active explicit teaching assignment exists for that exact course/class;
     *  2) a normal SECTION class belongs to an ACTIVE batch whose current semester maps the
     *     course through semester_course; or
     *  3) a GROUP_BACKED class is the backed class of a live elective offering for the course.
     *
     * Historical content is deliberately NOT part of this query. Old content can remain
     * reviewable after a cohort advances, but new targeting must use current academic state.
     */
    String CURRENT_COURSE_AUDIENCE_SCOPE = " FROM class audience_class "
            + "JOIN new_program audience_program ON audience_program.id = audience_class.program_id "
            + " AND (audience_program.is_deleted = false OR audience_program.is_deleted IS NULL) "
            + "JOIN department audience_dept ON audience_dept.id = audience_program.dept_id "
            + " AND (audience_dept.is_deleted = false OR audience_dept.is_deleted IS NULL) "
            + "JOIN course audience_course ON audience_course.id = :courseId "
            + " AND (audience_course.is_deleted = false OR audience_course.is_deleted IS NULL) "
            + " AND (audience_course.active = true OR audience_course.active IS NULL) "
            + " AND (audience_course.enabled = true OR audience_course.enabled IS NULL) "
            + "JOIN department course_dept ON course_dept.id = audience_course.dept_id "
            + " AND (course_dept.is_deleted = false OR course_dept.is_deleted IS NULL) "
            + "WHERE (audience_class.is_deleted = false OR audience_class.is_deleted IS NULL) "
            + "AND audience_dept.college_id = course_dept.college_id "
            + "AND ("
            + " EXISTS (SELECT 1 FROM faculty_teaching_assignment teaching "
            + "         WHERE teaching.class_id = audience_class.id AND teaching.course_id = :courseId "
            + "         AND teaching.is_active = true "
            + "         AND (teaching.is_deleted = false OR teaching.is_deleted IS NULL)) "
            + " OR (((audience_class.class_type = 'SECTION') OR audience_class.class_type IS NULL) "
            + "     AND EXISTS (SELECT 1 FROM batch b "
            + "                 JOIN semester term ON term.program_id = audience_class.program_id "
            + "                  AND term.semester_number = COALESCE(b.current_semester, 1) "
            + "                  AND (term.is_deleted = false OR term.is_deleted IS NULL) "
            + "                  AND (term.is_active = true OR term.is_active IS NULL) "
            + "                 JOIN semester_course mapped ON mapped.semester_id = term.id "
            + "                  AND mapped.course_id = :courseId "
            + "                  AND (mapped.is_deleted = false OR mapped.is_deleted IS NULL) "
            + "                 WHERE b.id = audience_class.batch_id "
            + "                  AND b.program_id = audience_class.program_id "
            + "                  AND b.status = 'ACTIVE')) "
            + " OR (audience_class.class_type = 'GROUP_BACKED' "
            + "     AND EXISTS (SELECT 1 FROM elective_offering eo "
            + "                 JOIN lms_group g ON g.id = eo.group_id "
            + "                 JOIN elective_slot slot ON slot.id = eo.slot_id "
            + "                 WHERE eo.backed_class_id = audience_class.id "
            + "                  AND eo.course_id = :courseId "
            + "                  AND eo.status = 'ACTIVE' "
            + "                  AND (eo.is_deleted = false OR eo.is_deleted IS NULL) "
            + "                  AND g.college_id = audience_dept.college_id "
            + "                  AND g.status <> 'ARCHIVED' "
            + "                  AND (g.is_deleted = false OR g.is_deleted IS NULL) "
            + "                  AND slot.college_id = audience_dept.college_id "
            + "                  AND slot.status = 'ACTIVE' "
            + "                  AND (slot.is_deleted = false OR slot.is_deleted IS NULL)))"
            + ") ";

    @Query(value = "SELECT DISTINCT audience_class.* " + CURRENT_COURSE_AUDIENCE_SCOPE
            + " ORDER BY audience_class.name, audience_class.id", nativeQuery = true)
    List<_Class> findCurrentEligibleClassesForCourse(@Param("courseId") int courseId);

    @Query(value = "SELECT COUNT(DISTINCT audience_class.id) " + CURRENT_COURSE_AUDIENCE_SCOPE
            + " AND audience_class.id = :classId", nativeQuery = true)
    long countCurrentEligibleClassForCourse(@Param("classId") int classId, @Param("courseId") int courseId);

    default boolean isCurrentEligibleClassForCourse(int classId, int courseId) {
        return countCurrentEligibleClassForCourse(classId, courseId) > 0;
    }

    // MySQL has no real BOOLEAN type — `COUNT(*) > 0` comes back over JDBC as a numeric type
    // (BigInteger/Long depending on driver version), which Hibernate's native-query result
    // mapping cannot cast to Java Boolean, so this always threw ClassCastException at call time
    // rather than ever returning a result. Returning the count and comparing in the caller
    // avoids the boolean-mapping problem entirely.
    @Query(value = "SELECT COUNT(*) FROM class c " +
            "INNER JOIN new_program p ON c.program_id = p.id " +
            "INNER JOIN department d ON p.dept_id = d.id " +
            "WHERE c.id = :classId AND d.college_id = :collegeId", nativeQuery = true)
    long countByIdAndCollegeId(@Param("classId") int classId, @Param("collegeId") int collegeId);

    default boolean existsByIdAndCollegeId(int classId, int collegeId) {
        return countByIdAndCollegeId(classId, collegeId) > 0;
    }

    List<_Class> findByBatchId(Integer batchId);

    /**
     * Case-insensitive name check within a batch, used to enforce app-level uniqueness on
     * create/update (no unique index exists on class.name at the DB level).
     */
    @Query(value = "SELECT * FROM class WHERE batch_id = :batchId AND LOWER(name) = LOWER(:name)", nativeQuery = true)
    List<_Class> findByBatchIdAndNameIgnoreCase(@Param("batchId") Integer batchId, @Param("name") String name);

    /**
     * Case-insensitive name check within a program, used when a class has no batch assigned.
     */
    @Query(value = "SELECT * FROM class WHERE program_id = :programId AND LOWER(name) = LOWER(:name)", nativeQuery = true)
    List<_Class> findByProgramIdAndNameIgnoreCase(@Param("programId") int programId, @Param("name") String name);

    /**
     * Row-level PESSIMISTIC_WRITE lock, held for the remainder of the caller's transaction. Used
     * by bulkCreateProjectsForClass's duplicate-workspace guard: the DB uniqueness constraint on
     * (class_id, template_id, bulk_learner_id) can't catch two concurrent no-template bulk-create
     * requests for the same class, since MySQL treats every NULL template_id as distinct. Locking
     * the class row gives real cross-request (and cross-pod) serialization for the
     * check-then-create critical section regardless of whether a template is selected.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM class c WHERE c.id = :id")
    java.util.Optional<_Class> findByIdForUpdate(@Param("id") Integer id);
}
 

