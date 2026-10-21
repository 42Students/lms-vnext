package com._42students.lms.dto.bugtracker;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class BugTrackerExchangeRequest {
    @NotBlank
    @Size(max = 200)
    private String token;
}
