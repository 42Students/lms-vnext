package com._42students.lms.dto.projects;

import lombok.Data;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.List;

@Data
public class AdminProjectCreateDTO {
    // ProjectWorkspace.title maps to VARCHAR(160) — an oversized value previously threw an
    // unhandled DataException (raw 500) instead of a clean validation error.
    @NotBlank(message = "title is required")
    @Size(max = 160, message = "title must not exceed 160 characters")
    private String title;
    private String summary;
    @Size(max = 160, message = "courseLabel must not exceed 160 characters")
    private String courseLabel;
    private String status;
    private String phase;
    @Min(value = 0, message = "progress must be between 0 and 100")
    @Max(value = 100, message = "progress must be between 0 and 100")
    private Integer progress;
    private String blocker;
    private String nextAction;
    @Size(max = 80, message = "dueLabel must not exceed 80 characters")
    private String dueLabel;
    private Integer organizationId;
    @NotNull(message = "collegeId is required")
    private Integer collegeId;
    private Integer classId;
    private Integer templateId;
    private Integer mentorId;
    private List<Integer> learnerIds;
}
