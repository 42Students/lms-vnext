package com._42students.lms.service.impl;

import com._42students.lms.dto.request.QuizAnswerRequestDTO;
import com._42students.lms.dto.request.QuizSubmitRequestDTO;
import com._42students.lms.model.QuizOption;
import com._42students.lms.model.QuizQuestion;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/** LRN-Q-01 / LRN-T-07 (guard): a quiz edited while a learner answers is refused, not mis-scored. */
class QuizChangedMidAttemptTest {

    private static QuizQuestion q(int id) { QuizQuestion q = new QuizQuestion(); q.setId(id); return q; }
    private static QuizOption o(int id) { QuizOption o = new QuizOption(); o.setId(id); return o; }
    private static QuizAnswerRequestDTO a(int questionId, Integer... options) {
        QuizAnswerRequestDTO dto = new QuizAnswerRequestDTO();
        dto.setQuestionId(questionId);
        dto.setSelectedOptionIds(List.of(options));
        return dto;
    }

    private final List<QuizQuestion> current = List.of(q(1), q(2));
    private final Map<Integer, List<QuizOption>> options = Map.of(1, List.of(o(11), o(12)), 2, List.of(o(21), o(22)));

    @Test
    void unchangedQuizPasses() {
        QuizSubmitRequestDTO req = new QuizSubmitRequestDTO();
        req.setAnswers(List.of(a(1, 11), a(2, 22)));
        req.setShownQuestionIds(List.of(1, 2));
        assertDoesNotThrow(() -> QuizServiceImpl.requireUnchangedQuestionSet(current, options, req));
    }

    @Test
    void addedQuestionRemovedQuestionOrReplacedOptionIsA409() {
        QuizSubmitRequestDTO added = new QuizSubmitRequestDTO();
        added.setAnswers(List.of(a(1, 11)));
        added.setShownQuestionIds(List.of(1)); // learner never saw question 2
        QuizSubmitRequestDTO removed = new QuizSubmitRequestDTO();
        removed.setAnswers(List.of(a(1, 11), a(3, 31))); // question 3 no longer exists
        QuizSubmitRequestDTO replaced = new QuizSubmitRequestDTO();
        replaced.setAnswers(List.of(a(1, 13))); // option 13 replaced

        for (QuizSubmitRequestDTO req : List.of(added, removed, replaced)) {
            ResponseStatusException e = assertThrows(ResponseStatusException.class,
                    () -> QuizServiceImpl.requireUnchangedQuestionSet(current, options, req));
            assertEquals(HttpStatus.CONFLICT, e.getStatus());
        }
    }
}
