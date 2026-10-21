package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;

import java.util.List;


@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class ProgramDTO {
    public List<ProgramStructureDTO> programStructure;
    @NotBlank @Size(max = 255)
    private String name;
    @Size(max = 255)
    private String startYear;
    @Size(max = 255)
    private String endYear;
    @Min(1)
    private int deptId;
    /** Duration in years (e.g. 4 for B.Tech). Used when creating via /program/create so it appears in new-program/fetchAll. */
    @Min(1)
    private int durationYears;
}

