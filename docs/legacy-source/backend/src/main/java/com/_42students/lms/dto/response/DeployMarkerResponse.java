package com._42students.lms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/** One rollout of the backend: when the first pod of a release came up, which commit, and how many pods. */
@Data
@Builder
public class DeployMarkerResponse {
    private Instant at;
    private String commit;
    private int pods;
}
