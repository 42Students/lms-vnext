package com._42students.lms.dto.bugtracker;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BugTrackerAttachmentPresignResponse {
    private String uploadUrl;
    private String storageKey;
}
