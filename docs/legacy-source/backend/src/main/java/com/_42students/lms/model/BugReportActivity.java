package com._42students.lms.model;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "bug_report_activity")
public class BugReportActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bug_report_id", nullable = false)
    private Long bugReportId;

    @Column(name = "activity_type", nullable = false, length = 40)
    private String activityType;

    @Column(name = "actor_name", length = 120)
    private String actorName;

    @Column(name = "from_value", length = 255)
    private String fromValue;

    @Column(name = "to_value", length = 255)
    private String toValue;

    @Column(name = "note", length = 1000)
    private String note;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
