package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

/** One faculty item for bulk-register (CSV row). */
@Data
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class BulkFacultyItem {

    public static final int MAX_FIRST_NAME = 255;
    public static final int MAX_LAST_NAME = 255;
    public static final int MAX_MOBILE = 20;
    public static final int MAX_EMAIL = 255;

    @NotBlank(message = "First name is required")
    @Size(max = MAX_FIRST_NAME)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = MAX_LAST_NAME)
    private String lastName;

    @NotBlank(message = "Mobile number is required")
    @Size(max = MAX_MOBILE)
    private String contactMobile;

    @NotNull(message = "Department is required")
    private Integer deptId;

    @Size(max = MAX_EMAIL)
    private String contactMail;

    /** Optional per-row role. Only LECTURER or MENTOR may be bulk-provisioned. */
    @Size(max = 32)
    private String facultyType;
}

