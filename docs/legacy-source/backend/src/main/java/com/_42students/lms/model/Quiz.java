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
@Entity(name = "quizzes")
@Table(name = "quizzes")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class Quiz extends BaseModel {
    @Column(name = "lesson_id")
    private int lessonId;
    @Column(name = "course_id")
    private int courseId;
    @Column(name = "class_id")
    private Integer classId;
    @Column(name = "faculty_id")
    private Integer facultyId;
    @Column(name = "title")
    private String title;
    @Column(name = "description")
    private String description;
    @Column(name = "status")
    private String status = "DRAFT";
    @Column(name = "due_at")
    private LocalDateTime dueAt;
    @Column(name = "max_attempts")
    private int maxAttempts = 1;
    @Column(name = "total_points")
    private long totalPoints;
    @Column(name = "active")
    private boolean active = true;
    @Column(name = "enabled")
    private boolean enabled = true;
    // Safe default: withhold results/answer correctness until faculty explicitly releases them.
    // Immediate release can expose an answer key to early finishers while classmates are still
    // taking the same quiz.
    @Column(name = "is_grade_published")
    private boolean gradePublished = false;

    /**
     * Audit 2.7: present questions in a different order to each learner.
     *
     * <p>Without this every learner sees the same sequence, so "C, A, D, B" is a complete answer
     * key for the whole room. Off by default — silently reordering an assessment that may already
     * be mid-term would be a surprising change, so this is something a faculty member turns on.
     */
    @Column(name = "shuffle_questions")
    private boolean shuffleQuestions = false;

    /** As above, for the options within each question. */
    @Column(name = "shuffle_options")
    private boolean shuffleOptions = false;
}
