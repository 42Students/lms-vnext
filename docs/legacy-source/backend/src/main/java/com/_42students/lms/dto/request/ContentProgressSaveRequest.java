package com._42students.lms.dto.request;

import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

@Data
public class ContentProgressSaveRequest {

    @NotNull(message = "lessonContentId is required")
    @Positive(message = "lessonContentId must be a positive integer")
    private Integer lessonContentId;

    @Min(0)
    @Max(86400 * 24)
    private int lastPositionSeconds = 0;

    @Min(0)
    @Max(86400 * 24)
    private int durationSeconds = 0;

    /** If true, mark as completed (e.g. watched ≥ 90% or user finished). */
    private Boolean completed;
}

