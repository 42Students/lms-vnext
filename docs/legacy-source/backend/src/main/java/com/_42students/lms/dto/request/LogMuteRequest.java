package com._42students.lms.dto.request;

import lombok.Data;

@Data
public class LogMuteRequest {
    private String environment;
    private String message;
    private String httpPath;
    private boolean muted;
}
