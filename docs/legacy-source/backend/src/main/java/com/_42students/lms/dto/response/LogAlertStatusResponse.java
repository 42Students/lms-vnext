package com._42students.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class LogAlertStatusResponse {
    private Instant lastViewedAt;
    private Instant backendStartedAt;
}
