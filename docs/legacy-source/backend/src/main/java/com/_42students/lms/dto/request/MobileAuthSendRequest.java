package com._42students.lms.dto.request;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class MobileAuthSendRequest {
    @NotBlank
    private String phone;

    @NotNull
    private Integer choiceId;

    /** The chosen account's stable key from the list (preferred: choiceId is only its position in that list). */
    private String key;
}


