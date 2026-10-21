package com._42students.lms.dto.bugtracker;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class BugTrackerAttachmentConfirmRequest {
    @NotBlank
    @Size(max = 700)
    private String storageKey;

    @NotBlank
    @Size(max = 255)
    private String originalFilename;
}
