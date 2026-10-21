package com._42students.lms.dto.projects;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Data
public class ProjectMemberUpsertDTO {
    @NotNull(message = "userId is required")
    private Integer userId;
    @NotBlank(message = "userType is required")
    private String userType;
    @Size(max = 160, message = "displayName must not exceed 160 characters")
    private String displayName;
    @Size(max = 80, message = "roleLabel must not exceed 80 characters")
    private String roleLabel;
    @Size(max = 40, message = "memberStatus must not exceed 40 characters")
    private String memberStatus;
}
