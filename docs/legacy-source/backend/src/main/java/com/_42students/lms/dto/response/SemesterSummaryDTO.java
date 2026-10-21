package com._42students.lms.dto.response;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight semester entry for the learner Courses page's semester picker. Deliberately does
 * not reuse SemesterResponseDTO (programId/programName/totalCredits/nested courses[]) — the
 * picker only needs enough to list and label options.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonNaming(PropertyNamingStrategy.SnakeCaseStrategy.class)
public class SemesterSummaryDTO {
    private Integer id;
    private Integer semesterNumber;
    private String name;
    private Boolean isActive;
}
