package com._42students.lms.dto.bugtracker;

import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Data
public class BugTrackerAttachmentPresignRequest {
    @NotBlank
    @Size(max = 255)
    private String fileName;

    @NotBlank
    @Size(max = 100)
    private String contentType;

    @NotNull
    @Min(1)
    @Max(8388608)
    private Long contentLength;
}
