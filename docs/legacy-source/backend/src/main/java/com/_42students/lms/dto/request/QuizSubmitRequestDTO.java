package com._42students.lms.dto.request;

import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;

@Data
public class QuizSubmitRequestDTO {
    @Valid
    @NotEmpty
    @Size(max = 200)
    private List<QuizAnswerRequestDTO> answers = new ArrayList<>();

    /**
     * The question ids the learner was shown (optional; sent by current clients). If the teacher
     * changed the quiz's questions while the learner was answering, the submission is refused with
     * 409 instead of being scored against a different question set (LRN-Q-01).
     */
    @Size(max = 200)
    private List<Integer> shownQuestionIds;
}
