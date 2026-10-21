package com._42students.lms.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class MobileAuthStartRequest {
    @NotBlank
    private String phone;
}


