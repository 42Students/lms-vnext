package com._42students.lms.dto.projects;

import lombok.Data;

import javax.validation.constraints.Size;

@Data
public class AdminProjectReadinessOverrideDTO {
    private Integer collegeId;
    private Boolean override;
    // The service also caps at 2,000 before storing the note and its two audit copies.
    @Size(max = 2000, message = "Note must be 2,000 characters or fewer")
    private String note;
}
