package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Table;
import java.time.LocalDateTime;

@Data
@Entity(name = "quiz_attempts")
@Table(name = "quiz_attempts")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class QuizAttempt extends BaseModel {
    @Column(name = "quiz_id")
    private int quizId;
    @Column(name = "learner_id")
    private int learnerId;
    @Column(name = "attempt_number")
    private int attemptNumber = 1;
    @Column(name = "status")
    private String status = "SUBMITTED";
    @Column(name = "score")
    private long score;
    @Column(name = "max_score")
    private long maxScore;
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
}
