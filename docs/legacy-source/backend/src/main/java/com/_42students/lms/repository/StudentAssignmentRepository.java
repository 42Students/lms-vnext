package com._42students.lms.repository;

import com._42students.lms.model.StudentAssignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StudentAssignmentRepository extends JpaRepository<StudentAssignment, Long> {
    @Query(value = "select * from student_assignment where lesson_content_id=:lessonContentId and (is_deleted=0 or is_deleted is null)", nativeQuery = true)
    List<StudentAssignment> fetchSubmissions(@Param("lessonContentId") int lessonContentId);

    Page<StudentAssignment> findByLessonContentIdOrderByCreatedAtDesc(int lessonContentId, Pageable pageable);

    Page<StudentAssignment> findByStudentIdAndLessonContentIdOrderByCreatedAtDesc(int studentId, int lessonContentId, Pageable pageable);

    @Query(value = "select * from student_assignment where student_id=:learnerId and (is_deleted=0 or is_deleted is null)", nativeQuery = true)
    List<StudentAssignment> fetchSubmissionsByLearnerId(@Param("learnerId") int learnerId);

    @Query(value = "select * from student_assignment where id=:submissionId", nativeQuery = true)
    StudentAssignment fetchSubmission(@Param("submissionId") int submissionId);

    StudentAssignment findById(int studentAssignmentId);


    // AQ-25: filter out soft-deleted lesson content from all submission queries
    @Query(value = "SELECT sa.* FROM student_assignment sa " +
               "INNER JOIN lesson_contents lc ON sa.lesson_content_id = lc.id " +
               "WHERE lc.content_type = 'assignment' AND sa.student_id = :learnerId " +
               "AND (lc.is_deleted = 0 OR lc.is_deleted IS NULL) AND (sa.is_deleted = 0 OR sa.is_deleted IS NULL)", nativeQuery = true)
List<StudentAssignment> fetchAssignmentSubmissionsByLearnerId(@Param("learnerId") int learnerId);


@Query(value = "SELECT sa.* FROM student_assignment sa " +
               "INNER JOIN lesson_contents lc ON sa.lesson_content_id = lc.id " +
               "WHERE lc.content_type = 'quiz' AND sa.student_id = :learnerId " +
               "AND (lc.is_deleted = 0 OR lc.is_deleted IS NULL) AND (sa.is_deleted = 0 OR sa.is_deleted IS NULL)", nativeQuery = true)
List<StudentAssignment> fetchquizSubmissionsByLearnerId(@Param("learnerId") int learnerId);

@Query(value = "SELECT COUNT(sa.id) FROM student_assignment sa " +
               "INNER JOIN lesson_contents lc ON sa.lesson_content_id = lc.id " +
               "WHERE lc.content_type = 'assignment' AND sa.student_id = :learnerId " +
               "AND (lc.is_deleted = 0 OR lc.is_deleted IS NULL) AND (sa.is_deleted = 0 OR sa.is_deleted IS NULL)", nativeQuery = true)
int countAssignmentSubmissionsByLearnerId(@Param("learnerId") int learnerId);

@Query(value = "SELECT COUNT(sa.id) FROM student_assignment sa " +
               "INNER JOIN lesson_contents lc ON sa.lesson_content_id = lc.id " +
               "WHERE lc.content_type = 'quiz' AND sa.student_id = :learnerId " +
               "AND (lc.is_deleted = 0 OR lc.is_deleted IS NULL) AND (sa.is_deleted = 0 OR sa.is_deleted IS NULL)", nativeQuery = true)
int countQuizSubmissionsByLearnerId(@Param("learnerId") int learnerId);

    @Query(value = "SELECT sa.* FROM student_assignment sa " +
            "INNER JOIN lesson_contents lc ON sa.lesson_content_id = lc.id " +
            "INNER JOIN lesson l ON lc.lesson_id = l.id " +
            "WHERE l.course_id = :courseId AND LOWER(lc.content_type) = 'assignment' AND sa.student_id = :learnerId " +
            "AND (lc.is_deleted = 0 OR lc.is_deleted IS NULL) AND (sa.is_deleted = 0 OR sa.is_deleted IS NULL)", nativeQuery = true)
    List<StudentAssignment> fetchAssignmentSubmissionsByLearnerAndCourse(@Param("learnerId") int learnerId, @Param("courseId") int courseId);

    @Query(value = "SELECT sa.* FROM student_assignment sa " +
            "INNER JOIN lesson_contents lc ON sa.lesson_content_id = lc.id " +
            "INNER JOIN lesson l ON lc.lesson_id = l.id " +
            "WHERE l.course_id = :courseId AND LOWER(lc.content_type) = 'quiz' AND sa.student_id = :learnerId " +
            "AND (lc.is_deleted = 0 OR lc.is_deleted IS NULL) AND (sa.is_deleted = 0 OR sa.is_deleted IS NULL)", nativeQuery = true)
    List<StudentAssignment> fetchQuizSubmissionsByLearnerAndCourse(@Param("learnerId") int learnerId, @Param("courseId") int courseId);

    /**
     * Resolves a submission's owning student/lesson-content from the R2 storage key embedded in
     * its file — same purpose and pattern as LessonContentsRepository#findByContentDataKeyContaining,
     * used to close the "assignments" folder's IDOR: a plain course-assignment submission's
     * ownership was never checked at file-read/download/delete time, only its tenant. Checks both
     * the legacy single-file column and the newer submission_assets list; the key is a random
     * UUID, so a substring match carries no meaningful false-positive risk.
     */
    @Query(value = "SELECT * FROM student_assignment WHERE (is_deleted = 0 OR is_deleted IS NULL) " +
            "AND (CAST(assignment_contents AS CHAR) LIKE CONCAT('%', :key, '%') " +
            "OR CAST(submission_assets AS CHAR) LIKE CONCAT('%', :key, '%')) LIMIT 5", nativeQuery = true)
    List<StudentAssignment> findByFileKeyContaining(@Param("key") String key);

    boolean existsByStudentIdAndLessonContentId(int studentId, int lessonContentId);

    @Query(value = "SELECT COUNT(*) FROM student_assignment WHERE lesson_content_id = :lessonContentId " +
            "AND (is_deleted = 0 OR is_deleted IS NULL)", nativeQuery = true)
    long countActiveByLessonContentId(@Param("lessonContentId") int lessonContentId);

    /** Count how many attempts a student has made for a given lesson content (all-time, legacy) */
    int countByStudentIdAndLessonContentId(int studentId, int lessonContentId);

    /**
     * AQ-11: Count attempts scoped to a specific semester so the counter resets each semester.
     * Rows with NULL semester_number (legacy) are excluded from this count.
     */
    @org.springframework.data.jpa.repository.Query(value =
            "SELECT COUNT(*) FROM student_assignment WHERE student_id = :studentId " +
            "AND lesson_content_id = :lessonContentId AND semester_number = :semesterNumber " +
            "AND (is_deleted = 0 OR is_deleted IS NULL)", nativeQuery = true)
    int countByStudentIdAndLessonContentIdAndSemester(
            @org.springframework.data.repository.query.Param("studentId") int studentId,
            @org.springframework.data.repository.query.Param("lessonContentId") int lessonContentId,
            @org.springframework.data.repository.query.Param("semesterNumber") int semesterNumber);

}
 

