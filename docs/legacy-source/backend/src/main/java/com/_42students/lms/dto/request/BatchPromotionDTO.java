package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

@Data
@JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
public class BatchPromotionDTO {
    @Min(1)
    private Long batchId;
    @Min(1)
    private Integer targetSemester; // If null, increment by 1
    @Size(max = 7)
    @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "Academic year must use YYYY-YY format, e.g. 2026-27")
    private String newAcademicYear; // Optional: new academic year after promotion
}

