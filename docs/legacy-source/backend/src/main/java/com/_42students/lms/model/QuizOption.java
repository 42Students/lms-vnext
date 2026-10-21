package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Table;

@Data
@Entity(name = "quiz_options")
@Table(name = "quiz_options")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class QuizOption extends BaseModel {
    @Column(name = "question_id")
    private int questionId;
    @Column(name = "option_text")
    private String optionText;
    @Column(name = "correct")
    private boolean correct;
    @Column(name = "sequence")
    private int sequence;
}
