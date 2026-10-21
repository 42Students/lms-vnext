package com._42students.lms.dto.request;

import lombok.Getter;
import lombok.Setter;
import javax.validation.constraints.*;

/**
 * Request body for apply-to-job endpoint.
 * 2.3: resumeUrl moved from query param to body to avoid URL logging of sensitive data.
 */
@Getter
@Setter
public class ApplyToJobRequest {
    /** Optional resume URL (if null, uses learner profile resume when available). */
    @Pattern(regexp = "^(https?://.*)?$")
    private String resumeUrl;
}

