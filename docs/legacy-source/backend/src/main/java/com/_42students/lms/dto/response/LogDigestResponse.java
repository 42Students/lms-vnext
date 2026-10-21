package com._42students.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;

/** What changed in the logs over a period: only the things that need a decision. */
@Data
@Builder
public class LogDigestResponse {
    private Instant since;
    private Instant until;
    private List<Item> newErrors;
    private List<Item> regressions;
    /** Errors marked fixed during the period. */
    private List<Item> fixed;
    /** Open (not fixed, not muted) error types that occurred at least once in the period. */
    private int stillActive;
    private List<DeployMarkerResponse> deploys;
    /** True when there is nothing new and nothing came back. */
    private boolean quiet;

    @Data
    @Builder
    public static class Item {
        private Long id;
        private String message;
        private String path;
        private Instant firstSeenAt;
        private Instant lastSeenAt;
        private long occurrences;
        private String fixedInCommit;
        private String issuePublicId;
    }
}
