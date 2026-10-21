package com._42students.lms.dto.request;

import lombok.Data;

/** Triage decision for one tracked error: status OPEN, FIXED or EXPECTED. */
@Data
public class LogStatusRequest {
    private String status;
    /** Commit that fixes it (FIXED only). */
    private String commit;
    private String note;
    /** Tracker issue covering this error, if any. */
    private String issuePublicId;
}
