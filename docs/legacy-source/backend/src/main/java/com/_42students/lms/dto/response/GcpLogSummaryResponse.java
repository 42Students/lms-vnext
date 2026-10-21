package com._42students.lms.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GcpLogSummaryResponse {
    private String insertId;
    private String logName;
    private String timestamp;
    private String severity;
    private String message;
    private String logger;
    private String requestId;
    private String httpMethod;
    private String httpPath;
    private String httpStatus;
    private String durationMs;
    private String namespace;
    private String pod;
    private String container;
    private String userId;
    private String userType;
    private String facultyType;
    private String collegeId;
    private String organizationId;
    private String impersonatorId;
    private String commit;
    private boolean hasException;
}
