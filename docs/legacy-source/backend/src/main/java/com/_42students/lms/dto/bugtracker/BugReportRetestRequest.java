package com._42students.lms.dto.bugtracker;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class BugReportRetestRequest {
    @NotBlank
    @Size(max = 24)
    private String result;

    @Size(max = 1000)
    private String note;
}
