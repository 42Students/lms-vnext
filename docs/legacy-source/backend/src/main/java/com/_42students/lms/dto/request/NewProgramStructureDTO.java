package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

import java.util.List;

@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class NewProgramStructureDTO {
    @NotNull @Min(1)
    private Integer programId;
    @NotBlank @Size(max = 255)
    private String name;
    @Size(max = 255)
    private String startDate;
    @Size(max = 255)
    private String endDate;
    private List<Integer> courseIds;
    @Size(max = 255)
    private String status;
}

