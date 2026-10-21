package com._42students.lms.repository;

import com._42students.lms.model.Quiz;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import javax.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Integer> {
    String LEARNER_QUIZ_SCOPE = " FROM quizzes q "
            + "JOIN course c ON c.id = q.course_id "
            + " AND (c.is_deleted = false OR c.is_deleted IS NULL) "
            + " AND (c.active = true OR c.active IS NULL) AND (c.enabled = true OR c.enabled IS NULL) "
            + "JOIN department course_dept ON course_dept.id = c.dept_id AND (course_dept.is_deleted = false OR course_dept.is_deleted IS NULL) "
            + "JOIN class audience_class ON audience_class.id = :classId AND (audience_class.is_deleted = false OR audience_class.is_deleted IS NULL) "
            + "JOIN new_program audience_program ON audience_program.id = audience_class.program_id AND (audience_program.is_deleted = false OR audience_program.is_deleted IS NULL) "
            + "JOIN department audience_dept ON audience_dept.id = audience_program.dept_id AND (audience_dept.is_deleted = false OR audience_dept.is_deleted IS NULL) "
            + "WHERE course_dept.college_id = audience_dept.college_id "
            + "AND (q.class_id = audience_class.id OR q.class_id IS NULL OR q.class_id < 1) "
            + "AND (EXISTS (SELECT 1 FROM faculty_teaching_assignment teaching "
            + "             WHERE teaching.class_id = audience_class.id AND teaching.course_id = q.course_id "
            + "             AND teaching.is_active = true AND (teaching.is_deleted = false OR teaching.is_deleted IS NULL)) "
            + " OR (((audience_class.class_type = 'SECTION') OR audience_class.class_type IS NULL) "
            + "     AND EXISTS (SELECT 1 FROM batch b "
            + "                 JOIN semester term ON term.program_id = audience_class.program_id "
            + "                  AND term.semester_number = COALESCE(b.current_semester, 1) "
            + "                  AND (term.is_deleted = false OR term.is_deleted IS NULL) "
            + "                  AND (term.is_active = true OR term.is_active IS NULL) "
            + "                 JOIN semester_course mapped ON mapped.semester_id = term.id "
            + "                  AND mapped.course_id = q.course_id "
            + "                  AND (mapped.is_deleted = false OR mapped.is_deleted IS NULL) "
            + "                 WHERE b.id = audience_class.batch_id AND b.program_id = audience_class.program_id "
            + "                  AND b.status = 'ACTIVE')) "
            + " OR (audience_class.class_type = 'GROUP_BACKED' "
            + "     AND EXISTS (SELECT 1 FROM elective_offering eo "
            + "                 JOIN lms_group g ON g.id = eo.group_id "
            + "                 JOIN elective_slot slot ON slot.id = eo.slot_id "
            + "                 WHERE eo.backed_class_id = audience_class.id AND eo.course_id = q.course_id "
            + "                  AND eo.status = 'ACTIVE' AND (eo.is_deleted = false OR eo.is_deleted IS NULL) "
            + "                  AND g.college_id = audience_dept.college_id "
            + "                  AND g.status <> 'ARCHIVED' AND (g.is_deleted = false OR g.is_deleted IS NULL) "
            + "                  AND slot.college_id = audience_dept.college_id "
            + "                  AND slot.status = 'ACTIVE' AND (slot.is_deleted = false OR slot.is_deleted IS NULL))) "
            + ") "
            + "AND q.status = 'PUBLISHED' "
            + "AND (q.active = true OR q.active IS NULL) AND (q.enabled = true OR q.enabled IS NULL) "
            + "AND (q.is_deleted = false OR q.is_deleted IS NULL) ";

    String LEARNER_QUIZ_AUDIENCE_SCOPE = " FROM quizzes q "
            + "JOIN course c ON c.id = q.course_id "
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
            + "  AND (q.class_id = audience_class.id OR q.class_id IS NULL OR q.class_id < 1) "
            + "  AND (EXISTS (SELECT 1 FROM faculty_teaching_assignment teaching "
            + "               WHERE teaching.class_id = audience_class.id AND teaching.course_id = q.course_id "
            + "               AND teaching.is_active = true AND (teaching.is_deleted = false OR teaching.is_deleted IS NULL)) "
            + "   OR (((audience_class.class_type = 'SECTION') OR audience_class.class_type IS NULL) "
            + "       AND EXISTS (SELECT 1 FROM batch b "
            + "                   JOIN semester term ON term.program_id = audience_class.program_id "
            + "                    AND term.semester_number = COALESCE(b.current_semester, 1) "
            + "                    AND (term.is_deleted = false OR term.is_deleted IS NULL) "
            + "                    AND (term.is_active = true OR term.is_active IS NULL) "
            + "                   JOIN semester_course mapped ON mapped.semester_id = term.id "
            + "                    AND mapped.course_id = q.course_id "
            + "                    AND (mapped.is_deleted = false OR mapped.is_deleted IS NULL) "
            + "                   WHERE b.id = audience_class.batch_id AND b.program_id = audience_class.program_id "
            + "                    AND b.status = 'ACTIVE')) "
            + "   OR (audience_class.class_type = 'GROUP_BACKED' "
            + "       AND EXISTS (SELECT 1 FROM elective_offering eo "
            + "                   JOIN lms_group g ON g.id = eo.group_id "
            + "                   JOIN elective_slot slot ON slot.id = eo.slot_id "
            + "                   WHERE eo.backed_class_id = audience_class.id AND eo.course_id = q.course_id "
            + "                    AND eo.status = 'ACTIVE' AND (eo.is_deleted = false OR eo.is_deleted IS NULL) "
            + "                    AND g.college_id = audience_dept.college_id "
            + "                    AND g.status <> 'ARCHIVED' AND (g.is_deleted = false OR g.is_deleted IS NULL) "
            + "                    AND slot.college_id = audience_dept.college_id "
            + "                    AND slot.status = 'ACTIVE' AND (slot.is_deleted = false OR slot.is_deleted IS NULL))) "
            + "  )) "
            + "AND q.status = 'PUBLISHED' "
            + "AND (q.active = true OR q.active IS NULL) AND (q.enabled = true OR q.enabled IS NULL) "
            + "AND (q.is_deleted = false OR q.is_deleted IS NULL) ";

    // Serialize learner submissions for the same quiz around max-attempt checks. Without this,
    // two concurrent submit requests can both count the same existing attempts and both insert.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT q FROM quizzes q WHERE q.id = :id")
    Optional<Quiz> lockById(@Param("id") Integer id);

    @Query(value = "SELECT * FROM quizzes WHERE lesson_id = :lessonId AND (class_id IS NULL OR class_id < 1 OR class_id = :classId) AND (active = true OR active IS NULL) AND (enabled = true OR enabled IS NULL) AND (is_deleted = false OR is_deleted IS NULL) ORDER BY created_at DESC", nativeQuery = true)
    List<Quiz> findAvailableByLessonAndClass(@Param("lessonId") int lessonId, @Param("classId") int classId);

    @Query(value = "SELECT * FROM quizzes WHERE course_id = :courseId AND (class_id IS NULL OR class_id < 1 OR class_id = :classId) AND (active = true OR active IS NULL) AND (enabled = true OR enabled IS NULL) AND (is_deleted = false OR is_deleted IS NULL) ORDER BY created_at DESC", nativeQuery = true)
    List<Quiz> findAvailableByCourseAndClass(@Param("courseId") int courseId, @Param("classId") int classId);

    @Query(value = "SELECT q.* " + LEARNER_QUIZ_SCOPE + " ORDER BY q.created_at DESC, q.id DESC", nativeQuery = true)
    List<Quiz> findAvailableByClass(@Param("classId") int classId);

    @Query(value = "SELECT q.* " + LEARNER_QUIZ_AUDIENCE_SCOPE + " ORDER BY q.created_at DESC, q.id DESC", nativeQuery = true)
    List<Quiz> findAvailableByClasses(@Param("classIds") List<Integer> classIds);

    @Query(value = "SELECT DISTINCT q.* FROM quizzes q "
            + "LEFT JOIN faculty_teaching_assignment teaching ON teaching.faculty_id = :facultyId "
            + " AND teaching.course_id = q.course_id "
            + " AND (q.class_id IS NULL OR q.class_id < 1 OR teaching.class_id = q.class_id) "
            + " AND teaching.is_active = true AND (teaching.is_deleted = false OR teaching.is_deleted IS NULL) "
            + "WHERE (q.faculty_id = :facultyId OR teaching.id IS NOT NULL) "
            + "AND (q.is_deleted = false OR q.is_deleted IS NULL) ORDER BY q.created_at DESC", nativeQuery = true)
    List<Quiz> findManageableByFacultyId(@Param("facultyId") int facultyId);

    // Paginated + course-filterable variants for the "All Quizzes" list page — the methods above
    // return everything at once, which is exactly the "hundreds of quizzes in one response"
    // problem being fixed. `courseId` is optional (NULL = all courses) on each.
    @Query(value = "SELECT q.* " + LEARNER_QUIZ_SCOPE + " AND (:courseId IS NULL OR q.course_id = :courseId) ORDER BY q.created_at DESC, q.id DESC",
           countQuery = "SELECT COUNT(*) " + LEARNER_QUIZ_SCOPE + " AND (:courseId IS NULL OR q.course_id = :courseId)",
           nativeQuery = true)
    Page<Quiz> findAvailableByClassPaged(@Param("classId") int classId, @Param("courseId") Integer courseId, Pageable pageable);

    @Query(value = "SELECT q.* " + LEARNER_QUIZ_AUDIENCE_SCOPE
            + " AND (:courseId IS NULL OR q.course_id = :courseId) ORDER BY q.created_at DESC, q.id DESC",
           countQuery = "SELECT COUNT(*) " + LEARNER_QUIZ_AUDIENCE_SCOPE
            + " AND (:courseId IS NULL OR q.course_id = :courseId)",
           nativeQuery = true)
    Page<Quiz> findAvailableByClassesPaged(@Param("classIds") List<Integer> classIds,
                                           @Param("courseId") Integer courseId,
                                           Pageable pageable);

    @Query(value = "SELECT DISTINCT q.* FROM quizzes q "
            + "LEFT JOIN faculty_teaching_assignment teaching ON teaching.faculty_id = :facultyId "
            + " AND teaching.course_id = q.course_id "
            + " AND (q.class_id IS NULL OR q.class_id < 1 OR teaching.class_id = q.class_id) "
            + " AND teaching.is_active = true AND (teaching.is_deleted = false OR teaching.is_deleted IS NULL) "
            + "WHERE (q.faculty_id = :facultyId OR teaching.id IS NOT NULL) "
            + "AND (:courseId IS NULL OR q.course_id = :courseId) "
            + "AND (q.is_deleted = false OR q.is_deleted IS NULL) ORDER BY q.created_at DESC",
           countQuery = "SELECT COUNT(DISTINCT q.id) FROM quizzes q "
            + "LEFT JOIN faculty_teaching_assignment teaching ON teaching.faculty_id = :facultyId "
            + " AND teaching.course_id = q.course_id "
            + " AND (q.class_id IS NULL OR q.class_id < 1 OR teaching.class_id = q.class_id) "
            + " AND teaching.is_active = true AND (teaching.is_deleted = false OR teaching.is_deleted IS NULL) "
            + "WHERE (q.faculty_id = :facultyId OR teaching.id IS NOT NULL) "
            + "AND (:courseId IS NULL OR q.course_id = :courseId) "
            + "AND (q.is_deleted = false OR q.is_deleted IS NULL)",
           nativeQuery = true)
    Page<Quiz> findManageableByFacultyIdPaged(@Param("facultyId") int facultyId, @Param("courseId") Integer courseId, Pageable pageable);

    // Admin oversight: every quiz across a college regardless of authoring faculty, resolved via
    // course -> department -> college (quizzes has no college_id column directly). Used when
    // listQuizzesPaged is called by a global/college admin principal — the faculty-scoped query
    // above returns nothing useful for those (super-admin's id is 0, no quiz is ever authored by
    // it; a college admin's own id only matches quizzes they personally created, not the whole
    // college's). Deliberately not status-filtered (unlike findAvailableBy*), since moderation
    // needs to see drafts too, not just published quizzes.
    @Query(value = "SELECT q.* FROM quizzes q JOIN course c ON q.course_id = c.id JOIN department d ON c.dept_id = d.id " +
            "WHERE d.college_id = :collegeId AND (:courseId IS NULL OR q.course_id = :courseId) AND (q.is_deleted = false OR q.is_deleted IS NULL) ORDER BY q.created_at DESC",
           countQuery = "SELECT COUNT(*) FROM quizzes q JOIN course c ON q.course_id = c.id JOIN department d ON c.dept_id = d.id " +
            "WHERE d.college_id = :collegeId AND (:courseId IS NULL OR q.course_id = :courseId) AND (q.is_deleted = false OR q.is_deleted IS NULL)",
           nativeQuery = true)
    Page<Quiz> findByCollegeIdPaged(@Param("collegeId") int collegeId, @Param("courseId") Integer courseId, Pageable pageable);
}
