package com._42students.lms.dto.bugtracker;

import lombok.Data;

import javax.validation.constraints.Size;

@Data
public class BugReportWorkflowRequest {
    @Size(max = 32)
    private String status;

    @Size(max = 32)
    private String resolution;

    @Size(max = 24)
    private String affectedLayer;

    @Size(max = 4000)
    private String rootCause;

    @Size(max = 4000)
    private String fixNotes;

    @Size(max = 64)
    private String frontendCommitSha;

    @Size(max = 64)
    private String backendCommitSha;

    @Size(max = 24)
    private String regressionTestStatus;

    private Boolean productionVerified;
}
