package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class DepartmentDTO {
    @NotBlank @Size(max = 255)
    private String name;

    /** Optional: allow creating departments without chair assignment. */
    @Min(1)
    private Integer deptChairId;

    /** Optional: allow creating departments without vice-chair assignment. */
    @Min(1)
    private Integer deptViceChairId;

    @NotNull
    @Min(1)
    private Integer collegeId;
}

