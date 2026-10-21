package com._42students.lms.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class GcpLogDetailRequest {
    private String environment;

    @NotBlank
    @Size(max = 512)
    private String insertId;

    @NotBlank
    @Size(max = 1200)
    private String logName;
}
