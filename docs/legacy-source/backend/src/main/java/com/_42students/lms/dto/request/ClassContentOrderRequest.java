package com._42students.lms.dto.request;

import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.util.List;

@Data
public class ClassContentOrderRequest {

    @NotNull(message = "lessonId is required")
    @Positive(message = "lessonId must be positive")
    private Integer lessonId;

    @NotNull(message = "classId is required")
    @Positive(message = "classId must be positive for per-class ordering")
    private Integer classId;

    @NotEmpty(message = "orderedContentIds is required")
    private List<@NotNull @Positive Integer> orderedContentIds;
}

