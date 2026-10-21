package com._42students.lms.model.tpo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import java.time.LocalDateTime;

/** "Assign prep": reuses an existing LMS course or assessment; completion is derived, not stored. */
@Entity
@Table(name = "prep_assignment")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernateLazyInitializer", "hibernate_lazy_initializer"})
@Getter
@Setter
public class PrepAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "learner_id", nullable = false)
    private Integer learnerId;

    @Column(name = "course_id")
    private Integer courseId;

    @Column(name = "assessment_id")
    private Integer assessmentId;

    @Column(name = "due_at")
    private LocalDateTime dueAt;

    @Column(name = "assigned_by")
    private Integer assignedBy;

    @org.hibernate.annotations.CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
