package com._42students.lms.dto.request;

import com._42students.lms.enums.RoomType;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;
import javax.validation.constraints.*;


@Data
@JsonNaming(PropertyNamingStrategy.LowerCaseWithUnderscoresStrategy.class)
public class LectureHallDTO {
    @Min(1)
    private Integer collegeId;
    @Min(0)
    private Integer deptId;
    @NotBlank @Size(max = 255)
    private String name;
    @Min(1)
    private Integer capacity;
    @Size(max = 255)
    private String description;
    @NotNull
    private RoomType roomType;
}

