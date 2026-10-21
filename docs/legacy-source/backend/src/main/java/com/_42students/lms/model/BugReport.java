package com._42students.lms.model;

import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import javax.persistence.*;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "bug_report")
public class BugReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "public_id", unique = true, length = 24)
    private String publicId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_access_id", nullable = false)
    private BugTrackerAccess reporterAccess;

    @Column(name = "reporter_name", nullable = false, length = 120)
    private String reporterName;

    @Column(name = "account_role", nullable = false, length = 32)
    private String accountRole;

    @Column(name = "environment", nullable = false, length = 32)
    private String environment;

    @Column(name = "page", nullable = false, length = 120)
    private String page;

    @Column(name = "screen", length = 120)
    private String screen;

    @Column(name = "section", length = 120)
    private String section;

    @Column(name = "issue_type", nullable = false, length = 80)
    private String issueType;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "severity", nullable = false, length = 32)
    private String severity;

    @Column(name = "evidence_link", length = 1000)
    private String evidenceLink;

    @Column(name = "source_url", length = 2000)
    private String sourceUrl;

    @Column(name = "source_path", length = 500)
    private String sourcePath;

    @Column(name = "browser", length = 500)
    private String browser;

    @Column(name = "viewport", length = 64)
    private String viewport;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "resolution", length = 32)
    private String resolution;

    @Column(name = "affected_layer", length = 24)
    private String affectedLayer;

    @Column(name = "root_cause", columnDefinition = "TEXT")
    private String rootCause;

    @Column(name = "fix_notes", columnDefinition = "TEXT")
    private String fixNotes;

    @Column(name = "frontend_commit_sha", length = 64)
    private String frontendCommitSha;

    @Column(name = "backend_commit_sha", length = 64)
    private String backendCommitSha;

    @Column(name = "regression_test_status", nullable = false, length = 24)
    private String regressionTestStatus = "NOT_REVIEWED";

    @Column(name = "production_verified", nullable = false)
    private Boolean productionVerified = false;

    @Column(name = "retest_status", nullable = false, length = 24)
    private String retestStatus = "NOT_RETESTED";

    @Column(name = "retested_at")
    private LocalDateTime retestedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Version
    @Column(name = "version", nullable = false)
    private Long version;
}
