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
 * Request for bulk faculty register: create multiple faculty for a given college.
 */
@Data
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class BulkFacultyRegisterRequest {

    public static final int MAX_FACULTY = 500;

    @NotNull(message = "collegeId is required")
    private Integer collegeId;

    @NotEmpty(message = "faculty list is required")
    @Size(max = MAX_FACULTY, message = "faculty list cannot exceed " + MAX_FACULTY + " items")
    @Valid
    private List<BulkFacultyItem> faculty;
}

