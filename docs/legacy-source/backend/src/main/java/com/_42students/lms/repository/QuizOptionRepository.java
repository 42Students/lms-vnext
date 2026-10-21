package com._42students.lms.repository;

import com._42students.lms.model.QuizOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface QuizOptionRepository extends JpaRepository<QuizOption, Integer> {
    List<QuizOption> findByQuestionIdAndIsDeletedFalseOrderBySequenceAscIdAsc(int questionId);
    List<QuizOption> findByQuestionIdInAndIsDeletedFalseOrderBySequenceAscIdAsc(Collection<Integer> questionIds);
    void deleteByQuestionIdIn(Collection<Integer> questionIds);
}
