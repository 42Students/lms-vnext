package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.List;

/**
 * Request for bulk-register: create multiple learners for a given program/class/college.
 */
@Data
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class BulkRegisterRequest {

    public static final int MAX_LEARNERS = 500;

    @NotNull(message = "collegeId is required")
    private Integer collegeId;

    @NotNull(message = "programId is required")
    private Integer programId;

    @NotNull(message = "classId is required")
    private Integer classId;

    @NotEmpty(message = "learners list is required")
    @Size(max = MAX_LEARNERS, message = "learners list cannot exceed " + MAX_LEARNERS + " items")
    @Valid
    private List<BulkLearnerItem> learners;
}

