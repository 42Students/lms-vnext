package com._42students.lms.dto.bugtracker;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BugReportActivityResponse {
    private Long id;
    private String activityType;
    private String actorName;
    private String fromValue;
    private String toValue;
    private String note;
    private LocalDateTime createdAt;
}
