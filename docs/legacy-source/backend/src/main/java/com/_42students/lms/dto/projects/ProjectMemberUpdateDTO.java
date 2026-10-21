package com._42students.lms.dto.projects;

import lombok.Data;

import javax.validation.constraints.Size;

@Data
public class ProjectMemberUpdateDTO {
    // ProjectMember.displayName/roleLabel/memberStatus have no @Column(length=...), so they map
    // to Hibernate's default VARCHAR(255) with no prior application-level bound — an oversized
    // value threw an unhandled DataException (raw 500) instead of a clean validation error.
    @Size(max = 160, message = "displayName must not exceed 160 characters")
    private String displayName;
    @Size(max = 80, message = "roleLabel must not exceed 80 characters")
    private String roleLabel;
    @Size(max = 40, message = "memberStatus must not exceed 40 characters")
    private String memberStatus;
}
