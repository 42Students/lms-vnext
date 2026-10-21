package com._42students.lms.dto.request;
import com._42students.lms.enums.StatusType;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.validation.constraints.Size;
import java.util.Date;

@Data
public class BatchRequestDTO {
    @NotBlank
    private String batchName;
    @NotNull
    private Long programId;
    private Date startDate;
    private Date endDate;
    /**
     * Legacy compatibility field only. BatchService ignores client-provided values and derives
     * the authoritative count from learner.class_id -> class.batch_id.
     */
    private Integer currentStudents;
    @Size(max = 7)
    @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "Academic year must use YYYY-YY format, e.g. 2026-27")
    private String academicYear;  // e.g., "2024-25"
    private StatusType status;
}

