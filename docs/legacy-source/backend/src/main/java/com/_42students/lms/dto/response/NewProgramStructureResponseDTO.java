package com._42students.lms.dto.response;

import com._42students.lms.model.NewProgramStructure;
import lombok.Data;

import java.util.List;

@Data
public class NewProgramStructureResponseDTO {

    private String name;
    private int programId;
    private String startDate;
    private String endDate;
    private List<Integer> courseIds;
    private String status;

    public NewProgramStructureResponseDTO() {
        // Default constructor
    }

    public NewProgramStructureResponseDTO(NewProgramStructure programStructure) {
        this.name = programStructure.getName();
        this.programId = programStructure.getProgramId();
        this.startDate = programStructure.getStartDate();
        this.endDate = programStructure.getEndDate();
        this.courseIds = programStructure.getCourseIds();
        this.status = programStructure.getStatus().toString();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int getProgramId() {
        return programId;
    }

    public void setProgramId(int programId) {
        this.programId = programId;
    }

    public String getStartDate() {
        return startDate;
    }

    public void setStartDate(String startDate) {
        this.startDate = startDate;
    }

    public String getEndDate() {
        return endDate;
    }

    public void setEndDate(String endDate) {
        this.endDate = endDate;
    }

    public List<Integer> getCourseIds() {
        return courseIds;
    }

    public void setCourseIds(List<Integer> courseIds) {
        this.courseIds = courseIds;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

