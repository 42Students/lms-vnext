package com._42students.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/** Error volume in the minutes just before vs just after a deploy -- "did that release break something?" */
@Data
@Builder
public class DeployHealthResponse {
    private Instant at;
    private int windowMinutes;
    private int errorsBefore;
    private int errorsAfter;
    /** True when either side hit the counting cap, so the real number is at least what is shown. */
    private boolean capped;
    /** OK, ELEVATED (more errors than before) or JUMP (at least double and 5 or more). */
    private String verdict;
}
