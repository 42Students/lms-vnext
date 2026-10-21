package com._42students.lms.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class SwitchOrgRequest {
    /**
     * Target tenant/org key (typically college.uniqueId or a well-known key like "42learn").
     */
    @NotBlank
    private String targetKey;
}


