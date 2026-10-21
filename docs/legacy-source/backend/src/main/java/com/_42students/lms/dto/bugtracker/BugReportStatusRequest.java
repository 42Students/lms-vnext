package com._42students.lms.dto.bugtracker;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class BugReportStatusRequest {
    @NotBlank @Size(max = 32)
    private String status;
}
