package com._42students.lms.dto.request;

import java.util.List;
import javax.validation.constraints.*;

public class BulkFacultyCourseAssociationCreateRequestDTO {
    @NotNull
    private List<FacultyCourseAssociationCreateRequestDTO> facultyCourseAssociations;

    public List<FacultyCourseAssociationCreateRequestDTO> getFacultyCourseAssociations() {
        return facultyCourseAssociations;
    }

    public void setFacultyCourseAssociations(List<FacultyCourseAssociationCreateRequestDTO> facultyCourseAssociations) {
        this.facultyCourseAssociations = facultyCourseAssociations;
    }
}

