package com._42students.lms.dto.bugtracker;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BugTrackerAttachmentResponse {
    private Long id;
    private String originalFilename;
    private String contentType;
    private Long sizeBytes;
    private String url;
    private LocalDateTime createdAt;
}
