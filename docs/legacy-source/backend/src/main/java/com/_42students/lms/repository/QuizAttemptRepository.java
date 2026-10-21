package com._42students.lms.repository;

import com._42students.lms.model.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Integer> {
    /** How many of these quizzes the learner has submitted at least once (one query, not one per quiz). */
    @org.springframework.data.jpa.repository.Query("select count(distinct a.quizId) from quiz_attempts a "
            + "where a.learnerId = :learnerId and a.isDeleted = false and a.quizId in :quizIds")
    long countSubmittedQuizzes(@org.springframework.data.repository.query.Param("learnerId") int learnerId,
                               @org.springframework.data.repository.query.Param("quizIds") java.util.Collection<Integer> quizIds);

    int countByQuizIdAndLearnerIdAndIsDeletedFalse(int quizId, int learnerId);

    /** Total submitted attempts across all learners; used to freeze a quiz's questions once anyone has submitted. */
    long countByQuizIdAndIsDeletedFalse(int quizId);
    List<QuizAttempt> findByQuizIdAndIsDeletedFalseOrderBySubmittedAtDesc(int quizId);
    List<QuizAttempt> findByQuizIdAndLearnerIdAndIsDeletedFalseOrderByAttemptNumberDesc(int quizId, int learnerId);
    List<QuizAttempt> findByLearnerIdAndIsDeletedFalseOrderBySubmittedAtDesc(int learnerId);
    Optional<QuizAttempt> findTopByQuizIdAndLearnerIdAndIsDeletedFalseOrderByAttemptNumberDesc(int quizId, int learnerId);
}
