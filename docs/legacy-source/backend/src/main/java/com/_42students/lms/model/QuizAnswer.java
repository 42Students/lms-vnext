package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Table;

@Data
@Entity(name = "quiz_answers")
@Table(name = "quiz_answers")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class QuizAnswer extends BaseModel {
    @Column(name = "attempt_id")
    private int attemptId;
    @Column(name = "question_id")
    private int questionId;
    @Column(name = "selected_option_ids")
    private String selectedOptionIds;
    @Column(name = "correct")
    private boolean correct;
    @Column(name = "points_awarded")
    private long pointsAwarded;
}
