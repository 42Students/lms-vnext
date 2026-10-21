package com._42students.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class LogKnownErrorResponse {
    private Long id;
    private String sampleMessage;
    private Instant firstSeenAt;
    private Instant lastSeenAt;
    private long occurrenceCount;
    private boolean muted;
    private String signatureHash;
    private String fixStatus;
    private String fixedInCommit;
    private Instant fixedAt;
    private String statusNote;
    private String mutedReason;
    private String issuePublicId;
    private String lastSeenCommit;
    private Instant regressedAt;
    private String samplePath;
    /** Null when never populated -- see LogAlertSignatureAccount for why it's only known for frontend-reported errors. */
    private Long distinctAccountCount;
}
