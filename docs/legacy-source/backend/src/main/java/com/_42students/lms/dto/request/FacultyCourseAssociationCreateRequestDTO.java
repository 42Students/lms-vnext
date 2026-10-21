package com._42students.lms.dto.request;

import lombok.Data;
import javax.validation.constraints.*;

import java.util.List;

@Data
public class FacultyCourseAssociationCreateRequestDTO {
    @Min(1)
    private int facultyId;
    @NotNull
    private List<Integer> courseIds;
}

