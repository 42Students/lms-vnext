package com._42students.lms.repository;

import com._42students.lms.model.LearnerContentProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LearnerContentProgressRepository extends JpaRepository<LearnerContentProgress, Integer> {

    /**
     * The learner's CURRENT run through this content — the highest attempt.
     *
     * <p>Audit 5.5 added attempts, so more than one row can now exist per learner+content. Every
     * read and write works on the latest one; earlier attempts are history and are never updated.
     */
    Optional<LearnerContentProgress> findTopByLearnerIdAndLessonContentIdOrderByAttemptDesc(
            int learnerId, int lessonContentId);

    /** A specific attempt, for the insert-race recovery path which knows which one it wrote. */
    Optional<LearnerContentProgress> findByLearnerIdAndLessonContentIdAndAttempt(
            int learnerId, int lessonContentId, int attempt);

    /**
     * Current-attempt rows for many pieces of content at once.
     *
     * <p>The correlated subquery is what keeps this to one row per content: without it a learner
     * on their second attempt would appear twice per item and their first-attempt completions
     * would leak back into the current view.
     */
    @Query(value = "SELECT p.* FROM learner_content_progress p "
            + "WHERE p.learner_id = :learnerId AND p.lesson_content_id IN (:lessonContentIds) "
            + "AND p.attempt = (SELECT MAX(p2.attempt) FROM learner_content_progress p2 "
            + "                 WHERE p2.learner_id = p.learner_id "
            + "                   AND p2.lesson_content_id = p.lesson_content_id)",
            nativeQuery = true)
    List<LearnerContentProgress> findByLearnerIdAndLessonContentIdIn(
            @Param("learnerId") int learnerId,
            @Param("lessonContentIds") List<Integer> lessonContentIds);

    /**
     * Opens the next attempt by copying the learner's current rows forward with the position and
     * completion cleared.
     *
     * <p>Rows are materialised rather than left to appear on the learner's next save, so the reset
     * is visible immediately — the learner opens the course and sees zero progress, which is the
     * point of the action. The previous attempt's rows are untouched and remain as history.
     *
     * <p>duration_seconds carries over because it describes the content, not the learner. The
     * completion timestamps deliberately do not: first_completed_at is immutable within an
     * attempt, and a new attempt has genuinely never been completed.
     */
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    // countQuery is required here, not optional: Spring Data JPA 2.7's native-query bootstrap
    // eagerly derives a count query for every @Query(nativeQuery = true) method, @Modifying or
    // not, and its regex-based derivation chokes on this statement's shape (INSERT INTO ... SELECT
    // with a nested "(SELECT * FROM ...)" derived table) with a bare NPE
    // ("QueryUtils.createCountQueryFor") — at application-context-startup time, before this
    // method is ever invoked, so it can't be worked around at the call site. A modifying query's
    // count query is never actually executed; the placeholder just needs to parse.
    @Query(value = "INSERT INTO learner_content_progress "
            + "(learner_id, lesson_content_id, last_position_seconds, duration_seconds, attempt, "
            + " created_at, updated_at, is_deleted) "
            + "SELECT p.learner_id, p.lesson_content_id, 0, p.duration_seconds, :attempt, "
            + "       NOW(6), NOW(6), 0 "
            + "FROM learner_content_progress p "
            + "WHERE p.learner_id = :learnerId AND p.lesson_content_id IN (:lessonContentIds) "
            + "AND p.attempt = (SELECT MAX(p2.attempt) FROM (SELECT * FROM learner_content_progress) p2 "
            + "                 WHERE p2.learner_id = p.learner_id "
            + "                   AND p2.lesson_content_id = p.lesson_content_id)",
            countQuery = "SELECT 1",
            nativeQuery = true)
    int startNewAttempt(@Param("learnerId") int learnerId,
                        @Param("lessonContentIds") List<Integer> lessonContentIds,
                        @Param("attempt") int attempt);

    /**
     * Completed-item count per learner across a set of content, for the admin course-progress view.
     *
     * <p>Counts the learner's CURRENT attempt only. Without that a learner who retook a course
     * would have their first-attempt completions counted alongside the retake and could show more
     * than 100%, which is exactly the confusion the attempt dimension was added to remove.
     */
    @Query(value = "SELECT p.learner_id AS learnerId, COUNT(*) AS completedCount "
            + "FROM learner_content_progress p "
            + "WHERE p.lesson_content_id IN (:lessonContentIds) "
            + "AND p.completed_at IS NOT NULL "
            + "AND (p.is_deleted = 0 OR p.is_deleted IS NULL) "
            + "AND p.attempt = (SELECT MAX(p2.attempt) FROM (SELECT * FROM learner_content_progress) p2 "
            + "                 WHERE p2.learner_id = p.learner_id "
            + "                   AND p2.lesson_content_id = p.lesson_content_id) "
            + "GROUP BY p.learner_id",
            nativeQuery = true)
    List<Object[]> countCompletedPerLearner(@Param("lessonContentIds") List<Integer> lessonContentIds);

    /** Highest attempt a learner has reached on one piece of content; empty when never started. */
    @Query(value = "SELECT MAX(p.attempt) FROM learner_content_progress p "
            + "WHERE p.learner_id = :learnerId AND p.lesson_content_id IN (:lessonContentIds)",
            nativeQuery = true)
    Integer findMaxAttempt(@Param("learnerId") int learnerId,
                           @Param("lessonContentIds") List<Integer> lessonContentIds);
}

