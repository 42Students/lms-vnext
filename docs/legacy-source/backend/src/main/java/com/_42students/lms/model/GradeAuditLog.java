package com._42students.lms.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "grade_audit_log")
@JsonIgnoreProperties(ignoreUnknown = true, value = {"handler", "hibernate_lazy_initializer"})
public class GradeAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_assignment_id", nullable = false)
    private int studentAssignmentId;

    @Column(name = "graded_by", nullable = false)
    private int gradedBy;

    @Column(name = "previous_points")
    private long previousPoints;

    @Column(name = "new_points")
    private long newPoints;

    @Column(name = "previous_grading_status")
    private String previousGradingStatus;

    @Column(name = "new_grading_status")
    private String newGradingStatus;

    @Column(name = "action", nullable = false)
    private String action;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}

