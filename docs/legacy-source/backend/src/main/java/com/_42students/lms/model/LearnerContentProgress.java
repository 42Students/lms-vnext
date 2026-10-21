package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.persistence.*;
import java.time.Instant;

/**
 * Tracks a learner's progress on a lesson content item (e.g. video: last position, duration, completed).
 * One row per (learner_id, lesson_content_id). Future-proof for other consumable types (e.g. PDF page).
 */
@Data
@Entity(name = "learner_content_progress")
@Table(name = "learner_content_progress")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class LearnerContentProgress extends BaseModel {

    @Column(name = "learner_id", nullable = false)
    private int learnerId;

    @Column(name = "lesson_content_id", nullable = false)
    private int lessonContentId;

    @Column(name = "last_position_seconds", nullable = false)
    private int lastPositionSeconds = 0;

    @Column(name = "duration_seconds", nullable = false)
    private int durationSeconds = 0;

    @Column(name = "completed_at")
    private java.time.Instant completedAt;

    // Set once, on the first completion, and never cleared afterward -- an immutable audit trail
    // that survives a later {completed: false} clearing completedAt (a legitimate rewatch action,
    // but one that previously destroyed the only record the content was ever completed at all).
    @Column(name = "first_completed_at")
    private java.time.Instant firstCompletedAt;

    /**
     * Audit 5.5: which run through this content the row belongs to.
     *
     * <p>Progress used to be keyed on (learner, content) alone, so a learner repeating a semester
     * kept every completion from the first time round. Attempts let the earlier run stay as
     * history while the retake starts from zero. Everything created before this existed is
     * attempt 1, which is what it is.
     */
    @Column(name = "attempt", nullable = false)
    private int attempt = 1;
}

