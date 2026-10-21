package com._42students.lms.dto.bugtracker;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class BugReportResponse {
    private String publicId;
    private String reporterName;
    private String accountRole;
    private String environment;
    private String page;
    private String screen;
    private String section;
    private String issueType;
    private String description;
    private String severity;
    private String evidenceLink;
    private String sourceUrl;
    private String sourcePath;
    private String browser;
    private String viewport;
    private String status;
    private String resolution;
    private String affectedLayer;
    private String rootCause;
    private String fixNotes;
    private String frontendCommitSha;
    private String backendCommitSha;
    private String regressionTestStatus;
    private Boolean productionVerified;
    private String retestStatus;
    private LocalDateTime retestedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
