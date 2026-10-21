package com._42students.lms.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;

/** recruiter V1 §10: "Recruiter? Sign in with email." Starts a login attempt keyed by email, not phone. */
@Data
public class RecruiterEmailLoginStartRequest {
    @NotBlank
    private String email;
}
