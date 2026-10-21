package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Table;

@Data
@Entity(name = "quiz_questions")
@Table(name = "quiz_questions")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class QuizQuestion extends BaseModel {
    @Column(name = "quiz_id")
    private int quizId;
    @Column(name = "question_type")
    private String questionType;
    @Column(name = "prompt")
    private String prompt;
    @Column(name = "points")
    private long points = 1;
    @Column(name = "sequence")
    private int sequence;
}
