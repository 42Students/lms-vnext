package com._42students.lms.dto.bugtracker;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class BugReportCreateRequest {
    @NotBlank @Size(max = 120)
    private String reporterName;
    @NotBlank @Size(max = 32)
    private String accountRole;
    @NotBlank @Size(max = 32)
    private String environment;
    @NotBlank @Size(max = 120)
    private String page;
    @Size(max = 120)
    private String screen;
    @Size(max = 120)
    private String section;
    @NotBlank @Size(max = 80)
    private String issueType;
    @NotBlank @Size(max = 4000)
    private String description;
    @NotBlank @Size(max = 32)
    private String severity;
    @Size(max = 1000)
    private String evidenceLink;

    @Size(max = 2000)
    private String sourceUrl;

    @Size(max = 500)
    private String sourcePath;

    @Size(max = 500)
    private String browser;

    @Size(max = 64)
    private String viewport;
}
