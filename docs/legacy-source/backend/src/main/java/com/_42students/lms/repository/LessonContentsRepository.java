package com._42students.lms.repository;

import com._42students.lms.model.LessonContents;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonContentsRepository extends JpaRepository<LessonContents, Integer> {
    @Query(value = "select * from lesson_contents where id=:lessonContentId", nativeQuery = true)
    LessonContents getLessonContents(@Param("lessonContentId") int lessonContentId);

    @Query(value = "SELECT * FROM lesson_contents WHERE id IN :ids", nativeQuery = true)
    List<LessonContents> findByIdIn(@Param("ids") List<Integer> ids);

    /** Audit 5.5: every live content id in a course, for starting a learner's next attempt. */
    @Query(value = "SELECT c.id FROM lesson_contents c WHERE c.course_id = :courseId "
            + "AND (c.is_deleted IS NULL OR c.is_deleted = 0)", nativeQuery = true)
    List<Integer> findIdsByCourseId(@Param("courseId") int courseId);

    /**
     * Count of LIVE content items on a course. Guards course deletion.
     * Previously counted soft-deleted rows too, which meant a course whose content had all been
     * deleted could never itself be deleted — the guard reported content that no longer existed.
     */
    @Query(value = "SELECT COUNT(*) FROM lesson_contents WHERE course_id = :courseId "
            + "AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    int countByCourseId(@Param("courseId") int courseId);

    // Generic contents only; secondary ID makes tied sequence values deterministic.
    @Query(value = "SELECT * FROM lesson_contents WHERE lesson_id = :lessonId AND (class_id IS NULL OR class_id < 1) AND (is_deleted = false OR is_deleted IS NULL) ORDER BY sequence, id", nativeQuery = true)
    List<LessonContents> fetchLessonContents(@Param("lessonId") int lessonId);

    @Query(value = "SELECT * FROM lesson_contents WHERE lesson_id = :lessonId AND (is_deleted = false OR is_deleted IS NULL) ORDER BY sequence, id", nativeQuery = true)
    List<LessonContents> fetchLessonContents1(@Param("lessonId") int lessonId);

    /** Every content row of a lesson, archived ones included (a lesson moving course takes all of them along, BE-0142). */
    @Query(value = "SELECT * FROM lesson_contents WHERE lesson_id = :lessonId", nativeQuery = true)
    List<LessonContents> findAllForLesson(@Param("lessonId") int lessonId);

    /** Rows archived specifically because their parent lesson was deleted; safe to restore with it. */
    List<LessonContents> findByLessonIdAndDeletedWithLessonTrue(int lessonId);

    @Query(value = "SELECT * FROM lesson_contents WHERE lesson_id = :lessonId AND class_id = :classId" +
            " AND (is_deleted = false OR is_deleted IS NULL) ORDER BY sequence, id", nativeQuery = true)
    List<LessonContents> fetchSpecificLessonContents(@Param("lessonId") int lessonId,
                                                     @Param("classId") int classId);

    /** Single-query generic + class-specific contents, ordered deterministically. */
    @Query(value = "SELECT * FROM lesson_contents " +
            "WHERE lesson_id = :lessonId AND (class_id IS NULL OR class_id < 1 OR class_id = :classId) " +
            "AND (is_deleted = false OR is_deleted IS NULL) " +
            "ORDER BY sequence, id", nativeQuery = true)
    List<LessonContents> fetchCombinedLessonContents(@Param("lessonId") int lessonId,
                                                      @Param("classId") int classId);

    @Query(value = "SELECT * FROM lesson_contents WHERE faculty_id = :facultyId AND content_type = 'assignment'" +
            " AND (is_deleted = false OR is_deleted IS NULL) ORDER BY created_at DESC", nativeQuery = true)
    List<LessonContents> fetchAllAssignments(@Param("facultyId") int facultyId);

    /**
     * Learner assignments must be scoped by BOTH tenant and curriculum/teaching eligibility.
     * Shared class_id NULL/0 means shared among eligible sections of a COURSE, not every
     * college in the database. Resolve the tenant through class -> program -> department and
     * course -> department; accept courses either actively taught to the class or mapped to
     * the class's program curriculum (the same fallback as AccessControlService.canAccessCourse).
     * Fail closed if the class/program/department hierarchy has been deleted.
     */
    String LEARNER_ASSIGNMENT_SCOPE = " FROM lesson_contents lc "
            + "JOIN course c ON c.id = lc.course_id "
            + " AND (c.is_deleted = false OR c.is_deleted IS NULL) "
            + " AND (c.active = true OR c.active IS NULL) AND (c.enabled = true OR c.enabled IS NULL) "
            + "JOIN department course_dept ON course_dept.id = c.dept_id AND (course_dept.is_deleted = false OR course_dept.is_deleted IS NULL) "
            + "JOIN class audience_class ON audience_class.id = :classId AND (audience_class.is_deleted = false OR audience_class.is_deleted IS NULL) "
            + "JOIN new_program audience_program ON audience_program.id = audience_class.program_id AND (audience_program.is_deleted = false OR audience_program.is_deleted IS NULL) "
            + "JOIN department audience_dept ON audience_dept.id = audience_program.dept_id AND (audience_dept.is_deleted = false OR audience_dept.is_deleted IS NULL) "
            + "WHERE course_dept.college_id = audience_dept.college_id "
            + "AND (lc.class_id = audience_class.id OR lc.class_id IS NULL OR lc.class_id < 1) "
            + "AND (EXISTS (SELECT 1 FROM faculty_teaching_assignment teaching "
            + "             WHERE teaching.class_id = audience_class.id AND teaching.course_id = lc.course_id "
            + "             AND teaching.is_active = true AND (teaching.is_deleted = false OR teaching.is_deleted IS NULL)) "
            + " OR (((audience_class.class_type = 'SECTION') OR audience_class.class_type IS NULL) "
            + "     AND EXISTS (SELECT 1 FROM batch b "
            + "                 JOIN semester term ON term.program_id = audience_class.program_id "
            + "                  AND term.semester_number = COALESCE(b.current_semester, 1) "
            + "                  AND (term.is_deleted = false OR term.is_deleted IS NULL) "
            + "                  AND (term.is_active = true OR term.is_active IS NULL) "
            + "                 JOIN semester_course mapped ON mapped.semester_id = term.id "
            + "                  AND mapped.course_id = lc.course_id "
            + "                  AND (mapped.is_deleted = false OR mapped.is_deleted IS NULL) "
            + "                 WHERE b.id = audience_class.batch_id AND b.program_id = audience_class.program_id "
            + "                  AND b.status = 'ACTIVE')) "
            + " OR (audience_class.class_type = 'GROUP_BACKED' "
            + "     AND EXISTS (SELECT 1 FROM elective_offering eo "
            + "                 JOIN lms_group g ON g.id = eo.group_id "
            + "                 JOIN elective_slot slot ON slot.id = eo.slot_id "
            + "                 WHERE eo.backed_class_id = audience_class.id AND eo.course_id = lc.course_id "
            + "                  AND eo.status = 'ACTIVE' AND (eo.is_deleted = false OR eo.is_deleted IS NULL) "
            + "                  AND g.college_id = audience_dept.college_id "
            + "                  AND g.status <> 'ARCHIVED' AND (g.is_deleted = false OR g.is_deleted IS NULL) "
            + "                  AND slot.college_id = audience_dept.college_id "
            + "                  AND slot.status = 'ACTIVE' AND (slot.is_deleted = false OR slot.is_deleted IS NULL))) "
            + ") "
            + "AND LOWER(lc.content_type) = 'assignment' "
            + "AND (lc.is_deleted = false OR lc.is_deleted IS NULL) "
            + "AND (lc.enabled IS NULL OR lc.enabled = true) AND (lc.active IS NULL OR lc.active = true) ";

    String LEARNER_ASSIGNMENT_AUDIENCE_SCOPE = " FROM lesson_contents lc "
            + "JOIN course c ON c.id = lc.course_id "
            + " AND (c.is_deleted = false OR c.is_deleted IS NULL) "
            + " AND (c.active = true OR c.active IS NULL) AND (c.enabled = true OR c.enabled IS NULL) "
            + "JOIN department course_dept ON course_dept.id = c.dept_id AND (course_dept.is_deleted = false OR course_dept.is_deleted IS NULL) "
            + "WHERE EXISTS (SELECT 1 FROM class audience_class "
            + " JOIN new_program audience_program ON audience_program.id = audience_class.program_id "
            + "  AND (audience_program.is_deleted = false OR audience_program.is_deleted IS NULL) "
            + " JOIN department audience_dept ON audience_dept.id = audience_program.dept_id "
            + "  AND (audience_dept.is_deleted = false OR audience_dept.is_deleted IS NULL) "
            + " WHERE audience_class.id IN (:classIds) "
            + "  AND (audience_class.is_deleted = false OR audience_class.is_deleted IS NULL) "
            + "  AND audience_dept.college_id = course_dept.college_id "
            + "  AND (lc.class_id = audience_class.id OR lc.class_id IS NULL OR lc.class_id < 1) "
            + "  AND (EXISTS (SELECT 1 FROM faculty_teaching_assignment teaching "
            + "               WHERE teaching.class_id = audience_class.id AND teaching.course_id = lc.course_id "
            + "               AND teaching.is_active = true AND (teaching.is_deleted = false OR teaching.is_deleted IS NULL)) "
            + "   OR (((audience_class.class_type = 'SECTION') OR audience_class.class_type IS NULL) "
            + "       AND EXISTS (SELECT 1 FROM batch b "
            + "                   JOIN semester term ON term.program_id = audience_class.program_id "
            + "                    AND term.semester_number = COALESCE(b.current_semester, 1) "
            + "                    AND (term.is_deleted = false OR term.is_deleted IS NULL) "
            + "                    AND (term.is_active = true OR term.is_active IS NULL) "
            + "                   JOIN semester_course mapped ON mapped.semester_id = term.id "
            + "                    AND mapped.course_id = lc.course_id "
            + "                    AND (mapped.is_deleted = false OR mapped.is_deleted IS NULL) "
            + "                   WHERE b.id = audience_class.batch_id AND b.program_id = audience_class.program_id "
            + "                    AND b.status = 'ACTIVE')) "
            + "   OR (audience_class.class_type = 'GROUP_BACKED' "
            + "       AND EXISTS (SELECT 1 FROM elective_offering eo "
            + "                   JOIN lms_group g ON g.id = eo.group_id "
            + "                   JOIN elective_slot slot ON slot.id = eo.slot_id "
            + "                   WHERE eo.backed_class_id = audience_class.id AND eo.course_id = lc.course_id "
            + "                    AND eo.status = 'ACTIVE' AND (eo.is_deleted = false OR eo.is_deleted IS NULL) "
            + "                    AND g.college_id = audience_dept.college_id "
            + "                    AND g.status <> 'ARCHIVED' AND (g.is_deleted = false OR g.is_deleted IS NULL) "
            + "                    AND slot.college_id = audience_dept.college_id "
            + "                    AND slot.status = 'ACTIVE' AND (slot.is_deleted = false OR slot.is_deleted IS NULL))) "
            + "  )) "
            + "AND LOWER(lc.content_type) = 'assignment' "
            + "AND (lc.is_deleted = false OR lc.is_deleted IS NULL) "
            + "AND (lc.enabled IS NULL OR lc.enabled = true) AND (lc.active IS NULL OR lc.active = true) ";

    @Query(value = "SELECT lc.* " + LEARNER_ASSIGNMENT_SCOPE + " ORDER BY lc.created_at DESC, lc.id DESC", nativeQuery = true)
    List<LessonContents> fetchAllAssignmentsByLearnerId(@Param("classId") int classId);

    @Query(value = "SELECT lc.* " + LEARNER_ASSIGNMENT_AUDIENCE_SCOPE
            + " ORDER BY lc.created_at DESC, lc.id DESC", nativeQuery = true)
    List<LessonContents> fetchAllAssignmentsByLearnerClassIds(@Param("classIds") List<Integer> classIds);

    @Query(value = "SELECT * FROM lesson_contents WHERE faculty_id = :facultyId AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<LessonContents> findByFacultyId(@Param("facultyId") int facultyId);

    // Paginated variants: keep eligible rows and counts in SQL rather than filtering after paging.
    @Query(value = "SELECT * FROM lesson_contents WHERE faculty_id = :facultyId AND content_type = 'assignment' AND (:courseId IS NULL OR course_id = :courseId)" +
            " AND (is_deleted = false OR is_deleted IS NULL) AND (enabled IS NULL OR enabled = true) ORDER BY created_at DESC",
           countQuery = "SELECT COUNT(*) FROM lesson_contents WHERE faculty_id = :facultyId AND content_type = 'assignment' AND (:courseId IS NULL OR course_id = :courseId)" +
            " AND (is_deleted = false OR is_deleted IS NULL) AND (enabled IS NULL OR enabled = true)",
           nativeQuery = true)
    Page<LessonContents> fetchAllAssignmentsPaged(@Param("facultyId") int facultyId, @Param("courseId") Integer courseId, Pageable pageable);

    @Query(value = "SELECT lc.* " + LEARNER_ASSIGNMENT_SCOPE
            + " AND (:courseId IS NULL OR lc.course_id = :courseId) ORDER BY lc.created_at DESC, lc.id DESC",
           countQuery = "SELECT COUNT(*) " + LEARNER_ASSIGNMENT_SCOPE
            + " AND (:courseId IS NULL OR lc.course_id = :courseId)",
           nativeQuery = true)
    Page<LessonContents> fetchAllAssignmentsByLearnerIdPaged(@Param("classId") int classId, @Param("courseId") Integer courseId, Pageable pageable);

    @Query(value = "SELECT lc.* " + LEARNER_ASSIGNMENT_AUDIENCE_SCOPE
            + " AND (:courseId IS NULL OR lc.course_id = :courseId) ORDER BY lc.created_at DESC, lc.id DESC",
           countQuery = "SELECT COUNT(*) " + LEARNER_ASSIGNMENT_AUDIENCE_SCOPE
            + " AND (:courseId IS NULL OR lc.course_id = :courseId)",
           nativeQuery = true)
    Page<LessonContents> fetchAllAssignmentsByLearnerClassIdsPaged(@Param("classIds") List<Integer> classIds,
                                                                   @Param("courseId") Integer courseId,
                                                                   Pageable pageable);

    @Query(value = "SELECT DISTINCT class_id FROM lesson_contents WHERE course_id = :courseId AND class_id IS NOT NULL AND class_id > 0", nativeQuery = true)
    List<Integer> fetchUniqueClassIdsByCourseId(@Param("courseId") int courseId);

    @Query(value = "SELECT class_id FROM lesson_contents WHERE id = :lessonContentId", nativeQuery = true)
    Integer findClassIdByLessonContentId(@Param("lessonContentId") int lessonContentId);

    @Query(value = "SELECT COUNT(*) FROM lesson_contents WHERE (class_id = :classId OR class_id IS NULL OR class_id < 1) AND content_type = 'assignment'", nativeQuery = true)
    int countAssignmentsByClassId(@Param("classId") int classId);

    @Query(value = "SELECT COUNT(*) FROM lesson_contents WHERE (class_id = :classId OR class_id IS NULL OR class_id < 1) AND content_type = 'quiz'", nativeQuery = true)
    int countQuizzesByClassId(@Param("classId") int classId);

    @Query(value = "SELECT * FROM lesson_contents WHERE content_type = :contentType AND active = true AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<LessonContents> findByContentTypeAndActiveTrue(@Param("contentType") String contentType);

    @Query(value = "SELECT * FROM lesson_contents WHERE content_type IN (:contentTypes) AND active = true AND (is_deleted = false OR is_deleted IS NULL)", nativeQuery = true)
    List<LessonContents> findByContentTypeInAndActiveTrue(@Param("contentTypes") List<String> contentTypes);

    @Query(value = "SELECT lc.* FROM lesson_contents lc " +
            "JOIN course c ON lc.course_id = c.id " +
            "JOIN department d ON c.dept_id = d.id " +
            "WHERE d.college_id = :collegeId AND LOWER(lc.content_type) = 'assignment' " +
            "AND (lc.enabled IS NULL OR lc.enabled = true) AND (lc.is_deleted = false OR lc.is_deleted IS NULL) " +
            "AND (:courseId IS NULL OR lc.course_id = :courseId) " +
            "ORDER BY lc.updated_at DESC",
            nativeQuery = true)
    List<LessonContents> findAssignmentsByCollege(@Param("collegeId") int collegeId, @Param("courseId") Integer courseId);

    @Query(value = "SELECT lc.* FROM lesson_contents lc " +
            "JOIN course c ON lc.course_id = c.id " +
            "JOIN department d ON c.dept_id = d.id " +
            "WHERE d.college_id = :collegeId AND LOWER(lc.content_type) = 'assignment' " +
            "AND (lc.enabled IS NULL OR lc.enabled = true) AND (lc.is_deleted = false OR lc.is_deleted IS NULL) " +
            "AND (:courseId IS NULL OR lc.course_id = :courseId) " +
            "AND (:classId IS NULL OR (:classId = 0 AND (lc.class_id IS NULL OR lc.class_id < 1)) OR lc.class_id = :classId) " +
            "ORDER BY lc.updated_at DESC",
            countQuery = "SELECT COUNT(*) FROM lesson_contents lc " +
            "JOIN course c ON lc.course_id = c.id " +
            "JOIN department d ON c.dept_id = d.id " +
            "WHERE d.college_id = :collegeId AND LOWER(lc.content_type) = 'assignment' " +
            "AND (lc.enabled IS NULL OR lc.enabled = true) AND (lc.is_deleted = false OR lc.is_deleted IS NULL) " +
            "AND (:courseId IS NULL OR lc.course_id = :courseId) " +
            "AND (:classId IS NULL OR (:classId = 0 AND (lc.class_id IS NULL OR lc.class_id < 1)) OR lc.class_id = :classId)",
            nativeQuery = true)
    Page<LessonContents> findAssignmentsByCollegePaged(@Param("collegeId") int collegeId,
                                                       @Param("courseId") Integer courseId,
                                                       @Param("classId") Integer classId,
                                                       Pageable pageable);

    @Query(value = "SELECT lc.* FROM lesson_contents lc INNER JOIN lesson l ON lc.lesson_id = l.id " +
            "WHERE l.course_id = :courseId AND lc.content_type IN ('video', 'youtube', 'VIDEO', 'YOUTUBE') " +
            "AND (lc.class_id IS NULL OR lc.class_id < 1 OR lc.class_id = :classId) " +
            "AND (lc.active = true OR lc.active IS NULL) AND (lc.is_deleted = false OR lc.is_deleted IS NULL) " +
            "ORDER BY l.sequence, lc.sequence, lc.id", nativeQuery = true)
    List<LessonContents> fetchVideoContentsByCourseAndClass(@Param("courseId") int courseId, @Param("classId") int classId);

    @Query(value = "SELECT lc.* FROM lesson_contents lc INNER JOIN lesson l ON lc.lesson_id = l.id " +
            "WHERE l.course_id = :courseId AND LOWER(lc.content_type) = 'assignment' " +
            "AND (lc.class_id IS NULL OR lc.class_id < 1 OR lc.class_id = :classId) " +
            "AND (lc.active = true OR lc.active IS NULL) AND (lc.is_deleted = false OR lc.is_deleted IS NULL) " +
            "ORDER BY l.sequence, lc.sequence, lc.id", nativeQuery = true)
    List<LessonContents> fetchAssignmentContentsByCourseAndClass(@Param("courseId") int courseId, @Param("classId") int classId);

    @Query(value = "SELECT lc.* FROM lesson_contents lc INNER JOIN lesson l ON lc.lesson_id = l.id " +
            "WHERE l.course_id = :courseId AND LOWER(lc.content_type) = 'quiz' " +
            "AND (lc.class_id IS NULL OR lc.class_id < 1 OR lc.class_id = :classId) " +
            "AND (lc.active = true OR lc.active IS NULL) AND (lc.is_deleted = false OR lc.is_deleted IS NULL) " +
            "ORDER BY l.sequence, lc.sequence, lc.id", nativeQuery = true)
    List<LessonContents> fetchQuizContentsByCourseAndClass(@Param("courseId") int courseId, @Param("classId") int classId);

    @Query(value = "SELECT lc.* FROM lesson_contents lc INNER JOIN lesson l ON lc.lesson_id = l.id " +
            "WHERE l.course_id = :courseId " +
            "AND (lc.class_id IS NULL OR lc.class_id < 1 OR lc.class_id = :classId) " +
            "AND (lc.enabled = true OR lc.enabled IS NULL) " +
            "AND (lc.active = true OR lc.active IS NULL) AND (lc.is_deleted = false OR lc.is_deleted IS NULL) " +
            "ORDER BY l.sequence, lc.sequence, lc.id", nativeQuery = true)
    List<LessonContents> fetchAllContentsByCourseAndClass(@Param("courseId") int courseId, @Param("classId") int classId);

    @Query(value = "SELECT * FROM lesson_contents WHERE (is_deleted = false OR is_deleted IS NULL) " +
            "AND CAST(content_data AS CHAR) LIKE CONCAT('%', :key, '%') LIMIT 5", nativeQuery = true)
    List<LessonContents> findByContentDataKeyContaining(@Param("key") String key);
}
