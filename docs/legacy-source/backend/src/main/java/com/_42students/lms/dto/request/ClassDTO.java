package com._42students.lms.dto.request;

import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Positive;
import java.sql.Date;

@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
@Data
public class ClassDTO {
    @NotBlank
    private String name;
    private String description;
    private Date startDate;
    private Date endDate;
    @Positive
    private int programId;
    private Integer batchId;
    private int upperLimit;      
    private int lowerLimit;
}

