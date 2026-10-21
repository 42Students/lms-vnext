package com._42students.lms.model;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;

/**
 * Per-class sequence override for lesson contents.
 * When set, this sequence is used instead of lesson_contents.sequence when displaying
 * contents for that specific class. Allows admin to reorder for one class without affecting others.
 */
@Data
@Entity
@Table(name = "lesson_content_class_sequence", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"lesson_content_id", "class_id"})
})
public class LessonContentClassSequence {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;
    @Column(name = "lesson_content_id", nullable = false)
    private Integer lessonContentId;
    @Column(name = "class_id", nullable = false)
    private Integer classId;
    @Column(name = "sequence", nullable = false)
    private long sequence;
    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

